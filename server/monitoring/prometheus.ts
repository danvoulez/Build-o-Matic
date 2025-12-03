import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Default registry and metrics
export const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'bom_' });

// Custom app metrics
export const httpRequestCounter = new client.Counter({
  name: 'bom_http_requests_total',
  help: 'Total HTTP requests handled',
  labelNames: ['method', 'route', 'status'],
});
register.registerMetric(httpRequestCounter);

export const generationHistogram = new client.Histogram({
  name: 'bom_generation_duration_seconds',
  help: 'Generation duration in seconds',
  buckets: [0.5, 1, 2, 5, 8, 10, 15, 20], // buckets tailored to target
  labelNames: ['template', 'deployTarget', 'status'],
});
register.registerMetric(generationHistogram);

// Express middleware to record requests
export function metricsMiddleware() {
  return function (req: Request, res: Response, next: NextFunction) {
    const route = req.route?.path || req.path;
    const method = req.method;
    const end = res.end;
    res.end = function (...args: any[]) {
      const status = res.statusCode.toString();
      httpRequestCounter.inc({ method, route, status });
      // @ts-ignore
      end.apply(res, args);
    };
    next();
  };
}

// Endpoint handler for /metrics
export async function metricsHandler(_req: Request, res: Response) {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
}