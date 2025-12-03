/**
 * Minimal structured logger. In production, swap to pino or winston.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

function log(level: Level, msg: string, data?: Record<string, any>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(data || {}),
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

export const logger = {
  debug: (msg: string, data?: Record<string, any>) => log('debug', msg, data),
  info: (msg: string, data?: Record<string, any>) => log('info', msg, data),
  warn: (msg: string, data?: Record<string, any>) => log('warn', msg, data),
  error: (msg: string, data?: Record<string, any>) => log('error', msg, data),
};