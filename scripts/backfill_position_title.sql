UPDATE "Role"
SET position_title = 'ROLE-' || substring(id::text, 1, 8)
WHERE position_title = '' OR position_title IS NULL;
