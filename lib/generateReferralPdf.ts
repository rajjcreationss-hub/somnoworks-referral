import PDFDocument from 'pdfkit'
import { ReferralSubmission } from './types'

export async function generateReferralPdf(sub: ReferralSubmission): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const { physician, patient, service, symptoms, notes } = sub
    const serviceLabel = service === 'HST' ? 'Home Sleep Test (HST)' : 'ECG / MCT Monitoring'
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })

    // ── Header ──────────────────────────────────────────────────────────────
    doc
      .fontSize(18)
      .fillColor('#1e3a5f')
      .text('SomnoWorks / CardioWorx', { align: 'center' })
      .fontSize(12)
      .fillColor('#555')
      .text('Physician Referral Form', { align: 'center' })
      .moveDown(0.3)
      .fontSize(9)
      .fillColor('#888')
      .text(`Generated: ${timestamp}`, { align: 'center' })
      .moveDown(1)

    // ── Helper: section heading ──────────────────────────────────────────────
    const sectionHeading = (title: string) => {
      doc
        .fontSize(11)
        .fillColor('#1e3a5f')
        .font('Helvetica-Bold')
        .text(title.toUpperCase(), { underline: false })
        .moveDown(0.2)
        .moveTo(50, doc.y)
        .lineTo(562, doc.y)
        .strokeColor('#1e3a5f')
        .stroke()
        .moveDown(0.3)
        .font('Helvetica')
        .fillColor('#222')
        .fontSize(10)
    }

    // ── Helper: row ──────────────────────────────────────────────────────────
    const row = (label: string, value: string) => {
      if (!value) return
      doc
        .font('Helvetica-Bold')
        .text(`${label}: `, { continued: true })
        .font('Helvetica')
        .text(value || '—')
    }

    // ── Service ──────────────────────────────────────────────────────────────
    sectionHeading('Referral Service')
    row('Service Requested', serviceLabel)
    row('Reason for Referral', symptoms.join(', '))
    if (notes) row('Additional Notes', notes)
    doc.moveDown(0.8)

    // ── Patient ──────────────────────────────────────────────────────────────
    sectionHeading('Patient Information')
    row('Full Name', `${patient.first_name} ${patient.last_name}`)
    row('Date of Birth', patient.dob)
    row('Address', `${patient.address}, ${patient.city}, ${patient.state} ${patient.zip}`)
    row('Home Phone', patient.home_phone)
    row('Cell Phone', patient.cell_phone)
    row('Insurance', patient.insurance)
    row('Policy / Member ID', patient.policy_member_id)
    doc.moveDown(0.8)

    // ── Physician ────────────────────────────────────────────────────────────
    sectionHeading('Referring Physician')
    row('Physician', `Dr. ${physician.first_name} ${physician.last_name}`)
    row('Practice', physician.practice_name)
    row('NPI', physician.npi)
    row('Address', `${physician.address}, ${physician.city}, ${physician.state} ${physician.zip}`)
    row('Phone', physician.phone)
    row('Fax', physician.fax)
    row('Email', physician.email)
    doc.moveDown(1.5)

    // ── Signature block ──────────────────────────────────────────────────────
    if (physician.signature_data) {
      sectionHeading('Physician Signature')
      try {
        const base64Data = physician.signature_data.replace(/^data:image\/\w+;base64,/, '')
        const imgBuffer = Buffer.from(base64Data, 'base64')
        doc.image(imgBuffer, { width: 180 })
        doc.moveDown(0.3)
      } catch {
        // skip if image fails
      }
    } else {
      // Blank signature line
      doc
        .fontSize(10)
        .fillColor('#222')
        .text('Physician Signature: ', { continued: true })
        .moveTo(doc.x + 180, doc.y + 10)
        .lineTo(doc.x + 380, doc.y + 10)
        .strokeColor('#333')
        .stroke()
      doc.moveDown(1)
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    doc
      .fontSize(8)
      .fillColor('#aaa')
      .text(
        'This referral form is confidential and intended solely for the use of SomnoWorks / CardioWorx and the referring physician.',
        50,
        doc.page.height - 60,
        { align: 'center', width: 512 }
      )

    doc.end()
  })
}
