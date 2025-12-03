import React from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../ui/Hero';
import { useTemplates } from '../api';
import Skeleton from '../ui/Skeleton';
import ToolCard from '../components/ToolCard';
import GlassCard from '../ui/GlassCard';
import { motion } from 'framer-motion';

export default function Home() {
  const navigate = useNavigate();
  const { data: templates, isLoading, isError } = useTemplates();

  return (
    <div className="space-y-8">
      <Hero onCTA={() => navigate('/templates')} />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Templates em destaque</h2>
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        )}
        {isError && <div className="rounded-lg border bg-red-50 p-3 text-red-700">Falha ao carregar templates.</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(templates || []).slice(0, 3).map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ToolCard template={t} onSelect={() => navigate(`/build/${t.id}`)} />
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold">Como funciona</h3>
          <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
            <li>Escolha um template</li>
            <li>Responda 5 perguntas</li>
            <li>Geramos backend, frontend e banco</li>
            <li>Fazemos deploy automático</li>
            <li>Você paga R$99/mês e começa a usar</li>
          </ol>
        </GlassCard>
      </section>
    </div>
  );
}