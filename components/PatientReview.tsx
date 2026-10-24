'use client'

import { useForm } from 'react-hook-form'
import { PatientData, Physician } from '@/lib/types'

type Props = {
  physician: Physician
  patientData: PatientData
  onPatientDataChange: (data: PatientData) => void
  onBack: () => void
  onProceed: () => void
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
]

export default function PatientReview({
  physician,
  patientData,
  onPatientDataChange,
  onBack,
  onProceed,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientData>({ defaultValues: patientData })

  const onSubmit = (data: PatientData) => {
    onPatientDataChange(data)
    onProceed()
  }

  const Field = ({
    label,
    name,
    type = 'text',
    placeholder,
    required = true,
    isSelect = false,
  }: {
    label: string
    name: keyof PatientData
    type?: string
    placeholder?: string
    required?: boolean
    isSelect?: boolean
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      {isSelect ? (
        <select
          {...register(name)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">—</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          {...register(name, { required: required ? `${label} is required` : false })}
          className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`}
        />
      )}
      {errors[name] && (
        <p className="text-xs text-red-500 mt-1">{errors[name]?.message}</p>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-3 inline-flex items-center gap-1">
          &larr; Retake photo
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Review Patient Data</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review and correct the extracted information before proceeding.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
        AI-extracted data — please verify all fields are correct before submitting.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Last Name" name="last_name" placeholder="Smith" />
          <Field label="First Name" name="first_name" placeholder="John" />
        </div>

        <Field label="Date of Birth" name="dob" type="date" />

        <Field label="Street Address" name="address" placeholder="123 Main St" />

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <Field label="City" name="city" placeholder="Brooklyn" />
          </div>
          <Field label="State" name="state" isSelect />
          <Field label="Zip" name="zip" placeholder="11201" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Home Phone" name="home_phone" type="tel" placeholder="(718) 555-0100" required={false} />
          <Field label="Cell Phone" name="cell_phone" type="tel" placeholder="(718) 555-0200" required={false} />
        </div>

        <Field label="Insurance / Payer" name="insurance" placeholder="Aetna" required={false} />

        <Field label="Policy / Member ID" name="policy_member_id" placeholder="XYZ123456789" required={false} />

        {/* Referring physician summary */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Referring Physician</p>
          <p className="text-sm font-medium text-gray-900">
            Dr. {physician.first_name} {physician.last_name}
          </p>
          <p className="text-xs text-gray-500">{physician.practice_name}</p>
          <p className="text-xs text-gray-500">NPI: {physician.npi}</p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Confirm & Select Service &rarr;
        </button>
      </form>
    </div>
  )
}
