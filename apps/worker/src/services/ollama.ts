import axios from 'axios';
import { config } from '../config';
import { AiExtraction } from '../types';
import { buildPrompt } from './prompt';

function sanitize(payload: any): AiExtraction {
  return {
    classification: payload.classification ?? 'Preventive Observation',
    severity: payload.severity ?? 'Low',
    equipment: payload.equipment ?? 'Unknown',
    location: payload.location ?? 'Unknown',
    injuryType: payload.injuryType ?? 'Unknown',
    probableRootCause: payload.probableRootCause ?? 'Unknown',
    summary: payload.summary ?? 'No summary available.',
    tags: Array.isArray(payload.tags) ? payload.tags.map(String) : ['general-hse'],
  };
}

export async function analyzeWithOllama(reportText: string): Promise<AiExtraction> {
  const response = await axios.post(
    `${config.ollamaBaseUrl}/api/generate`,
    {
      model: config.ollamaModel,
      prompt: buildPrompt(reportText),
      stream: false,
      format: 'json',
    },
    {
      timeout: 120000,
    },
  );

  const raw = response.data?.response;
  if (!raw || typeof raw !== 'string') {
    throw new Error('Ollama returned an empty or invalid response');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Ollama response was not valid JSON');
  }

  return sanitize(parsed);
}
