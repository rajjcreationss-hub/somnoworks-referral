'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { PhysicianFormData, Physician } from '@/lib/types'

type Props = {
  onComplete: (physician: Physician) => void
  onBack: () => void
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
]

export default function PhysicianSetup({ onComplete, onBack }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhysicianFormData>()

  const onSubmit = async (data: PhysicianFormData) => {
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/physician', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Failed to save profile')
        return
      }

      onComplete(json.physician)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const Field = ({
    label,
    name,
    type = 'text',
    placeholder,
    required = true,
  }: {
    label: string
    name: keyof PhysicianFormData
    type?: string
    placeholder?: string
    required?: boolean
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        {...register(name, { required: required ? `${label} is required` : false })}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          errors[name] ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      {errors[name] && (
        <p className="text-xs text-red-500 mt-1">{errors[name]?.message}</p>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-3 inline-flex items-center gap-1">
          &larr; Back
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Physician Profile Setup</h2>
        <p className="text-sm text-gray-500 mt-1">Enter your information once. It will be saved for future referrals.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" name="first_name" placeholder="John" />
          <Field label="Last Name" name="last_name" placeholder="Smith" />
        </div>

        <Field
          label="NPI Number"
          name="npi"
          placeholder="10-digit NPI"
        />

        <Field label="Practice / Hospital Name" name="practice_name" placeholder="Brooklyn Medical Group" />

        <Field label="Practice Address" name="address" placeholder="123 Main St" />

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <Field label="City" name="city" placeholder="Brooklyn" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
            <select
              {...register('state', { required: 'State is required' })}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                errors.state ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">—</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
          </div>
          <div>
            <Field label="Zip" name="zip" placeholder="11201" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" name="phone" type="tel" placeholder="(718) 555-0100" />
          <Field label="Fax" name="fax" type="tel" placeholder="(718) 555-0101" required={false} />
        </div>

        <Field label="Email" name="email" type="email" placeholder="dr.smith@practice.com" />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Profile & Continue'}
        </button>
      </form>
    </div>
  )
}
