import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '../api';
import Skeleton from '../ui/Skeleton';
import ToolCard from '../components/ToolCard';

export default function Templates() {
  const navigate = useNavigate();
  const { data: templates, isLoading, isError } = useTemplates();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Todos os templates</h1>
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      )}
      {isError && <div className="rounded-lg border bg-red-50 p-3 text-red-700">Falha ao carregar templates.</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(templates || []).map((t) => (
          <ToolCard key={t.id} template={t} onSelect={() => navigate(`/build/${t.id}`)} />
        ))}
      </div>
    </div>
  );
}