import type { Adapter } from '../index';
import dd from 'datadog-metrics';

export type DatadogConfig = {
  apiKey?: string;
  appKey?: string;
  host?: string;
  prefix?: string;
  flushIntervalSeconds?: number;
};

export class DatadogAdapter implements Adapter {
  id = 'observability:datadog';

  constructor(private cfg: DatadogConfig) {}

  async init(): Promise<void> {
    dd.init({
      apiKey: this.cfg.apiKey,
      host: this.cfg.host,
      prefix: this.cfg.prefix || 'bom.',
      flushIntervalSeconds: this.cfg.flushIntervalSeconds || 15,
    });
  }

  async close(): Promise<void> {}

  gauge(name: string, value: number, tags?: string[]) {
    dd.gauge(name, value, tags);
  }

  increment(name: string, value = 1, tags?: string[]) {
    dd.increment(name, value, tags);
  }
}