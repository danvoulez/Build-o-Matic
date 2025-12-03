import { Router } from 'express';
import { getOrCreateUserByEmail } from '../models/users';
import { createTool, listToolsByUser, getTool, updateToolStatus, setToolDeployment } from '../models/tools';

export function toolsRouter() {
  const router = Router();

  // List tools by user email (simple for MVP)
  router.get('/', async (req, res) => {
    try {
      const email = String(req.query.email || '');
      if (!email) return res.status(400).json({ ok: false, error: 'email required' });
      const user = await getOrCreateUserByEmail(email);
      const tools = await listToolsByUser(user.id);
      res.json({ ok: true, tools });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || 'Failed to list tools' });
    }
  });

  // Create tool record (before generation)
  router.post('/', async (req, res) => {
    try {
      const { email, template_id, name, configuration } = req.body || {};
      if (!email || !template_id || !name || !configuration) {
        return res.status(400).json({ ok: false, error: 'email, template_id, name, configuration required' });
      }
      const user = await getOrCreateUserByEmail(email);
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