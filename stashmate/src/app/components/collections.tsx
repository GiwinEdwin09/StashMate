'use client'
import { useState, useEffect } from 'react'
import { createCollection } from '../actions/collections/createCollection'
import { supabase } from '@/lib/supabaseClient'
import { getCollections } from '../actions/collections/getCollection'
import { deleteCollection } from '../actions/collections/deleteCollection'

type Collection = {
  id: number
  name: string
  category: string
  cond: string
  qty: number
  cost: number
  value: number
  source: number
  acquired_date: string
  status: number
  profit: number
  owner_id: string
}

export default function AddCollectionForm({onSelectCollection}: {onSelectCollection: (id: number) => void}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchCollections = async () => {
    setIsLoading(true);
    const result = await getCollections();
    
    if (result.error) {
      console.error("Error fetching collection:", result.error);
      setError("Error fetching collection");
    } else if (result.data) {
      setCollections(result.data);
    }
    
    setIsLoading(false);
  }
  useEffect(() => {
    fetchCollections();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setIsLoading(true)
    setError('')
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget

    const result = await createCollection(formData)

    if (result.success) {
      setSuccess(true)
      form.reset()
      await fetchCollections()
    } else {
      setError(result.error || 'Failed to create collection')
    }

    setIsLoading(false)
  }
  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this collection?')) {
      return;
    }

    setDeletingId(id);
    setError('');

    const result = await deleteCollection(id);

    if (result.success) {
      await fetchCollections();
    } else {
      setError(result.error || 'Failed to delete collection');
    }

    setDeletingId(null);
  }
  

  return (
    <div className="max-w-md mx-auto p-6 bg-black rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Create New Collection</h2>
      {/*Collection Form*/}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Collection Name *
          </label>
          <input
            id="name"
            type="text"
            name="name"
            required
            disabled={isLoading}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g., Pokémon Base Set"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category *
          </label>
          <input
            id="category"
            type="text"
            name="category"
            required
            disabled={isLoading}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g., Cards, Figures, Comics..."
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm">
            Collection created successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Creating...' : 'Create Collection'}
        </button>
      </form>

      {/*Display Collections*/}
      <h3 className="text-lg font-semibold mb-2 mt-8">Collections</h3>

      {isLoading 
        ? "Loading..."
        : collections.length === 0 
          ? "No collections yet." 
          : (
          <ul className="space-y-2">
            {collections.map((col) => (
              <li
              key={col.id}
              className="flex justify-between items-center border border-gray-600 p-3 rounded-md hover:bg-gray-800 transition cursor-pointer"
              onClick={() => onSelectCollection(col.id)} 
              >
                <div className="flex-1 min-w-0"> 
                  <p className="font-medium text-white">{col.name}</p>
                  <p className="text-sm text-gray-400">{col.category}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0"> 
                  <span className="text-xs text-gray-400 whitespace-nowrap"> 
                    {new Date(col.acquired_date).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, col.id)}
                    disabled={deletingId === col.id}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {deletingId === col.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
      )}
    </div>
  )
}
