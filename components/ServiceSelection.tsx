'use client'

import { useState } from 'react'
import { ServiceType } from '@/lib/types'

type Props = {
  onSelect: (service: ServiceType, symptoms: string[], notes: string) => void
  onBack: () => void
}

const HST_SYMPTOMS = [
  'Snoring',
  'Witnessed apnea (gasping/choking)',
  'Excessive daytime sleepiness',
  'Morning headaches',
  'Unrefreshing sleep',
  'Difficulty concentrating',
  'Mood changes / irritability',
  'Frequent nighttime urination',
  'Hypertension',
  'Obesity (BMI ≥ 30)',
  'Surgery Clearance',
]

const ECG_MCT_SYMPTOMS = [
  'Palpitations',
  'Dizziness',
  'Syncope & Collapse',
  'Atrial Fibrillation',
  'Atrial Flutter',
  'Tachycardia',
  'Bradycardia',
  'Arrhythmias',
  'Feeling Faint',
  'Sleep Apnea',
  'Post Cardiovascular Surgery',
  'Shortness of Breath',
  'Clammy / Sweaty',
]

export default function ServiceSelection({ onSelect, onBack }: Props) {
  const [service, setService] = useState<ServiceType | null>(null)
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const symptomList = service === 'HST' ? HST_SYMPTOMS : service === 'ECG_MCT' ? ECG_MCT_SYMPTOMS : []

  const toggleSymptom = (s: string) => {
    setSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const handleServiceChange = (s: ServiceType) => {
    setService(s)
    setSymptoms([])
  }

  const canProceed = service !== null && symptoms.length > 0

  return (
    <div className="space-y-5">
      <div>
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-3 inline-flex items-center gap-1">
          &larr; Back to patient review
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Select Service</h2>
        <p className="text-sm text-gray-500 mt-1">Choose the service and indicate the reason for referral.</p>
      </div>

      {/* Service selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleServiceChange('HST')}
          className={`border-2 rounded-xl p-4 text-left transition-colors ${
            service === 'HST'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-lg mb-1">🌙</div>
          <p className="text-sm font-semibold text-gray-900">Home Sleep Test</p>
          <p className="text-xs text-gray-500 mt-0.5">HST — Sleep study</p>
        </button>

        <button
          onClick={() => handleServiceChange('ECG_MCT')}
          className={`border-2 rounded-xl p-4 text-left transition-colors ${
            service === 'ECG_MCT'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-lg mb-1">❤️</div>
          <p className="text-sm font-semibold text-gray-900">ECG / MCT</p>
          <p className="text-xs text-gray-500 mt-0.5">Cardiac monitoring</p>
        </button>
      </div>

      {/* Symptom list */}
      {service && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Reason for referral <span className="text-red-500">*</span>
          </p>
          <div className="space-y-2">
            {symptomList.map(s => (
              <label
                key={s}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  symptoms.includes(s)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={symptoms.includes(s)}
                  onChange={() => toggleSymptom(s)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-800">{s}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {service && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional notes <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional clinical notes..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      )}

      {service && (
        <button
          onClick={() => canProceed && onSelect(service, symptoms, notes)}
          disabled={!canProceed}
          className={`w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            canProceed
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Submit Referral &rarr;
        </button>
      )}
    </div>
  )
}
