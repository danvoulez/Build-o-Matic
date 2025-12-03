# UBL Antenna Implementation Requirements - Sprint 2

## Overview

This document specifies the changes required in the **UBL Antenna** repository to support the Build-o-Matic Sprint 2 security enhancements. These changes are critical for implementing:

1. **Scoped Token System** - Per-Realm API keys with limited permissions
2. **Rate Limiting** - Per-RealmID request throttling
3. **Realm Deletion Endpoint** - For Saga pattern rollback

---

## 1. Scoped Token System

### Problem Statement

Currently, the Build-o-Matic injects a global `UBL_API_KEY` into generated frontend bundles. This poses several risks:

- **Single Point of Failure:** If one key is leaked, all Realms are compromised
- **No Granularity:** Keys have full permissions across all operations
- **Long-Lived:** Keys never expire, increasing attack window
- **Client-Side Exposure:** Keys are visible in browser dev tools

### Solution: Delegate Token Endpoint

Implement a token delegation system where Build-o-Matic can request short-lived, scoped tokens for specific Realms.

---

### API Specification

#### POST /auth/delegate

Creates a scoped, time-limited token for a specific Realm.

**Authentication:** Requires Build-o-Matic's master API key

**Request:**

```json
{
  "realmId": "realm-tool-1733234567-abc123",
  "scopes": ["propose:intent", "query:agreements", "chat:agent"],
  "expiresIn": 86400
}
```

**Request Headers:**

```
Authorization: Bearer {BUILD_O_MATIC_MASTER_KEY}
Content-Type: application/json
```

**Response (200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1733320967,
  "scopes": ["propose:intent", "query:agreements", "chat:agent"],
  "realmId": "realm-tool-1733234567-abc123"
}
```

**Error Responses:**

```json
// 401 Unauthorized
{
  "error": "Invalid or missing master key"
}

// 400 Bad Request
{
  "error": "Invalid realmId or scopes"
}

// 404 Not Found
{
  "error": "Realm not found"
}
```

---

### Implementation Details

#### Token Format

Use **JWT (JSON Web Tokens)** with the following claims:

```json
{
  "iss": "ubl-antenna",
  "sub": "realm-tool-1733234567-abc123",
  "aud": "ubl-api",
  "exp": 1733320967,
  "iat": 1733234567,
  "scopes": ["propose:intent", "query:agreements"],
  "realm": "realm-tool-1733234567-abc123"
}
```

#### Signing

- **Algorithm:** HS256 (HMAC with SHA-256)
- **Secret:** Stored in environment variable `JWT_SECRET`
- **Key Rotation:** Support key rotation via `JWT_SECRET_PREVIOUS` for graceful rollover

#### Scope Definitions

| Scope | Description | Allowed Operations |
|-------|-------------|-------------------|
| `propose:intent` | Create new intents | POST /intend |
| `query:agreements` | Read agreement data | POST /query (type=agreement) |
| `query:entities` | Read entity data | POST /query (type=entity) |
| `chat:agent` | Interact with AI agent | POST /chat |
| `read:*` | Read all data | All GET/POST queries |
| `write:*` | Full write access | All POST operations |
| `admin` | Full realm control | All operations including DELETE |

#### Token Validation Middleware

Create middleware `validateScopedToken.ts`:

```typescript
import jwt from 'jsonwebtoken';

export function validateScopedToken(requiredScope?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      // Validate realm matches request
      if (req.body.realm && req.body.realm !== decoded.realm) {
        return res.status(403).json({ error: 'Token realm mismatch' });
      }

      // Validate scopes
      if (requiredScope && !decoded.scopes.includes(requiredScope)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredScope,
          provided: decoded.scopes
        });
      }

      // Attach to request for downstream use
      req.auth = {
        realmId: decoded.realm,
        scopes: decoded.scopes
      };

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}
```

#### Apply to Endpoints

Update existing endpoints:

```typescript
// Before
app.post('/intend', async (req, res) => { ... });

// After
app.post('/intend', validateScopedToken('propose:intent'), async (req, res) => {
  // Verify req.auth.realmId matches req.body.realm
  if (req.auth.realmId !== req.body.realm) {
    return res.status(403).json({ error: 'Realm access denied' });
  }
  // ... rest of handler
});
```

---

## 2. Rate Limiting per RealmID

### Problem Statement

Without rate limiting, a single malicious (or buggy) frontend can overwhelm the UBL Antenna with requests, affecting all other tenants.

### Solution: Redis-Based Rate Limiting

Implement per-Realm request throttling using Redis.

---

### Rate Limit Configuration

| Tier | Soft Limit | Hard Limit | Window |
|------|-----------|-----------|--------|
| **Free** | 100 req/min | 500 req/min | 60s |
| **Pro** | 500 req/min | 2000 req/min | 60s |
| **Enterprise** | 2000 req/min | 10000 req/min | 60s |

- **Soft Limit:** Log warning, continue processing
- **Hard Limit:** Return 429 Too Many Requests

---

### Implementation

#### Dependencies

```bash
npm install ioredis
npm install @types/ioredis --save-dev
```

#### Redis Client Setup

```typescript
// lib/redis.ts
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  }
});
```

#### Rate Limiter Middleware

```typescript
// middleware/rate-limiter.ts
import { redis } from '../lib/redis';

