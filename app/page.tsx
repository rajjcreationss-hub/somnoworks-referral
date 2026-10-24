'use client'

import { useState } from 'react'
import PhysicianLookup from '@/components/PhysicianLookup'
import PhysicianSetup from '@/components/PhysicianSetup'
import OCRUpload from '@/components/OCRUpload'
import PatientReview from '@/components/PatientReview'
import { Physician, PatientData } from '@/lib/types'

type Step = 'lookup' | 'setup' | 'ocr' | 'review'

export default function HomePage() {
  const [step, setStep] = useState<Step>('lookup')
  const [physician, setPhysician] = useState<Physician | null>(null)
  const [patientData, setPatientData] = useState<PatientData | null>(null)

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

  const handleReviewBack = () => {
    setStep('ocr')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SW</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">SomnoWorks / CardioWorx</h1>
              <p className="text-xs text-gray-500">Physician Referral Portal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="max-w-lg mx-auto flex gap-1">
          {(['lookup', 'ocr', 'review'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div
                className={`h-1 flex-1 rounded-full ${
                  step === 'setup'
                    ? i === 0 ? 'bg-blue-600' : 'bg-gray-200'
                    : ['lookup', 'setup'].includes(step) && i === 0
                    ? 'bg-blue-600'
                    : step === 'ocr' && i <= 1
                    ? 'bg-blue-600'
                    : step === 'review' && i <= 2
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
              />
            </div>
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
            onBack={handleReviewBack}
            onProceed={() => {
              // Milestone 2: service selection
              alert('Milestone 2 — service selection coming soon')
            }}
          />
        )}
      </div>
    </main>
  )
}
