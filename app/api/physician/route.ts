import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET /api/physician?name=John+Smith — search by name
export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')

  if (!name || name.length < 2) {
    return NextResponse.json({ physicians: [] })
  }

  const { data, error } = await supabase
    .from('physicians')
    .select('id, first_name, last_name, npi, practice_name, address, city, state, zip, phone, fax, email')
    .or(`last_name.ilike.%${name}%,first_name.ilike.%${name}%`)
    .limit(5)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ physicians: data })
}

// POST /api/physician — create new physician profile
export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  try {
    const body = await request.json()

    const required = ['first_name', 'last_name', 'npi', 'practice_name', 'address', 'city', 'state', 'zip', 'phone', 'email']
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Check NPI uniqueness
    const { data: existing } = await supabase
      .from('physicians')
      .select('id')
      .eq('npi', body.npi)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'NPI already registered' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('physicians')
      .insert({
        first_name: body.first_name,
        last_name: body.last_name,
        npi: body.npi,
        practice_name: body.practice_name,
        address: body.address,
        city: body.city,
        state: body.state,
        zip: body.zip,
        phone: body.phone,
        fax: body.fax || null,
        email: body.email,
        signature_data: body.signature_data || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ physician: data }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH /api/physician — update signature
export async function PATCH(request: NextRequest) {
  const supabase = getSupabase()
  try {
    const body = await request.json()
    const { id, signature_data } = body

    if (!id || !signature_data) {
      return NextResponse.json({ error: 'Missing id or signature_data' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('physicians')
      .update({ signature_data })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ physician: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
