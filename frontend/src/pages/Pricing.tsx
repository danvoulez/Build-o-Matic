import React from 'react';
import GlassCard from '../ui/GlassCard';

export default function Pricing() {
  const tiers = [
    { name: 'Single Tool', price: 99, features: ['1 ferramenta', 'Deploy gerenciado', 'Suporte básico'] },
    { name: '3 Tools', price: 249, features: ['3 ferramentas', 'Deploy gerenciado', 'Suporte prioritário'] },
    { name: 'Unlimited', price: 999, features: ['Ilimitado', 'Deploy gerenciado', 'Suporte dedicado'] }
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Preços</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((t) => (
          <GlassCard key={t.name} className="p-6 flex flex-col">
            <div className="font-semibold text-lg">{t.name}</div>
            <div className="mt-2 text-3xl font-bold">R$ {t.price}/mês</div>
            <ul className="mt-4 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              {t.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <button className="btn mt-6">Assinar</button>
          </GlassCard>
        ))}
      </div>
      <GlassCard className="mt-8 p-4">
        <div className="font-medium">Self-hosted</div>
        <div className="text-sm text-gray-700 dark:text-gray-300">R$ 999 pagamento único — pacote Docker para rodar onde quiser.</div>
      </GlassCard>
    </div>
  );
}