SELECT
  member_id,
  COUNT(*) AS shift_count
FROM app_shifts__shifts
WHERE date >= date('now')
  AND member_id IS NOT NULL
GROUP BY member_id
ORDER BY shift_count DESC
LIMIT 100
