-- Nieuwe tabel voor de AIPA-intake (vervangt het statische registratieformulier).
-- Puur additief: raakt geen bestaande tabel of rij.
CREATE TABLE IF NOT EXISTS onboarding_profiles (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  profile JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
