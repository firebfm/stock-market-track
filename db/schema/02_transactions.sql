DROP TABLE IF EXISTS transactions CASCADE;

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY NOT NULL,
  symbol VARCHAR(8) NOT NULL,
  shares smallint	NOT NULL,
  price decimal(12,2) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);