interface RateLimitConfig {
  softLimit: number;
  hardLimit: number;
  windowSeconds: number;
}

const TIER_CONFIGS: Record<string, RateLimitConfig> = {
  free: { softLimit: 100, hardLimit: 500, windowSeconds: 60 },
  pro: { softLimit: 500, hardLimit: 2000, windowSeconds: 60 },
  enterprise: { softLimit: 2000, hardLimit: 10000, windowSeconds: 60 }
};

export function rateLimitByRealm() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const realmId = req.auth?.realmId || req.body?.realm;
    if (!realmId) {
      return next(); // No realm to limit
    }

    // Get realm tier from database
    const realm = await getRealm(realmId); // Implement this
    const tier = realm?.tier || 'free';
    const config = TIER_CONFIGS[tier];

    // Current minute bucket
    const minute = Math.floor(Date.now() / 1000 / 60);
    const key = `rate:${realmId}:${minute}`;

    try {
      // Increment counter
      const count = await redis.incr(key);

      // Set expiry on first request
      if (count === 1) {
        await redis.expire(key, config.windowSeconds);
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.hardLimit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.hardLimit - count));
      res.setHeader('X-RateLimit-Reset', (minute + 1) * 60);

      // Hard limit enforcement
      if (count > config.hardLimit) {
        const resetTime = (minute + 1) * 60 - Math.floor(Date.now() / 1000);
        res.setHeader('Retry-After', resetTime);

        return res.status(429).json({
          error: 'Rate limit exceeded',
          limit: config.hardLimit,
          window: `${config.windowSeconds}s`,
          retryAfter: resetTime
        });
      }

      // Soft limit warning
      if (count > config.softLimit && count <= config.hardLimit) {
        console.warn('Rate limit soft threshold exceeded', {
          realmId,
          count,
          softLimit: config.softLimit,
          tier
        });
        res.setHeader('X-RateLimit-Warning', 'Approaching rate limit');
      }

      next();
    } catch (error) {
      // If Redis fails, allow request but log error
      console.error('Rate limiter error:', error);
      next();
    }
  };
}
```

#### Apply Globally

```typescript
// server.ts
import { rateLimitByRealm } from './middleware/rate-limiter';

// Apply after auth middleware
app.use(validateScopedToken());
app.use(rateLimitByRealm());
```

---

### Client-Side Handling (Build-o-Matic Generated Code)

Update `packages/ubl-client/src/index.ts`:

```typescript
private async fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await this.fetchWithTimeout(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      console.warn(`Rate limited. Retrying after ${retryAfter}s...`);

      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    return response;
  }

  throw new Error('Rate limit retries exhausted');
}
```

---

## 3. Realm Deletion Endpoint (Saga Rollback)

### Problem Statement

When tool generation fails after Realm creation, we need to clean up the orphaned Realm to maintain data consistency.

### Solution: Realm Deletion API

Add endpoint for administrative Realm deletion.

---

### API Specification

#### DELETE /realms/:realmId

Permanently deletes a Realm and all associated data.

**Authentication:** Requires master key (Build-o-Matic)

**Request:**

```http
DELETE /realms/realm-tool-1733234567-abc123 HTTP/1.1
Authorization: Bearer {BUILD_O_MATIC_MASTER_KEY}
```

**Response (200 OK):**

```json
{
  "success": true,
  "realmId": "realm-tool-1733234567-abc123",
  "deletedAt": "2025-12-03T10:30:00Z",
  "itemsDeleted": {
    "events": 42,
    "agreements": 3,
    "entities": 12
  }
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "error": "Realm not found",
  "realmId": "realm-tool-1733234567-abc123"
}

// 409 Conflict
{
  "error": "Cannot delete active realm with users",
  "activeUsers": 5
}

// 403 Forbidden
{
  "error": "Insufficient permissions to delete realm"
}
```

---

### Implementation

```typescript
// routes/realms.ts
app.delete('/realms/:realmId', authenticateMasterKey, async (req, res) => {
  const { realmId } = req.params;

  try {
    // Verify realm exists
    const realm = await getRealm(realmId);
    if (!realm) {
      return res.status(404).json({ error: 'Realm not found', realmId });
    }

    // Safety check: prevent deleting active realms
    const activeUsers = await getActiveUserCount(realmId);
    if (activeUsers > 0) {
      return res.status(409).json({
        error: 'Cannot delete active realm with users',
        activeUsers
      });
    }

    // Perform cascading delete
    const deletedItems = await deleteRealmCascade(realmId);

    res.json({
      success: true,
      realmId,
      deletedAt: new Date().toISOString(),
      itemsDeleted: deletedItems
    });
  } catch (error: any) {
    console.error('Realm deletion failed:', error);
    res.status(500).json({ error: error.message });
  }
});

