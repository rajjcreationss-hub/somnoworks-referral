import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Physician = {
  id: string
  created_at: string
  first_name: string
  last_name: string
  npi: string
  practice_name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  fax: string
  email: string
  signature_data: string | null
}
