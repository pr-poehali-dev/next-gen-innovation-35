INSERT INTO bobyn_channels (name, type, description)
SELECT name, type, description FROM (VALUES
  ('боб-общий', 'text', 'Главный канал бобей'),
  ('мемы-совы', 'text', 'Только мемы про боба'),
  ('бобинь-флуд', 'text', 'Флуд и хаос'),
  ('крик-бобини', 'text', 'Кричим вместе')
) AS v(name, type, description)
WHERE NOT EXISTS (SELECT 1 FROM bobyn_channels LIMIT 1);