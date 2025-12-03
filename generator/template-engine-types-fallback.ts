// Legacy simple Template type to avoid circular imports during template-engine bootstrap
export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  questions: Array<any>;
  codeTemplates: {
    backend: string;
    frontend: string;
    database: string;
  };
  config: {
    features: Array<{ id: string; name: string; description?: string }>;
    integrations: Array<{ id: string; name: string; description?: string }>;
    defaultSettings: Record<string, any>;
    dependencies?: string[];
  };
}