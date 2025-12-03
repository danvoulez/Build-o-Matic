/**
 * SSE stream now uses generator progress callbacks for real steps.
 */
import { Request, Response } from 'express';
import { Generator } from '../generator/core';
import { logger } from './logger';

const generator = new Generator();

export async function generateSSE(req: Request, res: Response) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  function send(type: string, data: any) {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  }
  function progress(p: number, message: string) {
    send('progress', { progress: Math.min(100, Math.max(0, p)), message });
  }

  try {
    const { templateId, answers, userId, deployTarget } = req.body || {};
    if (!templateId || !deployTarget) {
      send('error', { error: 'Missing templateId or deployTarget' });
      return res.end();
    }

    const result = await generator.generate(
      { templateId, answers: answers || {}, userId, deployTarget },
      ({ progress: p, message: m }) => progress(p, m)
    );

    send('complete', { result });
    res.end();
  } catch (error: any) {
    logger.error('generateSSE:error', { error: error?.message });
    send('error', { error: error?.message ?? 'Unknown generation error' });
    res.end();
  }
}