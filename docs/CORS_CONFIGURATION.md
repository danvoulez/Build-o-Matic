# CORS Configuration Guide

## Overview

Cross-Origin Resource Sharing (CORS) is critical for securing the Build-o-Matic system and preventing unauthorized access from malicious domains.

## Build-o-Matic Server CORS

The Build-o-Matic server (`server/index.ts`) is configured with a dynamic whitelist that automatically allows:

- **Development**: `localhost` and `127.0.0.1` on any port
- **Production Deploys**:
  - `*.vercel.app` (Vercel)
  - `*.netlify.app` (Netlify)
  - `*.railway.app` (Railway)
  - `*.render.com` (Render)

### Configuration

```typescript
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedPatterns = [
      /^https?:\/\/localhost(:\d+)?$/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.netlify\.app$/,
      /^https:\/\/.*\.railway\.app$/,
      /^https:\/\/.*\.render\.com$/,
    ];
    
    if (!origin || allowedPatterns.some(pattern => pattern.test(origin))) {
      callback(null, true);
    } else {
      logger.warn('cors:blocked', { origin });
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Subscription-Active'],
  maxAge: 86400
};
```

## UBL Antenna CORS Configuration

If you're deploying the Universal Business Ledger (UBL) separately, you'll need to configure CORS on the UBL Antenna server to allow requests from generated tools.

### Recommended Configuration

**Development:**
```javascript
// Allow all origins for local development
app.use(cors());
```

**Production:**
```javascript
// Dynamic whitelist for production
const corsOptions = {
  origin: (origin, callback) => {
    const allowedPatterns = [
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.netlify\.app$/,
      /^https:\/\/.*\.railway\.app$/,
      /^https:\/\/.*\.render\.com$/,
      // Add your custom domains
      /^https:\/\/yourdomain\.com$/,
    ];
    
    // For MVP/Beta: Allow all subdomains temporarily
    // Remove this before production launch
    if (process.env.ALLOW_ALL_SUBDOMAINS === 'true') {
      callback(null, true);
      return;
    }
    
    if (!origin || allowedPatterns.some(p => p.test(origin))) {
      callback(null, true);
    } else {
      console.warn('CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};

app.use(cors(corsOptions));
```

### Environment Variables

Add to UBL `.env`:

```bash
# CORS Configuration
ALLOW_ALL_SUBDOMAINS=false  # Set to true only for MVP/testing
CORS_MAX_AGE=86400
```

## Security Best Practices

### 1. Tighten Whitelist Post-Beta

After the beta phase, replace wildcard patterns with specific domains:

```javascript
const allowedOrigins = [
  'https://my-tool-123.vercel.app',
  'https://my-tool-456.vercel.app',
  'https://production-domain.com'
];
```

### 2. Implement Domain Registration

Store allowed origins in database:

```sql
CREATE TABLE allowed_origins (
  id SERIAL PRIMARY KEY,
  realm_id VARCHAR(255) NOT NULL,
  origin VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Query at runtime:

```javascript
const getAllowedOrigins = async () => {
  const result = await db.query('SELECT origin FROM allowed_origins');
  return result.rows.map(r => r.origin);
};
```

### 3. Rate Limiting per Origin

Prevent abuse by limiting requests per origin:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each origin to 100 requests per window
  keyGenerator: (req) => req.headers.origin || req.ip
});

app.use('/api/', limiter);
```

### 4. Monitor CORS Violations

Log and alert on repeated CORS violations:

```javascript
let corsViolations = new Map();

function trackCorsViolation(origin) {
  const count = (corsViolations.get(origin) || 0) + 1;
  corsViolations.set(origin, count);
  
  if (count > 10) {
    // Alert security team
    logger.error('cors:potential-attack', { origin, count });
  }
}
```

## Testing CORS

### Local Testing

```bash
# Test allowed origin
curl -H "Origin: https://my-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS http://localhost:4000/api/generate

# Test blocked origin
curl -H "Origin: https://evil-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:4000/api/generate
```

### Automated Tests

Add to test suite:

```typescript
describe('CORS Policy', () => {
  it('should allow Vercel domains', async () => {
    const res = await request(app)
      .options('/api/generate')
      .set('Origin', 'https://my-app.vercel.app')
      .expect(204);
    
    expect(res.headers['access-control-allow-origin']).toBe('https://my-app.vercel.app');
  });

  it('should block unknown domains', async () => {
    await request(app)
      .options('/api/generate')
      .set('Origin', 'https://evil-site.com')
      .expect(500);
  });
});
```

## Troubleshooting

### "No 'Access-Control-Allow-Origin' header"

**Cause:** Frontend origin not in whitelist
**Solution:** Add domain pattern to `allowedPatterns` array

### Preflight requests failing

**Cause:** OPTIONS requests not handled
**Solution:** Ensure CORS middleware is before route handlers

### Credentials not working

**Cause:** `credentials: true` not set or origin is `*`
**Solution:** Use specific origins, not wildcard, when using credentials

## Production Checklist

- [ ] Remove `ALLOW_ALL_SUBDOMAINS=true` flag
- [ ] Replace wildcard patterns with specific domains
- [ ] Implement domain registration system
- [ ] Add rate limiting per origin
- [ ] Set up CORS violation monitoring
- [ ] Add automated CORS tests to CI/CD
- [ ] Document allowed origins in security runbook
- [ ] Review and update allowed domains quarterly

## References

- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [OWASP CORS Security](https://owasp.org/www-community/attacks/Cross_Site_Request_Forgery)
- [Express CORS Package](https://expressjs.com/en/resources/middleware/cors.html)
