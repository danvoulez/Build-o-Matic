import React from 'react';
import { useNavigate } from 'react-router-dom';

export function ToolSelector({ templates }: { templates: Array<{ id: string; name: string; description: string; category: string; basePrice: number }> }) {
  const navigate = useNavigate();
  return (
    <div>
      {templates.map((t) => (
        <div key={t.id} className="tool-card" style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8, marginBottom: 12 }}>
          <h3>{t.name}</h3>
          <p>{t.description}</p>
          <small>Categoria: {t.category} · R$ {(t.basePrice / 100).toFixed(2)}/mês</small>
          <div>
            <button className="btn" onClick={() => navigate(`/build/${t.id}`)} style={{ marginTop: 8 }}>Construir</button>
          </div>
        </div>
      ))}
    </div>
  );
}