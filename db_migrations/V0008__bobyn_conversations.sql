CREATE TABLE IF NOT EXISTS bobyn_conversations (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL DEFAULT 'dm',
  name VARCHAR(100),
  avatar_emoji VARCHAR(10) DEFAULT '💬',
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bobyn_conversation_members (
  conversation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS bobyn_dm_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  username VARCHAR(50) NOT NULL,
  avatar_emoji VARCHAR(10) DEFAULT '🦉',
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);