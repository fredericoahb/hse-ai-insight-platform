export type IncidentMessage = {
  incidentId: string;
  reportText: string;
  createdAt?: string;
};

export type AiExtraction = {
  classification: string;
  severity: string;
  equipment: string;
  location: string;
  injuryType: string;
  probableRootCause: string;
  summary: string;
  tags: string[];
};
