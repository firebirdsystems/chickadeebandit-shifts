SELECT
  c.member_id,
  COUNT(*) AS shift_count
FROM app_shifts__shift_claims c
JOIN app_shifts__shifts s
  ON s.id = c.shift_id
WHERE s.date >= :today
GROUP BY c.member_id
ORDER BY shift_count DESC
LIMIT 100
