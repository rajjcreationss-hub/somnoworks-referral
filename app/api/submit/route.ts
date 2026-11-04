import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { physician, patient, service, symptoms, notes } = body

    const serviceLabel = service === 'HST' ? 'Home Sleep Test (HST)' : 'ECG / MCT Monitoring'
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })

    // === Google Sheets ===
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
      })
    }

    // === Email via Resend ===
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const emailHtml = `
        <h2>New ${serviceLabel} Referral</h2>
        <p><strong>Submitted:</strong> ${timestamp}</p>

        <h3>Patient Information</h3>
        <table cellpadding="4" style="border-collapse:collapse; width:100%">
          <tr><td><strong>Name:</strong></td><td>${patient.first_name} ${patient.last_name}</td></tr>
          <tr><td><strong>DOB:</strong></td><td>${patient.dob}</td></tr>
          <tr><td><strong>Address:</strong></td><td>${patient.address}, ${patient.city}, ${patient.state} ${patient.zip}</td></tr>
          <tr><td><strong>Home Phone:</strong></td><td>${patient.home_phone || '—'}</td></tr>
          <tr><td><strong>Cell Phone:</strong></td><td>${patient.cell_phone || '—'}</td></tr>
          <tr><td><strong>Insurance:</strong></td><td>${patient.insurance || '—'}</td></tr>
          <tr><td><strong>Policy / Member ID:</strong></td><td>${patient.policy_member_id || '—'}</td></tr>
        </table>

        <h3>Referral Details</h3>
        <table cellpadding="4" style="border-collapse:collapse; width:100%">
          <tr><td><strong>Service:</strong></td><td>${serviceLabel}</td></tr>
          <tr><td><strong>Reason:</strong></td><td>${symptoms.join(', ')}</td></tr>
          ${notes ? `<tr><td><strong>Notes:</strong></td><td>${notes}</td></tr>` : ''}
        </table>

        <h3>Referring Physician</h3>
        <table cellpadding="4" style="border-collapse:collapse; width:100%">
          <tr><td><strong>Name:</strong></td><td>Dr. ${physician.first_name} ${physician.last_name}</td></tr>
          <tr><td><strong>Practice:</strong></td><td>${physician.practice_name}</td></tr>
          <tr><td><strong>NPI:</strong></td><td>${physician.npi}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${physician.phone}</td></tr>
          <tr><td><strong>Fax:</strong></td><td>${physician.fax}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${physician.email}</td></tr>
        </table>
      `

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: 'jshames@sleepworksmed.com',
          subject: `New ${serviceLabel} Referral — ${patient.first_name} ${patient.last_name}`,
          html: emailHtml,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
