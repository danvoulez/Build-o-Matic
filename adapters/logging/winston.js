import winston from 'winston';
export class WinstonLoggingAdapter {
    constructor(level = 'info') {
        this.id = 'logging:winston';
        this.logger = winston.createLogger({
            level,
            format: winston.format.json(),
            transports: [new winston.transports.Console()],
        });
    }
    async init() { }
    async close() { }
    child(meta) {
        return this.logger.child(meta);
    }
}
