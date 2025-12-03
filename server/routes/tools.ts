import { Router } from 'express';
import { getOrCreateUserByEmail } from '../models/users';
import { createTool, listToolsByUser, getTool, updateToolStatus, setToolDeployment } from '../models/tools';
import { authenticateJWT, getUserIdFromToken, getUserEmailFromToken, devAuthBypass } from '../middleware/auth';

export function toolsRouter() {
  const router = Router();

  // Apply authentication to all routes
  // In development, devAuthBypass allows testing without Auth0
  // In production, authenticateJWT enforces JWT validation
  if (process.env.DEV_AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
    router.use(devAuthBypass);
  } else {
    router.use(authenticateJWT);
  }

  // List tools by authenticated user (JWT-based)
  router.get('/', async (req, res) => {
    try {
      // Extract userId from verified JWT token (not from query params!)
      const userId = getUserIdFromToken(req);
      const email = getUserEmailFromToken(req);

      // Get or create user record using Auth0 userId
      const user = await getOrCreateUserByEmail(email || userId, undefined);
      const tools = await listToolsByUser(user.id);

      res.json({ ok: true, tools });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || 'Failed to list tools' });
    }
  });

  // Create tool record (before generation)
  router.post('/', async (req, res) => {
    try {
      // Extract userId from JWT - NO MORE EMAIL IN REQUEST BODY
      const userId = getUserIdFromToken(req);
      const email = getUserEmailFromToken(req);

      const { template_id, name, configuration, realm_id } = req.body || {};
      if (!template_id || !name || !configuration) {
        return res.status(400).json({
          ok: false,
          error: 'template_id, name, configuration required'
        });
      }

      // Get or create user using Auth0 identity
      const user = await getOrCreateUserByEmail(email || userId, undefined);

      const tool = await createTool({
        user_id: user.id,
        template_id,
        name,
        status: 'generating',
        configuration,
        deployment_type: null,
        deployment_url: null,
        subscription_id: null,
        billing_status: 'trial',
        realm_id: realm_id || null, // UBL Realm ID
      });

      res.json({ ok: true, tool });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || 'Failed to create tool' });
    }
  });

  // Get tool details
  router.get('/:id', async (req, res) => {
    try {
      const tool = await getTool(req.params.id);
      if (!tool) return res.status(404).json({ ok: false, error: 'Tool not found' });
      res.json({ ok: true, tool });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || 'Failed to get tool' });
    }
  });

  // Suspend tool
  router.post('/:id/suspend', async (req, res) => {
    try {
      await updateToolStatus(req.params.id, 'suspended');
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || 'Failed to suspend tool' });
    }
  });

  // Resume tool
  router.post('/:id/resume', async (req, res) => {
    try {
      await updateToolStatus(req.params.id, 'active');
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || 'Failed to resume tool' });
    }
  });

  // Set deployment info
  router.post('/:id/deployment', async (req, res) => {
    try {
      const { type, url } = req.body || {};
      if (!type) return res.status(400).json({ ok: false, error: 'type required' });
      await setToolDeployment(req.params.id, type, url);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || 'Failed to set deployment' });
    }
  });

  return router;
}