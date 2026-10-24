'use client'

import { useState, useRef, useCallback } from 'react'
import { Physician, PatientData } from '@/lib/types'

type Props = {
  physician: Physician
  onComplete: (data: PatientData) => void
}

export default function OCRUpload({ physician, onComplete }: Props) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      const formData = new FormData()
      formData.append('image', file)

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

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <p className="text-xs text-amber-700">
          <strong>Tip:</strong> Make sure the entire patient demographics section is visible and in focus.
          Good lighting and a steady hand improve extraction accuracy.
        </p>
      </div>
    </div>
  )
}
