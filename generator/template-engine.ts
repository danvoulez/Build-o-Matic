/**
 * TEMPLATE ENGINE
 *
 * Updates: supports new Template types and uses registry loader to list/search.
 */
import { Template } from './template-engine-types-fallback'; // will be overridden below
import * as fs from 'fs';
import * as path from 'path';
import type { Template as RichTemplate } from './types';

export interface Feature {
  id: string;
  name: string;
  description?: string;
  required?: boolean;
}
export interface Integration {
  id: string;
  name: string;
  description?: string;
}

export interface TemplateQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'number' | 'text';
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  affects?: {
    features?: string[];
    config?: string[];
    pricing?: boolean;
  };
}

// Fallback to legacy Template interface for backward compatibility
export type LegacyTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  questions: TemplateQuestion[];
  codeTemplates: { backend: string; frontend: string; database: string };
  config: { features: Feature[]; integrations: Integration[]; defaultSettings: Record<string, any>; dependencies?: string[] };
};

type AnyTemplate = RichTemplate | LegacyTemplate;

export class TemplateEngine {
  private templates: Map<string, AnyTemplate> = new Map();
  private templatePath: string;

  constructor(basePath?: string) {
    this.templatePath = basePath ?? path.resolve(process.cwd(), 'templates');
  }

  async load(templateId: string): Promise<AnyTemplate | null> {
    if (this.templates.has(templateId)) return this.templates.get(templateId)!;
    try {
      const templateDir = path.join(this.templatePath, templateId);
      const configJs = path.join(templateDir, 'config.js');
      const configTs = path.join(templateDir, 'config.ts');

      let mod: any;
      if (fs.existsSync(configJs)) {
        mod = await import(configJs);
      } else if (fs.existsSync(configTs)) {
        mod = await import(configTs);
      } else {
        throw new Error(`Missing config.ts/js in ${templateDir}`);
      }

      const template: AnyTemplate = mod.default ?? mod.gdprTemplate ?? mod.template ?? mod;
      this.validateTemplate(template);
      this.templates.set(templateId, template);
      return template;
    } catch (error) {
      console.error(`Failed to load template ${templateId}:`, error);
      return null;
    }
  }

  async listAll(): Promise<AnyTemplate[]> {
    const dirs = await fs.promises.readdir(this.templatePath, { withFileTypes: true });
    const ids = dirs.filter(d => d.isDirectory()).map(d => d.name);
    const results: AnyTemplate[] = [];
    for (const id of ids) {
      const tpl = await this.load(id);
      if (tpl) results.push(tpl);
    }
    return results;
  }

  async search(criteria: {
    category?: string;
    features?: string[];
    priceMax?: number;
  }): Promise<AnyTemplate[]> {
    const all = await this.listAll();
    return all.filter((t: any) => {
      if (criteria.category && t.category !== criteria.category) return false;
      const basePrice = t.basePrice ?? 9900;
      if (criteria.priceMax && basePrice > criteria.priceMax) return false;
      if (criteria.features && criteria.features.length) {
        const tplFeatureIds = new Set(
          (t.config?.features?.map((f: any) => f.id) ??
            t.features?.available?.map((f: any) => f.id) ??
            [])
        );
        for (const f of criteria.features) {
          if (!tplFeatureIds.has(f)) return false;
        }
      }
      return true;
    });
  }

  private validateTemplate(template: AnyTemplate): void {
    if (!template.id || !template.name || !template.description) {
      throw new Error('Template missing required fields: id/name/description');
    }
    if (!Array.isArray(template.questions) || template.questions.length !== 5) {
      throw new Error(`Template ${template.id} must define exactly 5 questions`);
    }
    // Ensure codeTemplates exist for Phase 1 generator compatibility
    if (!(template as any).codeTemplates) {
      throw new Error(`Template ${template.id} missing codeTemplates; required for Phase 1 generation`);
    }
    const ct = (template as any).codeTemplates;
    // UBL Integration: Templates now use frontend, intents, agreements (not backend/database)
    if (!ct.frontend) {
      throw new Error(`Template ${template.id} codeTemplates must include frontend`);
    }
    // intents and agreements are optional but recommended
    if (!ct.intents) {
      console.warn(`Template ${template.id} missing intents template (recommended)`);
    }
    if (!ct.agreements) {
      console.warn(`Template ${template.id} missing agreements template (recommended)`);
    }
  }
}