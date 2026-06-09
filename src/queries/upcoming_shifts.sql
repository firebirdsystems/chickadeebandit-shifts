SELECT
  s.id,
  s.date,
  s.member_id,
  s.note,
  t.name  AS shift_type_name,
  t.emoji AS shift_type_emoji
FROM shifts s
JOIN shift_types t
  ON t.id = s.shift_type_id
  AND t.household_id = s.household_id
WHERE s.household_id = current_setting('app.household_id', true)::uuid
  AND s.date >= to_char(NOW(), 'YYYY-MM-DD')
ORDER BY s.date ASC
LIMIT 200
