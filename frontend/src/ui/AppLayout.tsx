import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Rocket, Boxes, HelpCircle, Moon, Sun } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

export default function AppLayout() {
  const [dark, setDark] = useState<boolean>(() => {
    return localStorage.getItem('bom-theme') === 'dark';
  });
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('bom-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1120] dark:text-gray-100 transition-colors">
      <header className="border-b bg-white dark:bg-white/5 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          <Rocket className="text-blue-600 dark:text-blue-400" />
          <button className="font-semibold text-lg" onClick={() => navigate('/')}>
            Build-O-Matic
          </button>
          <nav className="ml-auto flex gap-6 text-sm">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
              }
            >
              Início
            </NavLink>
            <NavLink
              to="/templates"
              className={({ isActive }) =>
                isActive ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
              }
            >
              Templates
            </NavLink>
            <NavLink
              to="/pricing"
              className={({ isActive }) =>
                isActive ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
              }
            >
              Preços
            </NavLink>
            <NavLink
              to="/faq"
              className={({ isActive }) =>
                isActive ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
              }
            >
              FAQ
            </NavLink>
          </nav>
          <button
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm bg-gray-100 dark:bg-white/10"
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? 'Claro' : 'Escuro'}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className="border-t bg-white dark:bg-white/5 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-600 dark:text-gray-300 flex justify-between">
          <div className="flex items-center gap-2">
            <Boxes />
            <span>Universal Business Ledger</span>
          </div>
          <div className="flex items-center gap-2">
            <HelpCircle />
            <span>Suporte: support@ledger.dev</span>
          </div>
        </div>
      </footer>
      <Toaster richColors position="top-right" />
    </div>
  );
}