export function baseSchema() {
  return `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
}
export function invoicesSchema() {
  return `
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id VARCHAR(64),
  amount NUMERIC(12,2),
  status VARCHAR(32),
  created_at TIMESTAMP DEFAULT NOW()
);
`;
}
export function paymentsSchema() {
  return `
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID,
  amount NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);
`;
}
export function composeSchema(features: string[]) {
  let sql = baseSchema();
  if (features.includes('invoicing')) sql += invoicesSchema();
  if (features.includes('payments')) sql += paymentsSchema();
  return sql;
}