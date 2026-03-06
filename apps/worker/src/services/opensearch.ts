import { Client } from '@opensearch-project/opensearch';
import { config } from '../config';
import { AiExtraction } from '../types';

const client = new Client({ node: config.opensearchNode });

export async function ensureIndex() {
  const exists = await client.indices.exists({ index: config.opensearchIndex });
  const body = (exists as any).body ?? exists;
  if (body) return;

  await client.indices.create({
    index: config.opensearchIndex,
    body: {
      mappings: {
        properties: {
          incidentId: { type: 'keyword' },
          reportText: { type: 'text' },
          classification: { type: 'keyword' },
          severity: { type: 'keyword' },
          equipment: { type: 'text' },
          location: { type: 'text' },
          injuryType: { type: 'text' },
          probableRootCause: { type: 'text' },
          summary: { type: 'text' },
          tags: { type: 'keyword' },
          indexedAt: { type: 'date' },
        },
      },
    },
  });
}

export async function indexIncident(incidentId: string, reportText: string, data: AiExtraction) {
  await client.index({
    index: config.opensearchIndex,
    id: incidentId,
    body: {
      incidentId,
      reportText,
      classification: data.classification,
      severity: data.severity,
      equipment: data.equipment,
      location: data.location,
      injuryType: data.injuryType,
      probableRootCause: data.probableRootCause,
      summary: data.summary,
      tags: data.tags,
      indexedAt: new Date().toISOString(),
    },
    refresh: true,
  });
}
