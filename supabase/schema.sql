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
