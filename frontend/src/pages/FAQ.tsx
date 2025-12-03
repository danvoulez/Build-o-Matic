import React from 'react';
import GlassCard from '../ui/GlassCard';

export default function FAQ() {
  const faqs = [
    { q: 'Como funciona?', a: 'Você escolhe um template, responde 5 perguntas, nós geramos e fazemos deploy.' },
    { q: 'Quanto tempo leva?', a: 'Geração ~10s, deploy ~60s.' },
    { q: 'Posso cancelar?', a: 'Sim, a qualquer momento. Cobrança mensal.' },
    { q: 'Suporta integrações?', a: 'Sim, Slack, Email e Webhooks (dependendo do template).' }
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Perguntas Frequentes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs.map((f) => (
          <GlassCard key={f.q} className="p-4">
            <div className="font-semibold">{f.q}</div>
            <div className="text-gray-700 dark:text-gray-300 mt-1">{f.a}</div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}