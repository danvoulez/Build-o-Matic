import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/browser';
import { createBrowserRouter } from 'react-router-dom';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.2,
  });
}

export const withSentryRouter = (router: ReturnType<typeof createBrowserRouter>) => {
  return Sentry.wrapRouter(router);
};