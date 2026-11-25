import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateReferralPdf } from '@/lib/generateReferralPdf'
import { ReferralSubmission } from '@/lib/types'

export const maxDuration = 60

// Use service role key for server-side Supabase writes
function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    console.log('[submit] Request received')
    const body = await request.json() as ReferralSubmission
    console.log('[submit] Parsed body, generating PDF...')
    const { physician, patient, service, symptoms, notes } = body

    const serviceLabel = service === 'HST' ? 'Home Sleep Test (HST)' : 'ECG / MCT Monitoring'
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })

    // ── 1. Generate PDF ──────────────────────────────────────────────────────
    const pdfBuffer = await generateReferralPdf(body)
    const pdfBase64 = pdfBuffer.toString('base64')

    // ── 2. Save to Supabase ──────────────────────────────────────────────────
    const supabase = getSupabaseServer()
    let referralId: string | null = null

    const { data: referralRow, error: dbError } = await supabase
      .from('referrals')
      .insert({
        physician_name: `Dr. ${physician.first_name} ${physician.last_name}`,
        physician_npi: physician.npi,
        physician_practice: physician.practice_name,
        physician_phone: physician.phone,
        physician_fax: physician.fax,
        physician_email: physician.email,
        patient_name: `${patient.first_name} ${patient.last_name}`,
        patient_dob: patient.dob,
        patient_address: patient.address,
        patient_city: patient.city,
        patient_state: patient.state,
        patient_zip: patient.zip,
        patient_home_phone: patient.home_phone,
        patient_cell_phone: patient.cell_phone,
        patient_insurance: patient.insurance,
        patient_policy_id: patient.policy_member_id,
        service,
        symptoms,
        notes: notes || '',
        status: 'received',
      })
      .select('id')
      .single()

    if (!dbError && referralRow) {
      referralId = referralRow.id
    }

    // ── 3. Google Sheets ─────────────────────────────────────────────────────
    const sheetsUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
    if (sheetsUrl) {
      const row = [
        timestamp,
        `${patient.first_name} ${patient.last_name}`,
        patient.dob,
        patient.address,
        patient.city,
        patient.state,
        patient.zip,
        patient.home_phone,
        patient.cell_phone,
        patient.insurance,
        patient.policy_member_id,
        serviceLabel,
        symptoms.join(', '),
        notes || '',
        `Dr. ${physician.first_name} ${physician.last_name}`,
        physician.practice_name,
        physician.npi,
        physician.phone,
        physician.fax,
        physician.email,
      ]

      await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      }).catch(() => {}) // non-fatal
    }

    // ── 4. Send Fax via Phaxio ───────────────────────────────────────────────
    const phaxioKey = process.env.PHAXIO_API_KEY
    const faxNumber = process.env.FAX_TO_NUMBER || '6469270340'

    let faxStatus = 'not_configured'
    if (phaxioKey) {
      try {
        const formData = new FormData()
        formData.append('to', faxNumber)
        formData.append(
          'file',
          new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }),
          `referral-${patient.last_name}-${patient.first_name}.pdf`
        )

        const faxRes = await fetch('https://api.phaxio.com/v2.1/faxes', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${phaxioKey}:`).toString('base64')}`,
          },
          body: formData,
        })

        const faxJson = await faxRes.json()
        faxStatus = faxJson.success ? 'sent' : `failed: ${faxJson.message || 'unknown'}`

        // Update Supabase row with fax status
        if (referralId) {
          await supabase
            .from('referrals')
            .update({
              fax_sent_at: new Date().toISOString(),
              fax_status: faxStatus,
              status: faxJson.success ? 'faxed' : 'received',
            })
            .eq('id', referralId)
        }
      } catch (e) {
        faxStatus = `error: ${e instanceof Error ? e.message : 'unknown'}`
      }
    }

    // ── 5. Email via Resend (with PDF attachment) ────────────────────────────
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

      const emailHtml = `
        <h2 style="color:#1e3a5f">New ${serviceLabel} Referral</h2>
        <p><strong>Submitted:</strong> ${timestamp}</p>

        <h3>Patient Information</h3>
        <table cellpadding="4" style="border-collapse:collapse;width:100%">
          <tr><td><strong>Name:</strong></td><td>${patient.first_name} ${patient.last_name}</td></tr>
          <tr><td><strong>DOB:</strong></td><td>${patient.dob}</td></tr>
          <tr><td><strong>Address:</strong></td><td>${patient.address}, ${patient.city}, ${patient.state} ${patient.zip}</td></tr>
          <tr><td><strong>Home Phone:</strong></td><td>${patient.home_phone || '—'}</td></tr>
          <tr><td><strong>Cell Phone:</strong></td><td>${patient.cell_phone || '—'}</td></tr>
          <tr><td><strong>Insurance:</strong></td><td>${patient.insurance || '—'}</td></tr>
          <tr><td><strong>Policy / Member ID:</strong></td><td>${patient.policy_member_id || '—'}</td></tr>
        </table>

        <h3>Referral Details</h3>
        <table cellpadding="4" style="border-collapse:collapse;width:100%">
          <tr><td><strong>Service:</strong></td><td>${serviceLabel}</td></tr>
          <tr><td><strong>Reason:</strong></td><td>${symptoms.join(', ')}</td></tr>
          ${notes ? `<tr><td><strong>Notes:</strong></td><td>${notes}</td></tr>` : ''}
          <tr><td><strong>Fax Status:</strong></td><td>${faxStatus}</td></tr>
        </table>

        <h3>Referring Physician</h3>
        <table cellpadding="4" style="border-collapse:collapse;width:100%">
          <tr><td><strong>Name:</strong></td><td>Dr. ${physician.first_name} ${physician.last_name}</td></tr>
          <tr><td><strong>Practice:</strong></td><td>${physician.practice_name}</td></tr>
          <tr><td><strong>NPI:</strong></td><td>${physician.npi}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${physician.phone}</td></tr>
          <tr><td><strong>Fax:</strong></td><td>${physician.fax}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${physician.email}</td></tr>
        </table>

        <p style="color:#888;font-size:11px;margin-top:24px">PDF referral form attached.</p>
      `

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: 'jshames@sleepworksmed.com',
          subject: `New ${serviceLabel} Referral — ${patient.first_name} ${patient.last_name}`,
          html: emailHtml,
          attachments: [
            {
              filename: `referral-${patient.last_name}-${patient.first_name}.pdf`,
              content: pdfBase64,
            },
          ],
        }),
      }).catch(() => {}) // non-fatal
    }

    return NextResponse.json({ success: true, referralId, faxStatus })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[submit] ERROR:', message, error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
