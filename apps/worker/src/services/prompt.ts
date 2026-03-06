export function buildPrompt(reportText: string): string {
  return [
    'You are an HSE analyst for the Oil & Gas industry.',
    'Extract a structured JSON object from the incident report below.',
    'Return valid JSON only with these exact keys:',
    'classification, severity, equipment, location, injuryType, probableRootCause, summary, tags',
    'Rules:',
    '- classification must be one of: Serious Incident, Minor Accident, Near Miss, Preventive Observation',
    '- severity must be one of: High, Medium, Low',
    '- tags must be an array of short lowercase strings',
    '- summary must be one concise sentence',
    '- if a field is missing, use "Unknown"',
    '',
    'Incident report:',
    reportText,
  ].join('
');
}
