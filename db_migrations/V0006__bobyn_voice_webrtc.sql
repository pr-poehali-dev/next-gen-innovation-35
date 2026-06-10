CREATE TABLE IF NOT EXISTS bobyn_voice_rooms (
  id SERIAL PRIMARY KEY,
  channel_name VARCHAR(50) NOT NULL,
  user_id INTEGER NOT NULL,
  username VARCHAR(50) NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bobyn_webrtc_signals (
  id SERIAL PRIMARY KEY,
  room VARCHAR(50) NOT NULL,
  from_user VARCHAR(50) NOT NULL,
  to_user VARCHAR(50),
  type VARCHAR(20) NOT NULL,
  payload TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);