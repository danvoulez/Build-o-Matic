import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTemplate, useCreateTool } from '../api';
import LivePreview from '../components/LivePreview';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type AnswerMap = Record<string, any>;

export default function QuestionFlow() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const { data: template, isLoading, isError } = useTemplate(templateId);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({ companyName: 'Acme Corp' });
  const { mutateAsync: createTool } = useCreateTool();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const questions = template?.questions || [];
  const currentQuestion = questions[currentStep];

  const setAnswer = (value: any) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const isValid = useMemo(() => {
    if (!currentQuestion) return false;
    const val = answers[currentQuestion.id];
    if (currentQuestion.required) {
      if (val === undefined || val === null || val === '') return false;
      if (currentQuestion.type === 'multiple' && Array.isArray(val) && val.length === 0) return false;
    }
    if (currentQuestion.type === 'number') {
      if (typeof val !== 'number' || Number.isNaN(val)) return false;
      if (currentQuestion.validation?.min !== undefined && val < currentQuestion.validation.min) return false;
      if (currentQuestion.validation?.max !== undefined && val > currentQuestion.validation.max) return false;
    }
    return true;
  }, [currentQuestion, answers]);

  const next = async () => {
    if (!isValid) {
      toast.error('Preencha o campo corretamente');
      return;
    }
    if (currentStep < questions.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      toast.info('Gerando sua ferramenta...');
      try {
        await createTool({
          email: 'admin@example.com',
          template_id: template!.id,
          name: `${answers.companyName} - ${template!.name}`,
          configuration: { ...answers }
        });
      } catch {}
      navigate('/generate', { state: { template, answers } });
    }
  };

  const back = () => setCurrentStep((s) => Math.max(0, s - 1));

  if (isLoading) return <div>Carregando template...</div>;
  if (isError || !template) return <div>Falha ao carregar template.</div>;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-2xl font-bold">{template.name}</h1>
        <p className="text-gray-700 dark:text-gray-300 mt-1">{template.description}</p>
      </motion.div>
      <div className="mt-6">
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          Passo {currentStep + 1} de {questions.length}
        </div>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-white/5 dark:border-white/10 border rounded-lg p-4"
        >
          <p className="font-medium mb-3">{currentQuestion.question}</p>
          {currentQuestion.type === 'single' && (
            <div className="space-y-2">
              {currentQuestion.options.map((opt: string) => (
                <label key={opt} className="flex gap-2 items-center">
                  <input type="radio" name={currentQuestion.id} checked={answers[currentQuestion.id] === opt} onChange={() => setAnswer(opt)} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}
          {currentQuestion.type === 'multiple' && (
            <div className="space-y-2">
              {currentQuestion.options.map((opt: string) => {
                const selected = Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id] : [];
                const toggle = () => {
                  const nextVal = selected.includes(opt) ? selected.filter((o: string) => o !== opt) : [...selected, opt];
                  setAnswer(nextVal);
                };
                return (
                  <label key={opt} className="flex gap-2 items-center">
                    <input type="checkbox" checked={selected.includes(opt)} onChange={toggle} />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          )}
          {currentQuestion.type === 'number' && (
            <input
              className="border rounded px-2 py-1"
              type="number"
              min={currentQuestion.validation?.min}
              max={currentQuestion.validation?.max}
              value={answers[currentQuestion.id] ?? ''}
              onChange={(e) => setAnswer(Number(e.target.value))}
            />
          )}
          {currentQuestion.type === 'text' && (
            <input
              className="border rounded px-2 py-1 w-full"
              type="text"
              placeholder="Digite aqui..."
              value={answers[currentQuestion.id] ?? ''}
              onChange={(e) => setAnswer(e.target.value)}
            />
          )}
          <div className="flex justify-between mt-4">
            <button className="btn" onClick={back} disabled={currentStep === 0}>
              Voltar
            </button>
            <button className="btn" onClick={next}>
              {currentStep === questions.length - 1 ? 'Gerar Ferramenta' : 'Próximo'}
            </button>
          </div>
        </motion.div>
      </div>

      <LivePreview template={template} answers={answers} />
    </div>
  );
}