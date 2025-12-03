// Global test setup for Vitest
import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.BILLING_BYPASS = 'true';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/buildomatic';

// Silence noisy logs during tests (optional)
const originalLog = console.log;
console.log = (...args: any[]) => {
  if (String(args[0]).includes('server:started')) return;
  originalLog(...args);
};