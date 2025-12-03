// Add a small card for Engine quick deploy
import { useNavigate } from 'react-router-dom';
// ...existing code...
<section className="bg-white border rounded-lg p-6">
  <h3 className="text-lg font-semibold">Deploy Engine (10s) — Demo</h3>
  <p className="text-sm text-gray-700 dark:text-gray-300">Faça um deploy instantâneo usando um pacote padrão.</p>
  <div className="mt-3 flex flex-wrap gap-2">
    {['docker', 'aws-eb', 'aws-ecs', 'gcp-cloudrun'].map((t) => (
      <button key={t} className="btn" onClick={() => navigate('/generate', { state: { useEngine: true, answers: { deployTarget: t }, template: { id: 'demo', name: 'Demo Tool' } } })}>
        {t}
      </button>
    ))}
  </div>
</section>