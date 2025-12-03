import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { startGenerationStream } from '../api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Generation() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { template, answers } = location.state || {};
  const [status, setStatus] = useState<'generating' | 'complete' | 'error'>('generating');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!template) {
      setStatus('error');
      return;
    }

    startGenerationStream(
      { templateId: template.id, answers, userId: 'user-frontend', deployTarget: answers?.deployTarget || 'railway' },
      (evt) => {
        if (evt.type === 'progress') {
          setProgress(evt.progress);
          setMessage(evt.message);
        } else if (evt.type === 'complete') {
          setResult(evt.result);
          setStatus('complete');
          toast.success('Ferramenta gerada com sucesso');
        } else if (evt.type === 'error') {
          setStatus('error');
          toast.error('Erro na geração');
        }
      }
    ).catch(() => {
      setStatus('error');
      toast.error('Falha na conexão de geração');
    });
  }, [template, answers]);

  if (status === 'complete') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
        <h1 className="text-2xl font-bold">Sucesso! 🎉</h1>
        <p>Sua ferramenta está pronta.</p>
        {result?.deployment?.url ? (
          <a className="text-blue-600 dark:text-blue-400 underline" href={result.deployment.url} target="_blank" rel="noreferrer">
            Abrir ferramenta
          </a>
        ) : (
          <div>Artefato pronto para deploy.</div>
        )}
        <button className="btn" onClick={() => navigate('/deployed', { state: { result } })}>
          Ver detalhes
        </button>
      </motion.div>
    );
  }

  if (status === 'error') {
    return <div className="text-red-600">Algo deu errado durante a geração.</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Gerando sua ferramenta...</h1>
      <p className="text-gray-700 dark:text-gray-300">{message}</p>
      <div className="bg-white dark:bg-white/5 dark:border-white/10 border rounded-lg p-4">
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div>Selecionando template {progress >= 25 ? '✅' : '⏳'}</div>
          <div>Validando respostas {progress >= 45 ? '✅' : '⏳'}</div>
          <div>Gerando código {progress >= 70 ? '✅' : '⏳'}</div>
          <div>Empacotando {progress >= 95 ? '✅' : '⏳'}</div>
        </div>
        <progress max={100} value={progress} className="w-full mt-4" />
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Tempo estimado: {Math.max(0, 10 - Math.floor(progress / 10))}s</p>
      </div>
    </div>
  );
}