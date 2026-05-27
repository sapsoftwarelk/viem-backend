UPDATE "Role"
SET position_title = name
WHERE position_title = '' OR position_title IS NULL;
