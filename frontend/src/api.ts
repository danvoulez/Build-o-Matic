import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await axios.get('/api/templates');
      if (!data.ok) throw new Error(data.error || 'Falha ao listar templates');
      return data.templates as Array<{ id: string; name: string; description: string; category: string; basePrice: number }>;
    }
  });
}

export function useTemplate(id?: string) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await axios.get(`/api/templates/${id}`);
      if (!data.ok) throw new Error(data.error || 'Falha ao carregar template');
      return data.template as {
        id: string;
        name: string;
        description: string;
        category: string;
        basePrice: number;
        questions: any[];
        config: any;
      };
    },
    enabled: !!id
  });
}

export async function startGenerationStream(body: any, onMessage: (evt: any) => void) {
  const res = await fetch('/api/generate/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-subscription-active': 'true' },
    body: JSON.stringify(body)
  });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';
    for (const part of parts) {
      const line = part.trim();
      if (line.startsWith('data:')) {
        const jsonStr = line.replace(/^data:\s*/, '');
        try {
          const obj = JSON.parse(jsonStr);
          onMessage(obj);
        } catch {
          // ignore malformed chunks
        }
      }
    }
  }
}

export function useCreateTool() {
  return useMutation({
    mutationFn: async (payload: { email: string; template_id: string; name: string; configuration: any }) => {
      const { data } = await axios.post('/api/tools', payload);
      if (!data.ok) throw new Error(data.error || 'Falha ao criar registro da ferramenta');
      return data.tool;
    }
  });
}