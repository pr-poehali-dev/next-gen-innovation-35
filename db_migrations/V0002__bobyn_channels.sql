CREATE TABLE IF NOT EXISTS bobyn_channels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(10) DEFAULT 'text',
  description VARCHAR(255)
);