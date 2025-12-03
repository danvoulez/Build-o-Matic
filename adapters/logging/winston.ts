import type { Adapter } from '../index';
import winston from 'winston';

export class WinstonLoggingAdapter implements Adapter {
  id = 'logging:winston';
  public logger: winston.Logger;

  constructor(level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.logger = winston.createLogger({
      level,
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });
  }

  async init(): Promise<void> {}

  async close(): Promise<void> {}

  child(meta: Record<string, any>) {
    return this.logger.child(meta);
  }
}