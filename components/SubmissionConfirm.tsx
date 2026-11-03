'use client'

import { ReferralSubmission } from '@/lib/types'

type Props = {
  submission: ReferralSubmission
  onNewReferral: () => void
}

export default function SubmissionConfirm({ submission, onNewReferral }: Props) {
  const { physician, patient, service, symptoms } = submission

  const serviceLabel = service === 'HST' ? 'Home Sleep Test (HST)' : 'ECG / MCT Monitoring'

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="bg-green-50 border-2 border-green-400 rounded-xl p-5 text-center">
        <div className="text-3xl mb-2">✓</div>
        <h2 className="text-lg font-semibold text-green-800">Referral Submitted</h2>
        <p className="text-sm text-green-700 mt-1">
          Our team has been notified and will contact the patient shortly.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Patient</p>
          <p className="text-sm font-medium text-gray-900">
            {patient.first_name} {patient.last_name}
          </p>
          <p className="text-xs text-gray-500">{patient.dob}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Service</p>
          <p className="text-sm font-medium text-gray-900">{serviceLabel}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reason for Referral</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {symptoms.map(s => (
              <span key={s} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Referring Physician</p>
          <p className="text-sm font-medium text-gray-900">
            Dr. {physician.first_name} {physician.last_name}
          </p>
          <p className="text-xs text-gray-500">{physician.practice_name}</p>
        </div>
      </div>

      <button
        onClick={onNewReferral}
        className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Submit Another Referral
      </button>
    </div>
  )
}
