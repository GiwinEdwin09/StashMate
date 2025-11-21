'use client';

import { useState, useEffect } from 'react';
import { shareCollection, getSharedUsers, updateSharePermission, removeShare } from '../actions/shares/shareCollection';

export default function ShareModal({ 
  collectionId, 
  onClose 
}: { 
  collectionId: number; 
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit' | 'admin'>('view');
  const [sharedUsers, setSharedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSharedUsers();
  }, [collectionId]);

  async function loadSharedUsers() {
    const result = await getSharedUsers(collectionId);
    if (result.success) {
      setSharedUsers(result.data || []);
    }
  }

  async function handleShare() {
    setLoading(true);
    setMessage('');
    
    const result = await shareCollection(collectionId, email, permission);
    
    if (result.success) {
      setMessage('Collection shared successfully!');
      setEmail('');
      loadSharedUsers();
    } else {
      setMessage(`Error: ${result.error}`);
    }
    
    setLoading(false);
  }

  async function handleUpdatePermission(shareId: number, newPermission: 'view' | 'edit' | 'admin') {
    await updateSharePermission(shareId, newPermission);
    loadSharedUsers();
  }

  async function handleRemove(shareId: number) {
    if (confirm('Remove this user\'s access?')) {
      await removeShare(shareId);
      loadSharedUsers();
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="p-6 rounded-lg w-[500px] shadow-lg"
        style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--border)'
        }}
      >
        <h2 className="text-xl font-bold mb-4">Share Collection</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            User Email
          </label>
          <input
            type="email"
            placeholder="Enter user email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded w-full mb-3"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border)'
            }}
          />
          
          <label className="block text-sm font-medium mb-2">
            Permission Level
          </label>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as any)}
            className="border p-2 rounded w-full mb-3"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border)'
            }}
          >
            <option value="view">View Only</option>
            <option value="edit">Can Edit</option>
            <option value="admin">Admin</option>
          </select>

          <button
            onClick={handleShare}
            disabled={loading || !email}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Sharing...' : 'Share Collection'}
          </button>
          
          {message && (
            <p className={`mt-2 text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}
        </div>

        <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold mb-3">Shared with:</h3>
          {sharedUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">Not shared with anyone yet</p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {sharedUsers.map((share) => (
                <li 
                  key={share.id} 
                  className="flex items-center justify-between border p-3 rounded"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)'
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium">{share.users?.email || 'Unknown user'}</div>
                    <div className="text-xs text-gray-500">
                      Shared on {new Date(share.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select
                      value={share.permission_level}
                      onChange={(e) => handleUpdatePermission(share.id, e.target.value as any)}
                      className="border p-1 rounded text-sm"
                      style={{
                        backgroundColor: 'var(--bg)',
                        borderColor: 'var(--border)'
                      }}
                    >
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemove(share.id)}
                      className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full border p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          style={{ borderColor: 'var(--border)' }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
