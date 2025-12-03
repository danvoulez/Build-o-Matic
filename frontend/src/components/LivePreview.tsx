import React from 'react';

export default function LivePreview({ template, answers }: { template: any; answers: Record<string, any> }) {
  const items = [
    { label: 'Template', value: template?.name },
    { label: 'Indústria', value: answers?.industry },
    { label: 'Usuários', value: answers?.users },
    { label: 'Recursos', value: (answers?.features || []).join(', ') },
    { label: 'Integrações', value: (answers?.integrations || []).join(', ') },
    { label: 'Deploy', value: answers?.deployTarget }
  ];
  return (
    <div className="mt-4 p-4 border rounded-lg bg-white">
      <h4 className="font-semibold mb-2">Pré-visualização</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map((it) => (
          <div key={it.label} className="text-sm">
            <div className="text-gray-500">{it.label}</div>
            <div className="font-medium">{it.value || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}