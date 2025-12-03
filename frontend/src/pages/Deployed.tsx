// ...existing imports...
// inside the deployment card:
<div className="text-sm text-gray-700 dark:text-gray-300">URL: {deployment.url || '—'}</div>
{deployment.url && (
  <div className="mt-2 flex gap-2">
    <a className="btn" href={deployment.url} target="_blank" rel="noreferrer">Abrir</a>
    <button
      className="btn"
      onClick={() => navigator.clipboard.writeText(deployment.url)}
    >
      Copiar URL
    </button>
  </div>
)}