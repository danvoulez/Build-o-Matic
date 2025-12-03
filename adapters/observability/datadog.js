import dd from 'datadog-metrics';
export class DatadogAdapter {
    constructor(cfg) {
        this.cfg = cfg;
        this.id = 'observability:datadog';
    }
    async init() {
        dd.init({
            apiKey: this.cfg.apiKey,
            host: this.cfg.host,
            prefix: this.cfg.prefix || 'bom.',
            flushIntervalSeconds: this.cfg.flushIntervalSeconds || 15,
        });
    }
    async close() { }
    gauge(name, value, tags) {
        dd.gauge(name, value, tags);
    }
    increment(name, value = 1, tags) {
        dd.increment(name, value, tags);
    }
}
