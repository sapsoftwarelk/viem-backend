-- Append a short id suffix to duplicate position_title values to make them unique
WITH dup AS (
  SELECT position_title
  FROM "Role"
  GROUP BY position_title
  HAVING COUNT(*) > 1
)
UPDATE "Role" r
SET position_title = r.position_title || '-' || substring(r.id::text, 1, 8)
FROM dup
WHERE r.position_title = dup.position_title;
