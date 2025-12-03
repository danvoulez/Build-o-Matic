# Sprint 2 & 3 Implementation Plan - "Enterprise Premium"

## Executive Summary

This document details the implementation roadmap to transform Build-o-Matic from a functional MVP into an Enterprise-grade SaaS platform. Based on the UBL architecture and Sprint 1 foundation (security hardening), we now build the **Real Product**.

---

## Current State Analysis

### ✅ Sprint 1 Achievements (Foundation)
- XSS/SQL Injection protection (12 patterns detected)
- Request timeouts (30s configurable)
- CORS whitelist (dynamic patterns)
- Pinned dependencies (eternal reproducibility)
- Payload size limits (100KB DoS protection)
- Offensive words filtering
- HTML/Markdown sanitization

### 🚨 Critical Gaps (What Separates MVP from Enterprise)

#### 1. **Identity & Access Control** - CRITICAL
**Problem:** `server/routes/tools.ts:55` - Hardcoded email `'admin@example.com'`
- Anyone can view/modify tools if they know another user's email
- No JWT validation
- `getOrCreateUserByEmail()` accepts any email without verification

**Impact:** Zero-trust security model violated

#### 2. **API Key Security** - HIGH
**Problem:** `VITE_UBL_API_KEY` exposed in frontend bundle
- Even with CORS, a global key is architectural risk
- No scoped/temporary tokens per Realm

**Impact:** Single key compromise = all Realms compromised

#### 3. **UX Polish** - MEDIUM
**Problem:** Generated tools feel "static"
- `frontend/src/components/LivePreview.tsx` only shows text grid
- Master template lacks micro-interactions
- No motion design feedback

**Impact:** Perceived quality vs competitors

#### 4. **Operational Resilience** - HIGH
**Problem:** No transactional deploy
- If Realm registers but deploy fails → orphaned Realm in UBL
- No compensation logic
- `deployer/engine/rollback.ts` exists but not integrated with `generator/core.ts`

**Impact:** Inconsistent state, manual cleanup required

---

## Implementation Roadmap

### Phase 1: Security & Identity (Sprint 2 - Week 1)

#### Task 2.1: Implement Auth0/Clerk in Build-o-Matic

**Backend Changes:**

1. **Create `server/middleware/auth.ts`:**
```typescript
import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

export const authenticateJWT = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    cache: true,
    rateLimit: true
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

// Extract userId from verified JWT
export function getUserIdFromToken(req: any): string {
  return req.auth.sub; // Auth0 'sub' claim
}
```

2. **Update `server/routes/tools.ts`:**
```typescript
import { authenticateJWT, getUserIdFromToken } from '../middleware/auth';

export function toolsRouter() {
  const router = Router();

  // Protect all routes with JWT
  router.use(authenticateJWT);

  router.get('/', async (req, res) => {
    try {
      // NO MORE EMAIL FROM QUERY - extract from token
      const userId = getUserIdFromToken(req);
      const tools = await listToolsByUser(userId);
      res.json({ ok: true, tools });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const userId = getUserIdFromToken(req);
      const { template_id, name, configuration, realm_id } = req.body;
      // ... rest of logic using userId from token
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message });
    }
  });

  return router;
}
```

3. **Environment Variables:**
```bash
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://build-o-matic-api
AUTH0_CLIENT_ID=<client-id>
AUTH0_CLIENT_SECRET=<client-secret>
```

**Frontend Changes:**

1. **Update `frontend/src/main.tsx`:**
```tsx
import { Auth0Provider } from '@auth0/auth0-react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Auth0Provider
    domain={import.meta.env.VITE_AUTH0_DOMAIN}
    clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: import.meta.env.VITE_AUTH0_AUDIENCE
    }}
  >
    <App />
  </Auth0Provider>
);
```

2. **Create `frontend/src/components/ProtectedRoute.tsx`:**
```tsx
import { useAuth0 } from '@auth0/auth0-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) {
    loginWithRedirect();
    return null;
  }

  return <>{children}</>;
}
```

