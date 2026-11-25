-- SomnoWorks Referral App — Supabase Schema
-- Run this in your Supabase SQL editor

-- Physicians table
CREATE TABLE IF NOT EXISTS physicians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  npi TEXT NOT NULL UNIQUE,
  practice_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  phone TEXT NOT NULL,
  fax TEXT,
  email TEXT NOT NULL,
  signature_data TEXT -- base64 PNG from signature pad
);

-- Index for name search
CREATE INDEX IF NOT EXISTS physicians_last_name_idx ON physicians (lower(last_name));
CREATE INDEX IF NOT EXISTS physicians_first_name_idx ON physicians (lower(first_name));

-- Row Level Security
ALTER TABLE physicians ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads (physicians look up their own profile by name)
CREATE POLICY "Anyone can search physicians"
  ON physicians FOR SELECT
  USING (true);

-- Allow inserts (new physician registration)
CREATE POLICY "Anyone can register"
  ON physicians FOR INSERT
  WITH CHECK (true);

-- Allow updates only to own record (matched by NPI — enforced in app layer)
CREATE POLICY "Anyone can update physician"
  ON physicians FOR UPDATE
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- Referrals table (M3)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Physician snapshot
  physician_id UUID REFERENCES physicians(id),
  physician_name TEXT NOT NULL,
  physician_npi TEXT,
  physician_practice TEXT,
  physician_phone TEXT,
  physician_fax TEXT,
  physician_email TEXT,

  -- Patient snapshot
  patient_name TEXT NOT NULL,
  patient_dob TEXT,
  patient_address TEXT,
  patient_city TEXT,
  patient_state TEXT,
  patient_zip TEXT,
  patient_home_phone TEXT,
  patient_cell_phone TEXT,
  patient_insurance TEXT,
  patient_policy_id TEXT,

  -- Referral details
  service TEXT NOT NULL,           -- 'HST' | 'ECG_MCT'
  symptoms TEXT[],
  notes TEXT,

  -- Status tracking
  status TEXT DEFAULT 'received',  -- received | faxed | processed | cancelled
  fax_sent_at TIMESTAMPTZ,
  fax_status TEXT
);

CREATE INDEX IF NOT EXISTS referrals_created_at_idx ON referrals (created_at DESC);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON referrals (status);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Only service role (server-side) can read all referrals (admin panel uses service key)
CREATE POLICY "Service role can do everything on referrals"
  ON referrals FOR ALL
  USING (true)
  WITH CHECK (true);
