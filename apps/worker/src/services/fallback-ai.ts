import { AiExtraction } from '../types';

function pickSeverity(text: string): string {
  if (/fatal|fire|explosion|gas leak|hospital|fracture|amputation|major spill/i.test(text)) return 'High';
  if (/pain|minor|slip|trip|fall|alarm|leak|sprain/i.test(text)) return 'Medium';
  return 'Low';
}

function pickClassification(text: string): string {
  if (/fatal|lost time|hospital|serious|major spill|explosion/i.test(text)) return 'Serious Incident';
  if (/injury|hurt|pain|sprain|cut|burn/i.test(text)) return 'Minor Accident';
  if (/near miss|almost|observed|alarm|unsafe/i.test(text)) return 'Near Miss';
  return 'Preventive Observation';
}

function extractFirst(text: string, patterns: RegExp[], fallback = 'Unknown'): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return fallback;
}

export function fallbackAnalyze(reportText: string): AiExtraction {
  const equipment = extractFirst(reportText, [
    /(?:equipment|pump|compressor|valve|detector|ladder|hose|skid|motor|separator)[\w\s-]*?(pump|compressor|valve|detector|ladder|hose|skid|motor|separator)/i,
  ]);

  const location = extractFirst(reportText, [
    /(?:at|near|inside|around)\s+([A-Za-z0-9\s-]{4,40})/i,
  ]);

  const injuryType = /no injury/i.test(reportText)
    ? 'None reported'
    : extractFirst(reportText, [
        /(wrist pain|back pain|cut|burn|sprain|bruise|fracture|laceration)/i,
      ], 'Unknown');

  const probableRootCause = /slip|oily|wet/i.test(reportText)
    ? 'Poor housekeeping / slippery surface'
    : /alarm|detector|gas/i.test(reportText)
      ? 'Possible leak or detector-triggering condition'
      : /loose fitting|loose/i.test(reportText)
        ? 'Loose fitting / mechanical integrity issue'
        : 'Procedural or environmental condition';

  const classification = pickClassification(reportText);
  const severity = pickSeverity(reportText);
  const tags = Array.from(
    new Set(
      [
        /slip|trip|fall/i.test(reportText) ? 'slip-trip-fall' : '',
        /gas|detector|alarm/i.test(reportText) ? 'gas-detection' : '',
        /maintenance|inspection/i.test(reportText) ? 'maintenance' : '',
        /spill|leak/i.test(reportText) ? 'containment' : '',
        /unsafe|housekeeping|oily|wet/i.test(reportText) ? 'housekeeping' : '',
      ].filter(Boolean),
    ),
  );

  return {
    classification,
    severity,
    equipment,
    location,
    injuryType,
    probableRootCause,
    summary: `${classification} identified from free-text report with ${severity.toLowerCase()} severity indicators.`,
    tags: tags.length > 0 ? tags : ['general-hse'],
  };
}
