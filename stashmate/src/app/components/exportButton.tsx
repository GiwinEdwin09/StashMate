'use client'

import { useState } from 'react'
import { exportCollectionsWithItems } from '@/app/actions/Export-Import/export'

export default function ExportButton() {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    
    try {
      const result = await exportCollectionsWithItems()
      
      if (!result.csv) {
        alert(result.error || 'Export failed')
        return
      }

      /* https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob */
      const blob = new Blob([result.csv], { type: 'text/csv' })
      /* https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static */
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `collections-items-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      alert(`Successfully exported ${result.count} records!`)
      
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export collections')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Exporting...' : 'Export to CSV'}
    </button>
  )
}