import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';

export default function Hero({ onCTA }: { onCTA: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
          Construa ferramentas de negócio em 10 segundos
        </h1>
        <p className="mt-3 text-lg text-white/90">
          Responda 5 perguntas, gere uma ferramenta personalizada e faça deploy automaticamente. R$99/mês.
        </p>
        <div className="mt-6 flex gap-3">
          <button className="btn" onClick={onCTA}>
            Começar agora
          </button>
          <a
            className="inline-flex items-center rounded-md px-3 py-2 bg-white/10 hover:bg-white/20 text-white"
            href="/pricing"
          >
            Ver preços
          </a>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="absolute -top-8 -right-8 w-[420px] h-[420px] rounded-full bg-white/10 blur-3xl"
      />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <div className="text-xl font-semibold">Gere</div>
          <div className="text-white/80 text-sm mt-2">Backend, frontend e banco a partir de templates.</div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="text-xl font-semibold">Deploy</div>
          <div className="text-white/80 text-sm mt-2">Railway, Render ou Docker, automático.</div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="text-xl font-semibold">Cobrança</div>
          <div className="text-white/80 text-sm mt-2">Stripe R$99/mês, cancele quando quiser.</div>
        </GlassCard>
      </div>
    </div>
  );
}