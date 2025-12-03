import * as fs from 'fs';
import * as path from 'path';
export class TemplateEngine {
    constructor(basePath) {
        this.templates = new Map();
        this.templatePath = basePath ?? path.resolve(process.cwd(), 'templates');
    }
    async load(templateId) {
        if (this.templates.has(templateId))
            return this.templates.get(templateId);
        try {
            const templateDir = path.join(this.templatePath, templateId);
            const configJs = path.join(templateDir, 'config.js');
            const configTs = path.join(templateDir, 'config.ts');
            let mod;
            if (fs.existsSync(configJs)) {
                mod = await import(configJs);
            }
            else if (fs.existsSync(configTs)) {
                mod = await import(configTs);
            }
            else {
                throw new Error(`Missing config.ts/js in ${templateDir}`);
            }
            const template = mod.default ?? mod.gdprTemplate ?? mod.template ?? mod;
            this.validateTemplate(template);
            this.templates.set(templateId, template);
            return template;
        }
        catch (error) {
            console.error(`Failed to load template ${templateId}:`, error);
            return null;
        }
    }
    async listAll() {
        const dirs = await fs.promises.readdir(this.templatePath, { withFileTypes: true });
        const ids = dirs.filter(d => d.isDirectory()).map(d => d.name);
        const results = [];
        for (const id of ids) {
            const tpl = await this.load(id);
            if (tpl)
                results.push(tpl);
        }
        return results;
    }
    async search(criteria) {
        const all = await this.listAll();
        return all.filter((t) => {
            if (criteria.category && t.category !== criteria.category)
                return false;
            const basePrice = t.basePrice ?? 9900;
            if (criteria.priceMax && basePrice > criteria.priceMax)
                return false;
            if (criteria.features && criteria.features.length) {
                const tplFeatureIds = new Set((t.config?.features?.map((f) => f.id) ??
                    t.features?.available?.map((f) => f.id) ??
                    []));
                for (const f of criteria.features) {
                    if (!tplFeatureIds.has(f))
                        return false;
                }
            }
            return true;
        });
    }
    validateTemplate(template) {
        if (!template.id || !template.name || !template.description) {
            throw new Error('Template missing required fields: id/name/description');
        }
        if (!Array.isArray(template.questions) || template.questions.length !== 5) {
            throw new Error(`Template ${template.id} must define exactly 5 questions`);
        }
        // Ensure codeTemplates exist for Phase 1 generator compatibility
        if (!template.codeTemplates) {
            throw new Error(`Template ${template.id} missing codeTemplates; required for Phase 1 generation`);
        }
        const ct = template.codeTemplates;
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