3. **Update `frontend/src/api.ts` - Add Bearer Token:**
```typescript
import { useAuth0 } from '@auth0/auth0-react';

export function useCreateTool() {
  const { getAccessTokenSilently } = useAuth0();

  return useMutation({
    mutationFn: async (data) => {
      const token = await getAccessTokenSilently();
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return res.json();
    }
  });
}
```

4. **Fix QuestionFlow.tsx Line 55:**
```typescript
// BEFORE:
await createTool({
  email: 'admin@example.com', // ❌ Hardcoded
  template_id: template!.id,
  name: `${answers.companyName} - ${template!.name}`,
  configuration: { ...answers }
});

// AFTER:
await createTool({
  // No email field - backend extracts userId from JWT ✅
  template_id: template!.id,
  name: `${answers.companyName} - ${template!.name}`,
  configuration: { ...answers }
});
```

**Testing:**
- [ ] Verify unauthenticated requests return 401
- [ ] Verify token extraction works (`getUserIdFromToken`)
- [ ] Test with invalid/expired tokens

---

#### Task 2.2: UBL Scoped Token System

**Note:** UBL Antenna is not in this repository. This is a **specification** for the UBL team.

**UBL Antenna New Endpoint:**

```typescript
// POST /auth/delegate
interface DelegateTokenRequest {
  masterKey: string;      // Build-o-Matic's master key
  realmId: string;        // Target Realm
  scopes: string[];       // ['propose:intent', 'query:agreements']
  expiresIn: number;      // TTL in seconds (e.g., 86400 = 24h)
}

interface DelegateTokenResponse {
  token: string;          // Short-lived scoped JWT
  expiresAt: number;      // Unix timestamp
  scopes: string[];
  realmId: string;
}
```

**Implementation in UBL:**
1. Validate `masterKey` against stored Build-o-Matic credential
2. Generate JWT with claims:
   - `realm: realmId`
   - `scopes: ['propose:intent']`
   - `exp: now + expiresIn`
3. Return token

**Rate Limiting (per RealmID):**
```typescript
// Use Redis for distributed counting
const key = `rate:${realmId}:${minute}`;
const count = await redis.incr(key);
await redis.expire(key, 60);

if (count > 100) {
  return res.status(429).json({
    error: 'Rate limit exceeded',
    retryAfter: 60 - (Date.now() % 60000) / 1000
  });
}
```

**Build-o-Matic Integration:**

Update `generator/ubl-integration.ts`:

```typescript
/**
 * Request a scoped token for a specific Realm
 */
export async function requestScopedToken(
  realmId: string,
  ublAntennaUrl: string = process.env.UBL_ANTENNA_URL || 'http://localhost:3000'
): Promise<{ token: string; expiresAt: number } | null> {
  try {
    const response = await fetch(`${ublAntennaUrl}/auth/delegate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.UBL_MASTER_KEY}` // Server-side only
      },
      body: JSON.stringify({
        realmId,
        scopes: ['propose:intent', 'query:agreements'],
        expiresIn: 86400 // 24 hours
      })
    });

    if (!response.ok) {
      console.warn(`Failed to get scoped token for ${realmId}`);
      return null;
    }

    return await response.json();
  } catch (error: any) {
    console.error('Scoped token request failed:', error.message);
    return null;
  }
}
```

Update `generator/packager.ts` to inject scoped token:

```typescript
// In createPackageJson() or similar
const scopedToken = await requestScopedToken(realmId);

const envContent = `
VITE_UBL_API_URL=${process.env.UBL_ANTENNA_URL}
VITE_REALM_ID=${realmId}
VITE_UBL_API_KEY=${scopedToken?.token || 'PLACEHOLDER'}
# Token expires: ${scopedToken ? new Date(scopedToken.expiresAt).toISOString() : 'N/A'}
`;
```

**Security Benefits:**
- ✅ Frontend token limited to single Realm
- ✅ Token expires after 24h (auto-rotation needed)
- ✅ Leaked token only affects one Realm
- ✅ Master key never exposed to browser

---

### Phase 2: Operational Resilience (Sprint 2 - Week 2)

#### Task 2.3: Saga Pattern for Deploy

**Problem:** `generator/core.ts:122-154` registers Realm but has no rollback if deploy fails.

**Solution:** Use state machine with compensation.

