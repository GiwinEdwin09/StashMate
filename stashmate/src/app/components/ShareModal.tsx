'use client'

import { useState, useEffect } from 'react'
import { 
  shareCollection, 
  getSharedUsers, 
  updateSharePermission, 
  removeShare 
} from '../actions/permissions/shareCollection'

type SharedUser = {
  id: number
  email: string
  permission_level: 'view' | 'edit'
  user_id: string
}

type ShareModalProps = {
  collectionId: number
  collectionName: string
  onClose: () => void
}

export default function ShareModal({ collectionId, collectionName, onClose }: ShareModalProps) {
  const [email, setEmail] = useState('')
  const [permissionLevel, setPermissionLevel] = useState<'view' | 'edit'>('view')
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSharedUsers()
  }, [collectionId])

  const fetchSharedUsers = async () => {
    const result = await getSharedUsers(collectionId)
    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setSharedUsers(result.data)
    }
  }

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    const result = await shareCollection(collectionId, email, permissionLevel)

    if (result.success) {
      setSuccess(`Successfully shared with ${email}`)
      setEmail('')
      setPermissionLevel('view')
      await fetchSharedUsers()
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(result.error || 'Failed to share collection')
    }

    setIsLoading(false)
  }

  const handleUpdatePermission = async (permissionId: number, newLevel: 'view' | 'edit') => {
    const result = await updateSharePermission(permissionId, newLevel)
    
    if (result.success) {
      await fetchSharedUsers()
      setSuccess('Permission updated')
      setTimeout(() => setSuccess(''), 2000)
    } else {
      setError(result.error || 'Failed to update permission')
    }
  }

  const handleRemove = async (permissionId: number) => {
    if (!confirm('Remove access for this user?')) return

    const result = await removeShare(permissionId)
    
    if (result.success) {
      await fetchSharedUsers()
      setSuccess('Access removed')
      setTimeout(() => setSuccess(''), 2000)
    } else {
      setError(result.error || 'Failed to remove access')
    }
  }

  return (
    <div
      className="fixed inset-0 flex justify-center items-center bg-black/60 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="card"
        style={{
          width: 'min(600px, 100% - 32px)',
          padding: '24px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="space" style={{ marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
              Share Collection
            </h2>
            <p className="muted" style={{ marginTop: '4px' }}>
              {collectionName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn"
            style={{
              borderRadius: '999px',
              paddingInline: '10px',
              fontSize: '0.8rem',
            }}
          >
            Close
          </button>
        </div>

        {/* Share form */}
        <form onSubmit={handleShare} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1"
                style={{ marginBottom: '4px' }}
              >
                User Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div style={{ width: '140px' }}>
              <label
                htmlFor="permission"
                className="block text-sm font-medium mb-1"
                style={{ marginBottom: '4px' }}
              >
                Permission
              </label>
              <select
                id="permission"
                value={permissionLevel}
                onChange={(e) => setPermissionLevel(e.target.value as 'view' | 'edit')}
                disabled={isLoading}
                className="w-full"
              >
                <option value="view">View Only</option>
                <option value="edit">Can Edit</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn primary"
              style={{
                borderRadius: '999px',
                paddingInline: '16px',
                height: '40px',
              }}
            >
              {isLoading ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>

        {/* Messages */}
        {error && (
          <div className="text-sm text-red-400 bg-red-900/30 border border-red-500/40 rounded px-3 py-2 mb-3">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-green-400 bg-green-900/30 border border-green-500/40 rounded px-3 py-2 mb-3">
            {success}
          </div>
        )}

        {/* Shared users list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ marginBottom: '12px' }}>
            Shared With ({sharedUsers.length})
          </h3>

          {sharedUsers.length === 0 ? (
            <p className="text-sm text-gray-400">
              This collection hasn't been shared yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {sharedUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[#111114] px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={user.permission_level}
                      onChange={(e) =>
                        handleUpdatePermission(user.id, e.target.value as 'view' | 'edit')
                      }
                      className="text-xs"
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                    </select>

                    <button
                      onClick={() => handleRemove(user.id)}
                      className="btn"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        color: '#ef4444',
                        borderColor: '#7f1d1d',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
