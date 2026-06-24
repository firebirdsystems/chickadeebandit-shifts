SELECT
  s.id,
  s.date,
  s.member_id,
  s.note,
  t.name  AS shift_type_name,
  t.emoji AS shift_type_emoji
FROM app_shifts__shifts s
JOIN app_shifts__shift_types t
  ON t.id = s.shift_type_id
WHERE s.date >= date('now')
ORDER BY s.date ASC
LIMIT 200
