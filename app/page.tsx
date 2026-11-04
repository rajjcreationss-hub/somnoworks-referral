'use client'

import { useState } from 'react'
import PhysicianLookup from '@/components/PhysicianLookup'
import PhysicianSetup from '@/components/PhysicianSetup'
import OCRUpload from '@/components/OCRUpload'
import PatientReview from '@/components/PatientReview'
import ServiceSelection from '@/components/ServiceSelection'
import SubmissionConfirm from '@/components/SubmissionConfirm'
import { Physician, PatientData, ServiceType, ReferralSubmission } from '@/lib/types'

type Step = 'lookup' | 'setup' | 'ocr' | 'review' | 'service' | 'confirm'

export default function HomePage() {
  const [step, setStep] = useState<Step>('lookup')
  const [physician, setPhysician] = useState<Physician | null>(null)
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [submission, setSubmission] = useState<ReferralSubmission | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handlePhysicianFound = (p: Physician) => {
    setPhysician(p)
    setStep('ocr')
  }

  const handleNewPhysician = () => {
    setStep('setup')
  }

  const handleSetupComplete = (p: Physician) => {
    setPhysician(p)
    setStep('ocr')
  }

  const handleOCRComplete = (data: PatientData) => {
    setPatientData(data)
    setStep('review')
  }

  const handleServiceSelect = async (service: ServiceType, symptoms: string[], notes: string) => {
    if (!physician || !patientData) return

    const sub: ReferralSubmission = { physician, patient: patientData, service, symptoms, notes }

    setSubmitting(true)
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
    } catch {
      // still show confirm even if submission fails (silent fail)
    } finally {
      setSubmitting(false)
    }

    setSubmission(sub)
    setStep('confirm')
  }

  const handleNewReferral = () => {
    setPatientData(null)
    setSubmission(null)
    setStep('ocr')
  }

  const progressSteps: Step[] = ['lookup', 'ocr', 'review', 'service', 'confirm']
  const currentIndex = progressSteps.indexOf(step === 'setup' ? 'lookup' : step)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <img src="/somnoworks-logo.jpg" alt="SomnoWorks" className="h-10 object-contain" />
            <p className="text-xs text-gray-500">Physician Referral Portal</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="max-w-lg mx-auto flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= currentIndex ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 'lookup' && (
          <PhysicianLookup
            onFound={handlePhysicianFound}
            onNew={handleNewPhysician}
          />
        )}
        {step === 'setup' && (
          <PhysicianSetup
            onComplete={handleSetupComplete}
            onBack={() => setStep('lookup')}
          />
        )}
        {step === 'ocr' && physician && (
          <OCRUpload
            physician={physician}
            onComplete={handleOCRComplete}
          />
        )}
        {step === 'review' && physician && patientData && (
          <PatientReview
            physician={physician}
            patientData={patientData}
            onPatientDataChange={setPatientData}
            onBack={() => setStep('ocr')}
            onProceed={() => setStep('service')}
          />
        )}
        {step === 'service' && physician && (
          <ServiceSelection
            onSelect={handleServiceSelect}
            onBack={() => setStep('review')}
          />
        )}
        {step === 'confirm' && submission && (
          <SubmissionConfirm
            submission={submission}
            onNewReferral={handleNewReferral}
          />
        )}

        {submitting && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 flex items-center gap-3 shadow-xl">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-gray-700">Submitting referral...</span>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
