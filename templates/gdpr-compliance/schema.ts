/**
 * Optional schema helper for GDPR template (can be leveraged by generator/customizer).
 * Exposes functions to compose SQL fragments based on features.
 */

export function baseSchema() {
  return `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
`;
}

export function consentSchema() {
  return `
CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(64) NOT NULL,
  consent_type VARCHAR(64) NOT NULL,
  granted_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;
}

export function auditSchema() {
  return `
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(128) NOT NULL,
  actor VARCHAR(128),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;
}

export function deletionSchema() {
  return `
CREATE TABLE IF NOT EXISTS deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  requested_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;
}

export function composeSchema(features: string[]) {
  let sql = baseSchema();
  if (features.includes('consent-tracking')) sql += consentSchema();
  if (features.includes('audit-log')) sql += auditSchema();
  if (features.includes('data-deletion')) sql += deletionSchema();
  return sql;
}