import { Pool } from 'pg';
import { AiExtraction } from '../types';
import { config } from '../config';

export const pool = new Pool({ connectionString: config.databaseUrl });

export async function markProcessing(incidentId: string) {
  await pool.query(
    `UPDATE incidents SET status = 'PROCESSING', last_error = NULL WHERE id = $1`,
    [incidentId],
  );
}

export async function markProcessed(incidentId: string, data: AiExtraction) {
  await pool.query(
    `
    UPDATE incidents
    SET
      status = 'PROCESSED',
      classification = $2,
      severity = $3,
      equipment = $4,
      location = $5,
      injury_type = $6,
      probable_root_cause = $7,
      ai_summary = $8,
      tags = $9::jsonb,
      extracted_entities = $10::jsonb,
      analyzed_at = NOW(),
      last_error = NULL
    WHERE id = $1
    `,
    [
      incidentId,
      data.classification,
      data.severity,
      data.equipment,
      data.location,
      data.injuryType,
      data.probableRootCause,
      data.summary,
      JSON.stringify(data.tags ?? []),
      JSON.stringify({
        equipment: data.equipment,
        location: data.location,
        injuryType: data.injuryType,
        probableRootCause: data.probableRootCause,
      }),
    ],
  );
}

export async function markFailed(incidentId: string, errorMessage: string) {
  await pool.query(
    `UPDATE incidents SET status = 'FAILED', last_error = $2 WHERE id = $1`,
    [incidentId, errorMessage.slice(0, 1000)],
  );
}
