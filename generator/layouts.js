/**
 * LAYOUTS ENGINE - Motor de Layouts
 *
 * Define a estrutura HTML/React macro da aplicação.
 * Diferentes templates precisam de diferentes layouts.
 */
export const LAYOUTS = {
    // Dashboard: Sidebar esquerda, Header topo, Conteúdo central
    // Ideal para: CRM, ERP, Finance, Inventory
    dashboard: `
import React from 'react';
import { LayoutDashboard, Settings, Menu } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <div className="flex h-screen bg-background text-text font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={\`\${sidebarOpen ? 'w-64' : 'w-16'} bg-surface border-r border-border flex flex-col transition-all duration-300\`}>
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className={\`font-bold text-xl text-primary whitespace-nowrap overflow-hidden \${sidebarOpen ? '' : 'hidden'}\`}>
            {{companyName}}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-surface-hover rounded-token transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="p-3 bg-primary/10 text-primary rounded-token font-medium flex items-center gap-3">
            <LayoutDashboard size={18} />
            {sidebarOpen && <span>Dashboard</span>}
          </div>
          <div className="p-3 text-muted hover:bg-surface-hover rounded-token transition-colors flex items-center gap-3 cursor-pointer">
            <Settings size={18} />
            {sidebarOpen && <span>Settings</span>}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-surface border-b border-border flex items-center px-8 justify-between shadow-sm">
          <h1 className="text-lg font-semibold text-primary">{{templateName}}</h1>
          <div className="flex gap-4 items-center">
            <span className="w-8 h-8 bg-primary rounded-full"></span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
`,
    // Chat Focus: Estilo ChatGPT/WhatsApp Web
    // Ideal para: Helpdesk, Knowledge Base, HR Onboarding, AI Assistants
    'chat-focus': `
import React from 'react';
import { MessageSquare, History } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-text font-sans overflow-hidden">
      {/* Sidebar - Histórico de conversas */}
      <aside className="w-80 bg-surface border-r border-border flex flex-col hidden md:flex">
        <div className="p-4 border-b border-border">
          <div className="font-bold text-primary text-lg">{{companyName}}</div>
          <div className="text-xs text-muted mt-1">{{templateName}} AI</div>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <div className="text-xs uppercase text-muted font-bold px-2 py-2 flex items-center gap-2">
            <History size={14} />
            Histórico
          </div>
          {/* Histórico de conversas seria injetado aqui */}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-background">
        <header className="absolute top-0 left-0 right-0 h-14 bg-surface/80 backdrop-blur flex items-center px-4 border-b border-border z-10">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            <span className="font-medium text-primary">{{templateName}} AI</span>
          </div>
        </header>
        <div className="flex-1 pt-14 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
`,
    // Documentation: Layout focado em conteúdo
    // Ideal para: Knowledge Base, Documentation, Wikis
    documentation: `
import React from 'react';
import { Book, Search } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-text font-sans overflow-hidden">
      {/* Sidebar - Navegação */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="font-bold text-xl text-primary flex items-center gap-2">
            <Book size={20} />
            {{companyName}}
          </div>
        </div>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="text"
              placeholder="Buscar..."
              className="input pl-10 text-sm"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-auto p-4">
          {/* Menu de navegação seria injetado aqui */}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
`,
    // Workflow: Layout horizontal focado em processos
    // Ideal para: Project Planner, Onboarding, Kanban
    workflow: `
import React from 'react';
import { Workflow, Columns } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-background text-text font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-16 bg-surface border-b border-border flex items-center px-8 justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Workflow size={20} className="text-primary" />
          <h1 className="text-lg font-semibold text-primary">{{templateName}}</h1>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-sm text-muted">{{companyName}}</span>
          <span className="w-8 h-8 bg-primary rounded-full"></span>
        </div>
      </header>

      {/* Main Content - Horizontal Layout */}
      <main className="flex-1 overflow-auto p-6">
        <div className="flex items-start gap-6 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
`
};
/**
 * Seleciona o layout baseado no template ID
 */
export function selectLayout(templateId) {
    const id = (templateId || '').toLowerCase();
    // Chat-focused templates
    if (['helpdesk', 'knowledge-base', 'hr-onboarding'].includes(id)) {
        return 'chat-focus';
    }
    // Documentation templates
    if (['documentation', 'wiki', 'kb'].includes(id)) {
        return 'documentation';
    }
    // Workflow templates
    if (['project-planner', 'okrs-manager', 'time-tracking'].includes(id)) {
        return 'workflow';
    }
    // Default: Dashboard (para CRM, ERP, Finance, Inventory, etc)
    return 'dashboard';
}
/**
 * Obtém todos os layouts disponíveis
 */
export function getAllLayouts() {
    return Object.keys(LAYOUTS);
}