async function deleteRealmCascade(realmId: string) {
  // Delete in order to maintain referential integrity
  const eventsDeleted = await db.events.deleteMany({ realmId });
  const agreementsDeleted = await db.agreements.deleteMany({ realmId });
  const entitiesDeleted = await db.entities.deleteMany({ realmId });
  await db.realms.delete({ id: realmId });

  return {
    events: eventsDeleted.count,
    agreements: agreementsDeleted.count,
    entities: entitiesDeleted.count
  };
}
```

---

## 4. Environment Variables

Add to UBL Antenna `.env`:

```bash
# JWT Token System
JWT_SECRET=<random-256-bit-secret>
JWT_SECRET_PREVIOUS=<previous-secret-for-rotation>

# Rate Limiting
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>

# Build-o-Matic Integration
BUILD_O_MATIC_MASTER_KEY=<shared-secret-key>
```

---

## 5. Testing Checklist

### Scoped Tokens

- [ ] Generate token with valid master key
- [ ] Reject token generation with invalid master key
- [ ] Token expires after specified duration
- [ ] Token with `propose:intent` scope can POST to /intend
- [ ] Token with `propose:intent` scope CANNOT POST to /delete-realm
- [ ] Token for realm-A CANNOT access data in realm-B
- [ ] Expired tokens return 401
- [ ] Malformed tokens return 401

### Rate Limiting

- [ ] Requests under soft limit proceed normally
- [ ] Requests over soft limit log warning but proceed
- [ ] Requests over hard limit return 429
- [ ] 429 response includes `Retry-After` header
- [ ] Rate limits reset after window expires
- [ ] Different realms have independent counters
- [ ] Redis failure doesn't block requests (fail-open)

### Realm Deletion

- [ ] Master key can delete realm
- [ ] Scoped token CANNOT delete realm
- [ ] Deleting non-existent realm returns 404
- [ ] Deleting active realm returns 409
- [ ] Successful deletion removes all related data
- [ ] Deletion is idempotent (safe to retry)

---

## 6. Migration Plan

### Phase 1: Add New Endpoints (Non-Breaking)

1. Deploy `/auth/delegate` endpoint
2. Deploy rate limiting middleware (set high limits initially)
3. Deploy `DELETE /realms/:id` endpoint
4. Monitor logs for errors

### Phase 2: Update Build-o-Matic (Coordinated)

1. Build-o-Matic starts requesting scoped tokens
2. Generated frontends use scoped tokens
3. Monitor token generation success rate

### Phase 3: Deprecate Global Keys (After 30 Days)

1. Reduce rate limits for global keys
2. Log warnings when global keys are used
3. Eventually reject global keys for tenant operations

---

## 7. Monitoring & Observability

### Metrics to Track

```typescript
// Prometheus metrics
const scopedTokensGenerated = new Counter({
  name: 'ubl_scoped_tokens_generated_total',
  help: 'Total scoped tokens generated',
  labelNames: ['realm_tier']
});

const rateLimitExceeded = new Counter({
  name: 'ubl_rate_limit_exceeded_total',
  help: 'Total rate limit violations',
  labelNames: ['realm_id', 'tier']
});

const realmDeletions = new Counter({
  name: 'ubl_realm_deletions_total',
  help: 'Total realm deletions',
  labelNames: ['reason']
});
```

### Alerts

- **Critical:** Rate limit exceeded for >10% of realms
- **Warning:** Scoped token generation failures >1%
- **Info:** Realm deletion (for audit purposes)

---

## 8. Documentation

Update UBL Antenna API documentation:

- Add `/auth/delegate` to OpenAPI spec
- Document rate limit headers
- Add rate limit best practices guide
- Document `DELETE /realms/:id` endpoint

---

## Questions for UBL Team

1. **Database Schema:** Do we need migrations for realm tier tracking?
2. **Redis Infrastructure:** Is Redis already deployed? If not, what's the timeline?
3. **Token Rotation:** How often should JWT_SECRET rotate?
4. **Realm Deletion:** Should we soft-delete (mark inactive) instead of hard-delete?
5. **Monitoring:** Which metrics platform is UBL using? (Prometheus, Datadog, etc.)

---

## Estimated Implementation Time

| Task | Effort | Dependencies |
|------|--------|-------------|
| Scoped Token Endpoint | 2 days | JWT library |
| Token Validation Middleware | 1 day | Token endpoint |
| Rate Limiting | 2 days | Redis setup |
| Realm Deletion | 1 day | None |
| Testing | 2 days | All above |
| Documentation | 1 day | All above |
| **Total** | **9 days** | |

---

## Success Criteria

- [ ] All tests passing (see Testing Checklist)
- [ ] API documentation updated
- [ ] Monitoring dashboards created
- [ ] Build-o-Matic integration verified in staging
- [ ] Zero downtime deployment completed
- [ ] Runbook created for on-call engineers

---

**Document Version:** 1.0
**Last Updated:** 2025-12-03
**Contact:** Build-o-Matic Engineering Team
