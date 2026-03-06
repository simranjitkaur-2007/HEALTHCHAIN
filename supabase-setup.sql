-- ============================================
-- HEALTHCHAIN — SUPABASE SQL SETUP SCRIPT
-- ============================================
-- Run ALL of this in your Supabase SQL Editor
-- (supabase.com → your project → SQL Editor → New Query → Paste → Run)
-- ============================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_id TEXT UNIQUE NOT NULL,          -- PAT-XXXXXX / HSP-XXXXXX / INS-XXXXXX
  role TEXT CHECK (role IN ('patient','hospital','insurer')) NOT NULL,
  password_hash TEXT NOT NULL,              -- bcrypt hash — never plain text
  name TEXT,
  email TEXT,
  phone TEXT,
  age INT,
  insurance_policy_id TEXT,
  insurer_unique_id TEXT,                   -- links patient to their insurer
  registration_number TEXT,
  supported_insurers TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Treatments Table
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_unique_id TEXT NOT NULL REFERENCES users(unique_id),
  hospital_unique_id TEXT NOT NULL REFERENCES users(unique_id),
  hospital_name TEXT,
  doctor_name TEXT,
  admission_date DATE,
  discharge_date DATE,
  diagnosis TEXT,
  icd_codes TEXT[],
  prescription_cid TEXT,                    -- IPFS CID of prescription
  invoice_cid TEXT,                         -- IPFS CID of invoice
  photo_cids TEXT[],
  lab_report_cids TEXT[],
  amount_spent NUMERIC(12,2),
  blockchain_tx_hash TEXT,                  -- Ethereum tx hash (proof of record)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Claims Table
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_unique_id TEXT NOT NULL REFERENCES users(unique_id),
  treatment_id UUID REFERENCES treatments(id),
  insurer_unique_id TEXT NOT NULL REFERENCES users(unique_id),
  policy_number TEXT,
  policy_details TEXT,
  claimed_amount NUMERIC(12,2),
  status TEXT CHECK (status IN ('pending','approved','rejected','under_review')) DEFAULT 'pending',
  fraud_score INT CHECK (fraud_score BETWEEN 0 AND 100),
  ai_explanation TEXT,
  blockchain_tx_hash TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 4. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_treatments_patient ON treatments(patient_unique_id);
CREATE INDEX IF NOT EXISTS idx_treatments_hospital ON treatments(hospital_unique_id);
CREATE INDEX IF NOT EXISTS idx_claims_patient ON claims(patient_unique_id);
CREATE INDEX IF NOT EXISTS idx_claims_insurer ON claims(insurer_unique_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);

-- 5. Demo seed data (run separately if needed)
-- INSERT INTO users (unique_id, role, password_hash, name) VALUES
-- ('HSP-000001', 'hospital', '$2b$12$...', 'AIIMS Delhi'),
-- ('INS-000001', 'insurer', '$2b$12$...', 'StarHealth Insurance'),
-- ('PAT-000001', 'patient', '$2b$12$...', 'Rahul Kumar');
-- 
-- Password for all: demo123
-- Use POST /api/auth/seed-demo endpoint to create these automatically!
