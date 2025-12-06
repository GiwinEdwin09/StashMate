'use client'

import React, { useState } from 'react'
import { importCollectionsWithItems } from '../actions/Export-Import/import'

interface ImportButtonProps {
  onImportComplete: () => void | Promise<void>
}

export default function ImportButton({onImportComplete}: ImportButtonProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    
    if (!file) {
      return
    }

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      setTimeout(() => setError(null), 4000)
      return
    }

    setIsImporting(true)
    setError(null)
    setMessage(null)

    try {
      const fileContent = await file.text()
      const result = await importCollectionsWithItems(fileContent)

      if (result.error) {
        setError(result.error)
        setTimeout(() => setError(null), 4000)
      } else if (result.success) {
        await onImportComplete()
        setMessage(result.message)
        setTimeout(() => setMessage(null), 4000)
      }
    } catch (err) {
      setError('An unexpected error occurred during import')
      setTimeout(() => setError(null), 4000)
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  return (
    <>
      <label 
        htmlFor="csv-upload" 
        className={`
          inline-flex items-center px-3 py-1.5 text-xs rounded-md font-medium cursor-pointer transition-colors mr-3
          ${isImporting 
            ? 'bg-gray-700 cursor-not-allowed' 
            : 'bg-purple-700 hover:bg-purple-800 text-white'
          }
        `}
      >
        {isImporting ? 'Importing...' : 'Import CSV'}
      </label>
      
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        disabled={isImporting}
        className="hidden"
      />

      {message && (
        <div className="fixed bottom-6 right-10 bg-green-600 text-white rounded-md text-sm px-5 py-3 shadow-lg w-fit flex items-center gap-3 z-50">
          <span>{message}</span>
          <button
            onClick={() => setMessage(null)}
            className="flex items-center justify-center text-gray-200 hover:text-gray-300 leading-none w-2 h-2 translate-y-[-2px]"
            style={{ fontSize: '25px', lineHeight: 1, padding: 0, margin: 0 }}
          >
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="fixed bottom-6 right-10 bg-red-600 text-white rounded-md text-sm px-5 py-3 shadow-lg w-fit flex items-center gap-3 z-50">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="flex items-center justify-center text-gray-200 hover:text-gray-300 leading-none w-2 h-2 translate-y-[-2px]"
            style={{ fontSize: '25px', lineHeight: 1, padding: 0, margin: 0 }}
          >
            &times;
          </button>
        </div>
      )}
    </>
  )
}