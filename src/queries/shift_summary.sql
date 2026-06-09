SELECT
  member_id,
  COUNT(*) AS shift_count
FROM shifts
WHERE household_id = current_setting('app.household_id', true)::uuid
  AND date >= to_char(NOW(), 'YYYY-MM-DD')
  AND member_id IS NOT NULL
GROUP BY member_id
ORDER BY shift_count DESC
LIMIT 100
