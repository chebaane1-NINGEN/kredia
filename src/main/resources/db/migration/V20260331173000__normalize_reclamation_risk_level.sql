UPDATE reclamation
SET risk_level = UPPER(TRIM(risk_level))
WHERE risk_level IS NOT NULL
  AND TRIM(risk_level) <> '';

UPDATE reclamation
SET risk_level = 'LOW'
WHERE risk_level IS NULL
   OR TRIM(risk_level) = ''
   OR risk_level NOT IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

ALTER TABLE reclamation
    MODIFY risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW';
