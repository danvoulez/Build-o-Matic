import React from 'react';
import { useLocation } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';

export default function Deployed() {
  const location = useLocation() as any;
  const result = location.state?.result;

  if (!result) return <div>Nenhum resultado encontrado.</div>;

  const { deployment, config, metadata } = result;
  const creds = result?.credentials?.admin || { email: 'admin@example.com', password: '********' };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Detalhes da Ferramenta</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-4">
          <div className="font-medium">Deployment</div>
          <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">Tipo: {deployment.type}</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">URL: {deployment.url || '—'}</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Instruções: {deployment.instructions}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="font-medium">Configuração</div>
          <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">NODE_ENV: {config.environment.NODE_ENV}</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Dependências: {config.dependencies.join(', ')}</div>
        </GlassCard>
      </div>
      <GlassCard className="p-4">
        <div className="font-medium">Credenciais (Admin)</div>
        <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">Email: {creds.email}</div>
        <div className="text-sm text-gray-700 dark:text-gray-300">Senha: {creds.password}</div>
      </GlassCard>
      <div className="text-sm text-gray-600 dark:text-gray-400">Gerado em: {new Date(metadata.generatedAt).toLocaleString()}</div>
    </div>
  );
}