Update `generator/core.ts`:

```typescript
export class Generator {
  // ... existing code ...

  async generate(input: GenerationInput, onProgress?: (evt: ProgressEvent) => void): Promise<GeneratedTool> {
    const startTime = Date.now();
    const emit = (p: number, m: string) => onProgress?.({ progress: p, message: m });

    // State tracking for saga
    let realmRegistered = false;
    let realmId: string | null = null;
    let deploymentStarted = false;

    try {
      // ... existing validation and generation code ...

      emit(75, 'Packaging');
      const packaged = await this.packager.package(customized, input.deployTarget);

      // STATE 1: Register Realm
      emit(85, 'Registering Realm in UBL');
      try {
        realmId = generateRealmId(toolId);
        const realmRegistration = await registerRealmInUBL({
          id: realmId,
          name: input.answers.companyName || 'Generated Tool',
          agreements: customized.code.agreements,
          metadata: { toolId, templateId: input.templateId }
        });

        if (!realmRegistration.success) {
          throw new Error(`Realm registration failed: ${realmRegistration.error}`);
        }

        realmRegistered = true;
        logger.info('generate:realm-registered', { toolId, realmId });
        result.config.environment.REALM_ID = realmId;
        (result as any).realmId = realmId;
      } catch (error: any) {
        logger.error('generate:realm-registration-error', { toolId, error: error.message });
        throw new GeneratorError(`Realm registration failed: ${error.message}`);
      }

      // STATE 2: Deploy to Platform
      emit(90, 'Deploying to platform');
      try {
        deploymentStarted = true;
        const deployment = await this.deployToPlatform(packaged, input.deployTarget);
        result.deployment.url = deployment.url;
        logger.info('generate:deploy-complete', { toolId, url: deployment.url });
      } catch (error: any) {
        logger.error('generate:deploy-error', { toolId, error: error.message });
        throw new GeneratorError(`Deployment failed: ${error.message}`);
      }

      emit(100, 'Complete');
      return result;

    } catch (error: any) {
      // COMPENSATION LOGIC (Saga Rollback)
      emit(0, 'Rolling back due to error');

      if (realmRegistered && realmId) {
        logger.warn('generate:compensating-realm', { realmId });
        try {
          await this.compensateRealmRegistration(realmId);
          logger.info('generate:realm-compensated', { realmId });
        } catch (compensateError: any) {
          logger.error('generate:compensation-failed', {
            realmId,
            error: compensateError.message
          });
          // Log to dead-letter queue for manual intervention
        }
      }

      if (deploymentStarted) {
        logger.warn('generate:deployment-partial', { toolId });
        // Future: add deployment rollback if provider supports it
      }

      throw error;
    }
  }

  /**
   * Compensate Realm registration by marking as inactive or deleting
   */
  private async compensateRealmRegistration(realmId: string): Promise<void> {
    const ublAntennaUrl = process.env.UBL_ANTENNA_URL || 'http://localhost:3000';

    const response = await fetch(`${ublAntennaUrl}/realms/${realmId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.UBL_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete Realm: ${response.statusText}`);
    }
  }

  private async deployToPlatform(packaged: any, target: string): Promise<{ url: string }> {
    // Call existing deployer/engine
    const engine = new TenSecondDeploymentEngine();
    const verified = await engine.deploy(packaged.toolPackage, { type: target });
    return { url: verified.url };
  }
}
```

**Database State Tracking:**

Add `status` field to `tools` table:

```sql
ALTER TABLE tools ADD COLUMN generation_state VARCHAR(50) DEFAULT 'pending';
-- States: 'pending', 'generating_code', 'registering_realm', 'deploying', 'active', 'failed'

ALTER TABLE tools ADD COLUMN error_reason TEXT;
```

Update state at each step:

```typescript
await updateToolStatus(toolId, 'registering_realm');
// ... register realm ...
await updateToolStatus(toolId, 'deploying');
// ... deploy ...
await updateToolStatus(toolId, 'active');
```

**Testing:**
- [ ] Simulate Realm registration failure
- [ ] Verify no orphaned Realms
- [ ] Simulate deploy failure after Realm success
- [ ] Verify Realm is deleted (compensation)

---

### Phase 3: UX Premium (Sprint 3 - Week 3)

#### Task 3.1: Framer Motion in Master Template

Update `templates/_master-template.ts`:

```typescript
// Add to imports section
import { motion, AnimatePresence } from 'framer-motion';

// Wrap Layout with AnimatePresence
export const masterFrontendTemplate = \`
function App() {
  return (
    <AnimatePresence mode="wait">
      <Layout>
        <Routes>
          <Route path="/" element={
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard />
            </motion.div>
          } />
        </Routes>
      </Layout>
    </AnimatePresence>
  );
}

// Button feedback
function ActionButton({ onClick, loading, children }: any) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="btn"
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          ⏳
        </motion.div>
      ) : children}
    </motion.button>
  );
}

// List animations
function DataGrid({ items }: any) {
  return (
    <motion.ul layout>
      {items.map((item: any) => (
        <motion.li
          key={item.id}
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  );
}
\`;
```

**Add to packager.ts dependencies:**

```typescript
"framer-motion": "11.11.17"
```

---

#### Task 3.2: Live Preview Premium

Update `frontend/src/components/LivePreview.tsx`:

```tsx
import React from 'react';
import { motion } from 'framer-motion';

export default function LivePreview({
  template,
  answers
}: {
  template: any;
  answers: Record<string, any>
}) {
  // Theme preview based on answers
  const theme = answers.theme || 'modern';
  const primaryColor = theme === 'modern' ? '#3B82F6' :
                       theme === 'classic' ? '#1E40AF' : '#059669';

  return (
    <div className="mt-4 p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">👁️</span>
        Pré-visualização Ao Vivo
      </h4>

      {/* Mock UI Preview */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: primaryColor }}
            >
              {answers.companyName || 'Your Company'}
            </h2>
            <p className="text-sm text-gray-500">
              {template?.name || 'Tool Preview'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Action Button
          </motion.button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {['Dashboard', 'Analytics', 'Settings'].map((item) => (
            <motion.div
              key={item}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              <h3 className="font-semibold mb-2">{item}</h3>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded" />
            </motion.div>
          ))}
        </div>

        {/* Features Preview */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Recursos Selecionados:
          </p>
          <div className="flex flex-wrap gap-2">
            {(answers.features || []).map((feature: string) => (
              <motion.span
                key={feature}
                className="px-3 py-1 rounded-full text-sm text-white"
                style={{ backgroundColor: primaryColor }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {feature}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Config Summary */}
      <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded text-xs">
        <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
          <div><span className="font-semibold">Indústria:</span> {answers.industry || '—'}</div>
          <div><span className="font-semibold">Usuários:</span> {answers.users || '—'}</div>
          <div><span className="font-semibold">Integrações:</span> {(answers.integrations || []).length}</div>
          <div><span className="font-semibold">Deploy:</span> {answers.deployTarget || '—'}</div>
        </div>
      </div>
    </div>
  );
}
```

---

#### Task 3.3: Personalized Documentation Generator

Create `generator/docs-engine.ts`:

```typescript
/**
 * Docs Engine - Generates personalized USER_GUIDE.md
 */
import { TemplateDefinition } from './template-engine';

export class DocsEngine {
  generate(template: TemplateDefinition, answers: Record<string, any>): string {
    const companyName = answers.companyName || 'Your Company';
    const features = answers.features || [];
    const integrations = answers.integrations || [];

    return `# ${companyName} - User Guide

## Welcome to Your ${template.name}

This guide was automatically generated based on your configuration.

---

## 🚀 Quick Start

### Step 1: Access Your Tool

Your tool is deployed at: \`[DEPLOYMENT_URL]\`

### Step 2: First Login

1. Navigate to the login page
2. Enter your credentials
3. You'll be redirected to the dashboard

---

## 📋 Available Features

${features.map((feature: string) => `
### ${feature}

[Auto-generated description based on selected feature]

**How to use:**
1. Navigate to the ${feature} section
2. Click "New ${feature}"
3. Fill in the required fields
4. Click "Save"
`).join('\n')}

---

## 🔌 Active Integrations

${integrations.length > 0 ? integrations.map((integration: string) => `
### ${integration}

This tool is integrated with ${integration}.

**Configuration:**
- Webhook URL: \`[DEPLOYMENT_URL]/webhooks/${integration.toLowerCase()}\`
- API Key: Available in Settings → Integrations

`).join('\n') : 'No integrations configured.'}

