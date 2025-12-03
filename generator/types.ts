/**
 * Shared type definitions used by templates and generator.
 */

export type PricingTier = {
  name: string;
  price: number; // in cents
  maxUsers: number; // Infinity allowed
  features: string[] | '*';
};

export type FeatureDef = {
  id: string;
  name: string;
  description?: string;
  included?: boolean;
  pricingImpact?: number; // cents per month to add
};

export type IntegrationDef = {
  id: string;
  name: string;
  description?: string;
  recommended?: boolean;
  config?: {
    required?: string[];
    optional?: string[];
  };
};

export type TechnologySpec = {
  backend: { language: string; framework: string; base?: string };
  frontend: { language: string; framework: string; ui?: string };
  database: { type: string; version?: string };
};

export type EnvVarsSpec = {
  required: string[];
  optional?: string[];
};

export type DependenciesSpec = {
  backend: string[];
  frontend: string[];
};

export type CustomizationSpec = {
  branding?: { enabled: boolean; fields?: string[] };
  features?: { enabled: boolean; toggleable?: boolean };
  integrations?: { enabled: boolean; configurable?: boolean };
  workflows?: { enabled: boolean };
};

export type GenerationInstructions = {
  steps: string[];
  estimatedTime: number; // ms
  notes?: string;
};

export type CodePathsSpec = {
  backend: string;
  frontend: string;
  database: string;
  config: string;
};

export type ValidationSpec = {
  checks: string[];
};

export type DocumentationSpec = {
  readme?: string;
  setup?: string;
  userGuide?: string;
  apiDocs?: string;
};

export type ExampleConfig = {
  name: string;
  description?: string;
  configuration: Record<string, any>;
};

export type AIHints = {
  focusAreas?: string[];
  mustHave?: string[];
  niceToHave?: string[];
};

export type TemplateQuestion = {
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
};

export type Template = {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  category: string;
  icon?: string;
  color?: string;
  screenshots?: string[];

  basePrice: number; // in cents
  pricingTiers?: PricingTier[];

  questions: TemplateQuestion[];

  features?: {
    required?: string[];
    available?: FeatureDef[];
  };

  integrations?: {
    available: IntegrationDef[];
  };

  technologies?: TechnologySpec;
  environmentVariables?: EnvVarsSpec;
  dependencies?: DependenciesSpec;

  customization?: CustomizationSpec;
  generation?: GenerationInstructions;

  codePaths?: CodePathsSpec;

  validation?: ValidationSpec;

  documentation?: DocumentationSpec;

  examples?: ExampleConfig[];

  aiHints?: AIHints;

  // The following remain compatible with the earlier engine if present
  codeTemplates?: {
    backend: string;
    frontend: string;
    database: string;
  };
  config?: {
    features: Array<{ id: string; name: string; description?: string }>;
    integrations: Array<{ id: string; name: string; description?: string }>;
    defaultSettings: Record<string, any>;
    dependencies?: string[];
  };
};