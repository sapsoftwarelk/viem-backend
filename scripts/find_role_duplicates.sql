SELECT position_title, COUNT(*) FROM "Role" GROUP BY position_title HAVING COUNT(*) > 1;