---

## 🛠️ Administration

### User Management

To add a new user:
1. Go to Settings → Users
2. Click "Invite User"
3. Enter email address
4. Select role

### Backup & Export

Your data is automatically backed up daily. To export:
1. Go to Settings → Data
2. Click "Export All Data"
3. Download the ZIP file

---

## 📞 Support

For technical support, contact:
- Email: support@${companyName.toLowerCase().replace(/\s+/g, '')}.com
- Documentation: [DEPLOYMENT_URL]/docs

---

**Generated by Build-o-Matic**
*Template: ${template.name}*
*Date: ${new Date().toISOString().split('T')[0]}*
`;
  }
}
```

Integrate in `generator/packager.ts`:

```typescript
import { DocsEngine } from './docs-engine';

export class Packager {
  private docsEngine = new DocsEngine();

  async package(customized: any, deployTarget: string) {
    // ... existing code ...

    // Generate USER_GUIDE.md
    const userGuide = this.docsEngine.generate(
      customized.template,
      customized.answers
    );

    // Add to zip
    zip.file('USER_GUIDE.md', userGuide);

    // ... rest of packaging ...
  }
}
```

---

## Testing Strategy

### Security Tests
```bash
# Auth0 Integration
npm run test:auth

# Scoped Token Flow
npm run test:ubl-tokens

# Saga Rollback
npm run test:saga
```

