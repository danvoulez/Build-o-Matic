import { Router } from 'express';
import { TemplateEngine } from '../../generator/template-engine';

export function templatesRouter() {
  const router = Router();
  const engine = new TemplateEngine();

  router.get('/', async (_req, res) => {
    try {
      const all = await engine.listAll();
      const summaries = all.map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        basePrice: t.basePrice ?? 9900,
      }));
      res.json({ ok: true, templates: summaries });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message ?? 'Failed to list templates' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const tpl = await engine.load(req.params.id);
      if (!tpl) return res.status(404).json({ ok: false, error: 'Template not found' });
      res.json({
        ok: true,
        template: {
          id: tpl.id,
          name: tpl.name,
          description: tpl.description,
          category: tpl.category,
          basePrice: (tpl as any).basePrice ?? 9900,
          questions: (tpl as any).questions,
          config: {
            features: (tpl as any).config?.features ?? (tpl as any).features?.available ?? [],
            integrations: (tpl as any).config?.integrations ?? (tpl as any).integrations?.available ?? [],
            defaultSettings: (tpl as any).config?.defaultSettings ?? {},
          },
        },
      });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message ?? 'Failed to load template' });
    }
  });

  return router;
}