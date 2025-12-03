import { Router } from 'express';
import { runDockerBuild } from '../../deployer/docker-runner';

export function dockerRouter() {
  const router = Router();

  // POST /api/docker/run
  // Body: { artifactBase64: string, outDir?: string }
  router.post('/run', async (req, res) => {
    try {
      const { artifactBase64, outDir } = req.body || {};
      if (!artifactBase64) {
        return res.status(400).json({ ok: false, error: 'artifactBase64 is required' });
      }
      const artifact = Buffer.from(artifactBase64, 'base64');
      const result = await runDockerBuild(artifact, outDir || './generated');
      res.json({ ok: true, result });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message ?? 'Docker run failed' });
    }
  });

  return router;
}