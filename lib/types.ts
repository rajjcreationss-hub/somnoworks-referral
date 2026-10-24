export type PatientData = {
  last_name: string
  first_name: string
  dob: string
  address: string
  city: string
  state: string
  zip: string
  home_phone: string
  cell_phone: string
  insurance: string
  policy_member_id: string
}

export type PhysicianFormData = {
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
}

export type Physician = {
  id: string
  created_at?: string
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
