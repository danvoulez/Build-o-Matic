export function baseSchema() {
  return `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
}
export function documentsSchema() {
  return `
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(64),
  name TEXT,
  stored_at TIMESTAMP DEFAULT NOW()
);
`;
}
export function tasksSchema() {
  return `
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  assignee VARCHAR(128),
  status VARCHAR(32) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);
`;
}
export function composeSchema(features: string[]) {
  let sql = baseSchema();
  if (features.includes('documents')) sql += documentsSchema();
  if (features.includes('tasks')) sql += tasksSchema();
  return sql;
}