import express from 'express';
import { TenSecondDeploymentEngine } from '../../deployer/engine';
import type { ToolPackage, DeploymentTarget } from '../../deployer/engine/types';

export function deployEngineRouter() {
  const router = express.Router();
  const engine = new TenSecondDeploymentEngine();

  // Health/availability probe for frontend
  router.options('/engine', (_req, res) => {
    res.status(200).end();
  });

  router.post('/engine', async (req, res) => {
    try {
      const { toolPackage, target } = req.body as { toolPackage: ToolPackage; target: DeploymentTarget };
      const verified = await engine.deploy(toolPackage, target);
      res.json({ ok: true, result: verified });
    } catch (e: any) {
      res.status(400).json({ ok: false, error: e?.message || 'Engine deployment failed' });
    }
  });

  return router;
}