import React from 'react';

export default function ToolCard({
  template,
  onSelect
}: {
  template: { id: string; name: string; description: string; category: string; basePrice: number };
  onSelect: () => void;
}) {
  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{template.name}</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">{template.description}</p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{template.category}</div>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-gray-700 dark:text-gray-200">
          <span className="font-medium">R$ {(template.basePrice / 100).toFixed(2)}/mês</span>
        </div>
        <button className="btn" onClick={onSelect}>
          Construir
        </button>
      </div>
    </div>
  );
}