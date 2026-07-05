SELECT
  s.id,
  s.date,
  s.note,
  s.capacity,
  t.name  AS shift_type_name,
  t.emoji AS shift_type_emoji,
  COUNT(c.id) AS claimed_count,
  COALESCE(GROUP_CONCAT(c.member_id), '') AS member_ids
FROM app_shifts__shifts s
JOIN app_shifts__shift_types t
  ON t.id = s.shift_type_id
LEFT JOIN app_shifts__shift_claims c
  ON c.shift_id = s.id
WHERE s.date >= date('now')
GROUP BY s.id, s.date, s.note, s.capacity, t.name, t.emoji
ORDER BY s.date ASC
LIMIT 200
