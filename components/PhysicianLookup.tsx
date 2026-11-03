'use client'

import { useState, useEffect, useRef } from 'react'
import { Physician } from '@/lib/types'

const STORAGE_KEY = 'sw_physician'

type Props = {
  onFound: (physician: Physician) => void
  onNew: () => void
}

export default function PhysicianLookup({ onFound, onNew }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Physician[]>([])
  const [loading, setLoading] = useState(false)
  const [savedPhysician, setSavedPhysician] = useState<Physician | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // On mount: check ?doc= param or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const docParam = params.get('doc')

    if (docParam) {
      // Load physician by slug (?doc=dr-john-smith)
      fetch(`/api/physician?slug=${encodeURIComponent(docParam)}`)
        .then(r => r.json())
        .then(json => {
          if (json.physician) {
            saveAndProceed(json.physician)
          }
        })
        .catch(() => {})
      return
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const p = JSON.parse(stored) as Physician
        setSavedPhysician(p)
      }
    } catch {}
  }, [])

  const saveAndProceed = (p: Physician) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    } catch {}
    onFound(p)
  }

  const handleClearSaved = () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    setSavedPhysician(null)
  }

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/physician?name=${encodeURIComponent(query)}`)
        const json = await res.json()
        setResults(json.physicians || [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // If a saved physician exists, show quick-continue card
  if (savedPhysician) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
          <p className="text-sm text-gray-500 mt-1">Continue as your saved profile or switch doctor.</p>
        </div>

        <div className="border-2 border-blue-500 rounded-xl p-4 bg-blue-50">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Saved Profile</p>
          <p className="text-base font-semibold text-gray-900">
            Dr. {savedPhysician.first_name} {savedPhysician.last_name}
          </p>
          <p className="text-sm text-gray-600">{savedPhysician.practice_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">NPI: {savedPhysician.npi}</p>
          <button
            onClick={() => saveAndProceed(savedPhysician)}
            className="mt-4 w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Continue as Dr. {savedPhysician.last_name} &rarr;
          </button>
        </div>

        <button
          onClick={handleClearSaved}
          className="text-sm text-gray-400 hover:text-gray-600 underline"
        >
          Not me — switch doctor
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Welcome</h2>
        <p className="text-sm text-gray-500 mt-1">Enter your name to get started</p>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search by last name or first name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />

        {loading && (
          <div className="text-sm text-gray-400 px-1">Searching...</div>
        )}

        {results.length > 0 && (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => saveAndProceed(p)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-900 text-sm">
                  Dr. {p.first_name} {p.last_name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {p.practice_name} &mdash; NPI: {p.npi}
                </div>
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="text-sm text-gray-500 px-1">No results found</div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-500 mb-3">First time using this portal?</p>
        <button
          onClick={onNew}
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Set up my profile
        </button>
      </div>
    </div>
  )
}