### UX Tests
```bash
# Visual regression tests for LivePreview
npm run test:visual

# Motion performance
npm run test:animations
```

---

## Success Metrics

| Metric | Before Sprint 2 | Target | How to Measure |
|--------|----------------|--------|----------------|
| **Auth Vulnerabilities** | High (email-based) | Zero | Penetration test |
| **Orphaned Realms** | Unknown | 0% | UBL audit query |
| **API Key Scope** | Global | Per-Realm | Token inspection |
| **User Perceived Quality** | "Functional" | "Premium" | User survey (1-10) |
| **Deploy Success Rate** | ~95% | 99.5% | Telemetry logs |
| **Docs Customization** | Generic README | Personalized | Manual review |

---

## Rollout Plan

### Week 1 (Sprint 2)
- [ ] Day 1-2: Auth0 backend integration
- [ ] Day 3-4: Auth0 frontend + protected routes
- [ ] Day 5: Testing & bug fixes

### Week 2 (Sprint 2 continued)
- [ ] Day 1-2: Saga pattern implementation
- [ ] Day 3-4: UBL scoped token spec + Build-o-Matic integration
- [ ] Day 5: Integration tests

### Week 3 (Sprint 3)
- [ ] Day 1-2: Framer Motion in master template
- [ ] Day 3: LivePreview premium component
- [ ] Day 4: Docs generator
- [ ] Day 5: End-to-end QA

---

## Dependencies & Prerequisites

### External Services
- [ ] Auth0 account (or Clerk)
- [ ] UBL Antenna deployed and accessible
- [ ] Redis for rate limiting (UBL side)

### Environment Variables
```bash
# New variables needed
AUTH0_DOMAIN=tenant.auth0.com
AUTH0_AUDIENCE=https://build-o-matic-api
AUTH0_CLIENT_ID=xxx
AUTH0_CLIENT_SECRET=xxx
UBL_MASTER_KEY=xxx
```

---

## Appendix: UBL Antenna Changes Needed

**Note:** This repository does not contain UBL Antenna code. The following must be implemented in the UBL repository:

1. **POST /auth/delegate** - Scoped token generation
2. **DELETE /realms/:id** - Realm cleanup for saga compensation
3. **Rate limiting middleware** - Per-RealmID throttling
4. **Redis integration** - Distributed rate limit counters

Coordinate with UBL team before starting Sprint 2.

---

**Document Version:** 1.0
**Last Updated:** 2025-12-03
**Author:** Build-o-Matic Engineering Team
