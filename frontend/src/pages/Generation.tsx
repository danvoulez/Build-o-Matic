import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { startGenerationStream, deployViaEngine, checkEngineAvailable } from '../api';
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

  const [engineEnabledFlag] = useState<boolean>(() => import.meta.env.VITE_ENGINE_ENABLED === 'true');
  const [engineAvailable, setEngineAvailable] = useState<boolean>(false);
  const [useEngine, setUseEngine] = useState<boolean>(false);

  useEffect(() => {
    // health check to auto-hide toggle if engine route not available
    if (engineEnabledFlag) {
      checkEngineAvailable().then(setEngineAvailable).catch(() => setEngineAvailable(false));
    }
  }, [engineEnabledFlag]);

  useEffect(() => {
    if (!template) {
      setStatus('error');
      return;
    }

    const targetType =
      answers?.deployTarget === 'aws-eb' || answers?.deployTarget === 'aws-ecs'
        ? 'aws'
        : answers?.deployTarget === 'gcp-cloudrun'
        ? 'gcp'
        : answers?.deployTarget === 'docker'
        ? 'docker'
        : 'ledger-cloud';

    if (useEngine && engineEnabledFlag && engineAvailable) {
      const payload = {
        toolPackage: {
          id: template.id,
          name: template.name,
          version: '1.0.0',
          artifacts: { docker_image: 'ghcr.io/placeholder/buildomatic:latest' },
          config: {
            env: { COMPANY_NAME: answers?.companyName || 'Company', NODE_ENV: 'production' },
            secrets: {},
            volumes: [],
            network: { public: true, tls: 'auto', subdomainPrefix: 'bom-' }
          },
          monitoring: { health_check: '/health', metrics: ['/metrics'], logs: [{ path: '/var/log/app.log' }] },
          requirements: { cpu: '500m', memory: '512Mi', storage: '1Gi', ports: [4000] }
        },
        target: {
          type: targetType,
          config: {
            region: targetType === 'aws' ? import.meta.env.VITE_AWS_REGION || 'us-east-1' : undefined,
            project: targetType === 'gcp' ? import.meta.env.VITE_GCP_PROJECT_ID : undefined
          },
          requirements: { cpu: '500m', memory: '512Mi', storage: '1Gi', ports: [4000] }
        }
      };

      deployViaEngine(payload)
        .then((json) => {
          setResult({
            deployment: { url: json.result.url, type: answers?.deployTarget },
            metadata: { generatedAt: Date.now() },
            config: { environment: { NODE_ENV: 'production' }, dependencies: [] },
            credentials: { admin: json.result.adminCredentials }
          });
          setStatus('complete');
          toast.success('Deploy concluído via Engine');
        })
        .catch(() => {
          setStatus('error');
          toast.error('Falha no Engine');
        });

      return;
    }

    // Fallback to original SSE path
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
  }, [template, answers, useEngine, engineEnabledFlag, engineAvailable]);

  const engineToggleVisible = useMemo(() => engineEnabledFlag && engineAvailable, [engineEnabledFlag, engineAvailable]);

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
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Gerando sua ferramenta...</h1>
        {engineToggleVisible && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={useEngine} onChange={(e) => setUseEngine(e.target.checked)} />
            Usar Engine 10s
          </label>
        )}
      </div>
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