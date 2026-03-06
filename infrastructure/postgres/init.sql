CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_text TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
  classification VARCHAR(64),
  severity VARCHAR(32),
  equipment TEXT,
  location TEXT,
  injury_type TEXT,
  probable_root_cause TEXT,
  ai_summary TEXT,
  extracted_entities JSONB,
  tags JSONB,
  analyzed_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_classification ON incidents (classification);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents (severity);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_incidents_updated_at ON incidents;
CREATE TRIGGER trg_incidents_updated_at
BEFORE UPDATE ON incidents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

INSERT INTO incidents (
  report_text,
  status,
  classification,
  severity,
  equipment,
  location,
  injury_type,
  probable_root_cause,
  ai_summary,
  extracted_entities,
  tags,
  analyzed_at,
  created_at
)
SELECT
  'Technician slipped while inspecting the mud pump skid near well pad A17. Minor wrist pain reported. Area had oily residue near the maintenance access ladder.',
  'PROCESSED',
  'Near Miss',
  'Medium',
  'Mud pump skid',
  'Well pad A17',
  'Minor wrist pain',
  'Poor housekeeping / slippery surface',
  'Slip event during inspection with low consequence but clear exposure to a repeatable hazard.',
  '{"equipment":"Mud pump skid","location":"Well pad A17","injuryType":"Minor wrist pain","probableRootCause":"Poor housekeeping / slippery surface"}'::jsonb,
  '["slip","maintenance","housekeeping"]'::jsonb,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM incidents LIMIT 1);
