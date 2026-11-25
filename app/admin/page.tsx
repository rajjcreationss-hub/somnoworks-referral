'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

type Referral = {
  id: string
  created_at: string
  patient_name: string
  patient_dob: string
  patient_insurance: string
  physician_name: string
  physician_practice: string
  physician_phone: string
  physician_fax: string
  service: string
  symptoms: string[]
  notes: string
  status: string
  fax_sent_at: string | null
  fax_status: string | null
  // full patient
  patient_address: string
  patient_city: string
  patient_state: string
  patient_zip: string
  patient_home_phone: string
  patient_cell_phone: string
  patient_policy_id: string
  // physician
  physician_npi: string
  physician_email: string
}

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-yellow-100 text-yellow-800',
  faxed: 'bg-blue-100 text-blue-800',
  processed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const ADMIN_PASSWORD = 'somno2026'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [selected, setSelected] = useState<Referral | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchReferrals = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setReferrals(data as Referral[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (authed) fetchReferrals()
  }, [authed, fetchReferrals])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
    } else {
      alert('Incorrect password')
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id)
    await supabase.from('referrals').update({ status: newStatus }).eq('id', id)
    setReferrals(prev =>
      prev.map(r => (r.id === id ? { ...r, status: newStatus } : r))
    )
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null)
    setUpdating(null)
  }

  const filtered = referrals.filter(r => {
    const matchSearch =
      !search ||
      r.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      r.physician_name.toLowerCase().includes(search.toLowerCase()) ||
      r.physician_practice?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const matchService = serviceFilter === 'all' || r.service === serviceFilter
    return matchSearch && matchStatus && matchService
  })

  const stats = {
    total: referrals.length,
    received: referrals.filter(r => r.status === 'received').length,
    faxed: referrals.filter(r => r.status === 'faxed').length,
    processed: referrals.filter(r => r.status === 'processed').length,
    hst: referrals.filter(r => r.service === 'HST').length,
    ecg: referrals.filter(r => r.service === 'ECG_MCT').length,
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <img src="/somnoworks-logo.jpg" alt="SomnoWorks" className="h-10 object-contain mb-6" />
          <h1 className="text-xl font-bold text-gray-900 mb-1">Admin Panel</h1>
          <p className="text-sm text-gray-500 mb-6">Referral Tracker</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/somnoworks-logo.jpg" alt="SomnoWorks" className="h-8 object-contain" />
            <div>
              <h1 className="text-base font-bold text-gray-900">Referral Tracker</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={fetchReferrals}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'bg-gray-100 text-gray-800' },
            { label: 'Received', value: stats.received, color: 'bg-yellow-100 text-yellow-800' },
            { label: 'Faxed', value: stats.faxed, color: 'bg-blue-100 text-blue-800' },
            { label: 'Processed', value: stats.processed, color: 'bg-green-100 text-green-800' },
            { label: 'HST', value: stats.hst, color: 'bg-purple-100 text-purple-800' },
            { label: 'ECG/MCT', value: stats.ecg, color: 'bg-pink-100 text-pink-800' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl px-4 py-3 text-center ${s.color}`}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient or physician..."
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="received">Received</option>
            <option value="faxed">Faxed</option>
            <option value="processed">Processed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Services</option>
            <option value="HST">Home Sleep Test</option>
            <option value="ECG_MCT">ECG / MCT</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading referrals...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No referrals found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Patient</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Physician</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Fax</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                        <div className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.patient_name}</div>
                        <div className="text-xs text-gray-500">DOB: {r.patient_dob}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{r.physician_name}</div>
                        <div className="text-xs text-gray-500">{r.physician_practice}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.service === 'HST' ? 'bg-purple-100 text-purple-800' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {r.service === 'HST' ? 'HST' : 'ECG/MCT'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={r.status}
                          onChange={e => updateStatus(r.id, e.target.value)}
                          disabled={updating === r.id}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[r.status] || 'bg-gray-100'}`}
                        >
                          <option value="received">Received</option>
                          <option value="faxed">Faxed</option>
                          <option value="processed">Processed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {r.fax_sent_at ? (
                          <span className="text-green-600">Sent</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(r)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.patient_name}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(selected.created_at).toLocaleString('en-US')}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="col-span-2 font-semibold text-gray-700 border-b pb-1 mt-2">Patient</div>
                <InfoRow label="DOB" value={selected.patient_dob} />
                <InfoRow label="Insurance" value={selected.patient_insurance} />
                <InfoRow label="Policy ID" value={selected.patient_policy_id} />
                <InfoRow label="Home Phone" value={selected.patient_home_phone} />
                <InfoRow label="Cell Phone" value={selected.patient_cell_phone} />
                <div className="col-span-2">
                  <InfoRow label="Address" value={`${selected.patient_address}, ${selected.patient_city}, ${selected.patient_state} ${selected.patient_zip}`} />
                </div>

                <div className="col-span-2 font-semibold text-gray-700 border-b pb-1 mt-2">Physician</div>
                <InfoRow label="Name" value={selected.physician_name} />
                <InfoRow label="NPI" value={selected.physician_npi} />
                <InfoRow label="Practice" value={selected.physician_practice} />
                <InfoRow label="Phone" value={selected.physician_phone} />
                <InfoRow label="Fax" value={selected.physician_fax} />
                <InfoRow label="Email" value={selected.physician_email} />

                <div className="col-span-2 font-semibold text-gray-700 border-b pb-1 mt-2">Referral</div>
                <InfoRow label="Service" value={selected.service === 'HST' ? 'Home Sleep Test' : 'ECG / MCT'} />
                <div className="col-span-2">
                  <InfoRow label="Symptoms" value={selected.symptoms?.join(', ')} />
                </div>
                {selected.notes && (
                  <div className="col-span-2">
                    <InfoRow label="Notes" value={selected.notes} />
                  </div>
                )}
                <InfoRow label="Fax Status" value={selected.fax_status || '—'} />
                {selected.fax_sent_at && (
                  <InfoRow label="Fax Sent" value={new Date(selected.fax_sent_at).toLocaleString('en-US')} />
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Update Status</label>
                <select
                  value={selected.status}
                  onChange={e => updateStatus(selected.id, e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="received">Received</option>
                  <option value="faxed">Faxed</option>
                  <option value="processed">Processed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return null
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  )
}
