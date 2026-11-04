'use client'

import { useState, useRef, useCallback } from 'react'
import { Physician, PatientData } from '@/lib/types'

function toSlug(p: Physician) {
  const first = p.first_name.toLowerCase().replace(/\s+/g, '-')
  const last = p.last_name.toLowerCase().replace(/\s+/g, '-')
  return `dr-${first}-${last}`
}

type Props = {
  physician: Physician
  onComplete: (data: PatientData) => void
}

export default function OCRUpload({ physician, onComplete }: Props) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const personalLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?doc=${toSlug(physician)}`
    : ''

  const copyLink = () => {
    navigator.clipboard.writeText(personalLink).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX = 1200
        let w = img.width
        let h = img.height
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX }
          else { w = Math.round(w * MAX / h); h = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.85)
      }
      img.onerror = () => resolve(file)
      img.src = url
    })
  }

  const processImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, HEIC, etc.)')
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setProcessing(true)
    setError('')

    try {
      // Compress before upload to stay under Vercel timeout
      const compressed = await compressImage(file)
      const formData = new FormData()
      formData.append('image', compressed, 'emr.jpg')

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Failed to extract patient data')
        return
      }

      onComplete(json.data as PatientData)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleFile = (file: File) => {
    processImage(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            Dr. {physician.first_name} {physician.last_name}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Upload EMR Screenshot</h2>
        <p className="text-sm text-gray-500 mt-1">
          Take a photo or upload a screenshot of the patient demographics screen from your EMR.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !processing && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
          ${processing ? 'cursor-not-allowed opacity-60' : ''}
        `}
      >
        {preview ? (
          <div className="space-y-3">
            <img
              src={preview}
              alt="EMR preview"
              className="max-h-48 mx-auto rounded-lg object-contain"
            />
            {processing && (
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Extracting patient data...
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Tap to take a photo or choose a file</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC — up to 20MB</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
          <button
            onClick={() => {
              setError('')
              setPreview(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            className="ml-2 underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="bg-red-50 border-2 border-red-400 rounded-lg px-4 py-3">
        <p className="text-sm font-bold text-red-700 mb-2">Photo Instructions:</p>
        <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
          <li>Keep phone <strong>12–15 inches</strong> away from the screen</li>
          <li>Hold phone <strong>straight and steady</strong> (not at an angle)</li>
          <li>Make sure <strong>all demographics are visible</strong> in the frame</li>
        </ol>
      </div>

      {/* Personal link */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <p className="text-xs font-medium text-gray-500 mb-1">Your personal referral link</p>
        <p className="text-xs text-gray-400 mb-2">Bookmark this — it will open the portal pre-loaded with your profile.</p>
        <div className="flex items-center gap-2">
          <code className="text-xs text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 flex-1 truncate">
            {personalLink}
          </code>
          <button
            onClick={copyLink}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
          >
            {linkCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
