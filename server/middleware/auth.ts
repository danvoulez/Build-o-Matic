/**
 * Authentication Middleware - JWT-based Auth with Auth0/Clerk
 *
 * Replaces the insecure email-based authentication with proper JWT validation.
 */

import { Request, Response, NextFunction } from 'express';
import { expressjwt, GetVerificationKey } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

/**
 * JWT Authentication Middleware
 * Validates Bearer tokens from Auth0/Clerk
 */
export const authenticateJWT = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 600000, // 10 minutes
    rateLimit: true,
    jwksRequestsPerMinute: 10
  }) as GetVerificationKey,
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
  credentialsRequired: true
});

/**
 * Optional authentication - allows unauthenticated requests
 * Useful for public endpoints that behave differently when authenticated
 */
export const optionalAuth = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    cache: true,
    rateLimit: true
  }) as GetVerificationKey,
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
  credentialsRequired: false
});

/**
 * Extract userId from verified JWT token
 *
 * @param req Express request with auth property set by expressjwt
 * @returns User ID from token (Auth0 'sub' claim)
 */
export function getUserIdFromToken(req: any): string {
  if (!req.auth || !req.auth.sub) {
    throw new Error('No authenticated user found in token');
  }
  return req.auth.sub;
}

/**
 * Extract user email from verified JWT token
 *
 * @param req Express request with auth property
 * @returns User email if present in token
 */
export function getUserEmailFromToken(req: any): string | undefined {
  return req.auth?.email;
}

/**
 * Check if user has specific permission/scope
 *
 * @param req Express request
 * @param requiredScope Scope to check (e.g., 'create:tools', 'admin')
 * @returns true if user has the scope
 */
export function hasScope(req: any, requiredScope: string): boolean {
  if (!req.auth || !req.auth.scope) {
    return false;
  }

  const scopes = req.auth.scope.split(' ');
  return scopes.includes(requiredScope);
}

/**
 * Middleware to require specific scope
 * Returns 403 if user doesn't have the required scope
 *
 * @param scope Required scope
 */
export function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!hasScope(req, scope)) {
      return res.status(403).json({
        ok: false,
        error: 'Insufficient permissions',
        required: scope
      });
    }
    next();
  };
}

/**
 * Error handler for JWT middleware
 * Converts JWT errors into user-friendly responses
 */
export function handleAuthError(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      ok: false,
      error: 'Invalid or missing authentication token',
      code: err.code || 'UNAUTHORIZED',
      message: err.message
    });
  }

  // Pass other errors to default error handler
  next(err);
}

/**
 * Development-only bypass middleware
 * WARNING: Only use in local development!
 *
 * Injects a fake token for testing without Auth0
 */
export function devAuthBypass(
  req: any,
  res: Response,
  next: NextFunction
) {
  if (process.env.NODE_ENV === 'production') {
    return next(); // Never bypass in production
  }

  if (process.env.DEV_AUTH_BYPASS === 'true') {
    // Inject fake auth object
    req.auth = {
      sub: 'dev-user-123',
      email: 'dev@example.com',
      scope: 'create:tools read:tools delete:tools admin'
    };
    console.warn('⚠️  DEV AUTH BYPASS ACTIVE - Do not use in production!');
  }

  next();
}
