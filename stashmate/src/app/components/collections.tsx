'use client'
import { useState, useEffect } from 'react'
import { createCollection } from '../actions/collections/createCollection'
import { supabase } from '@/lib/supabaseClient'
import { getCollections } from '../actions/collections/getCollection'
import { deleteCollection } from '../actions/collections/deleteCollection'
import { createItem } from '../actions/items/createItem'
import { exportCollectionsWithItems } from '../actions/Export-Import/export'

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
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedExport, setSelectExprt] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)

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
      setShowOverlay(false)
      setTimeout(() => {
        setSuccess(false);
      }, 4000);
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
  const specificExprtClick = (e: React.MouseEvent, collectionId: number) => {
    e.stopPropagation();
    
    const idStr = collectionId.toString();
    setSelectExprt(curr => {
      const alreadySelected = curr.includes(idStr);
      if (alreadySelected) {
        return curr.filter(id => id !== idStr);
      } else {
        return [...curr, idStr];
      }
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError('');
    
    try {
      const ids = selectedExport.length > 0 ? selectedExport : undefined;
      const result = await exportCollectionsWithItems(ids);
      
      if (!result.csv) {
        setError(result.error || 'Export failed');
        return;
      }

      const blob = new Blob([result.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collections-items-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess(true);
      
      setSelectExprt([]);
      
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export collections');
    } finally {
      setIsExporting(false);
    }
  };
  
  
  const [newItem, setNewItem] = useState({
    name: '',
    condition: '',
    cost: 0,
    price: 0,
    profit: 0,
    source: '',
    collectionId: 0,
  });

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem((prevItem) => ({
      ...prevItem,
      [name]: value,
    }));
  };

const handleItemSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (newItem.name && newItem.condition && newItem.cost && newItem.price) {
    // Convert newItem to FormData
    const formData = new FormData();  // Correctly instantiate FormData
    formData.append('name', newItem.name);
    formData.append('condition', newItem.condition);
    formData.append('cost', newItem.cost.toString());  // Convert numbers to string for FormData
    formData.append('price', newItem.price.toString());
    formData.append('profit', newItem.profit.toString());
    formData.append('source', newItem.source);
    formData.append('collectionId', newItem.collectionId.toString());  // Assuming collectionId is passed

    // Call the createItem function with the FormData
    const result = await createItem(formData);

    if (result.success) {
      setSuccess(true);
      setNewItem({
        name: '',
        condition: '',
        cost: 0,
        price: 0,
        profit: 0,
        source: '',
        collectionId: 0,
      });
      await fetchCollections(); // Fetch collections again after successful addition
    } else {
      setError(result.error || 'Failed to add item');
    }
  }
};

  return (
    <>
      {/* Collections Sidebar */}
      <aside className="flex flex-col h-[calc(100vh-105px)]">
        {/* Collections Navbar */}
        <div className="relative w-full top-0 z-10">
          <div 
            className="absolute -left-4 -right-4 -top-4 -bottom-1 bg-gray-900 z-0"
            style={{backgroundColor: 'var(--bg)'}}
          >
          </div>
          <div className="flex items-center justify-between py-3 px-2 relative z-10">
            <h3 className="text-lg font-semibold">Collections</h3>
            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={isExporting || collections.length === 0}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              title={selectedExport.length > 0 ? `Export ${selectedExport.length} selected` : 'Export all collections'}
            >
              {isExporting ? 'Exporting...' : selectedExport.length > 0 ? `Export (${selectedExport.length})` : 'Export All'}
            </button>
            {/* Add Collection Button */}
            <button
              onClick={() => setShowOverlay(true)}
              className="flex items-center justify-center bg-emerald-600 text-white text-xl rounded-md hover:bg-emerald-700 transition-colors w-6 h-6"
            >
              <span style={{ transform: 'translateY(-1px)' }}>+</span>
            </button>
          </div>
        </div>

        {/* Display Collections */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 overflow-y-auto pr-2 -mr-2">
            <div className="pt-4 pb-2 px-1">
              {isLoading 
                ? <div className="text-gray-400">Loading...</div>
                : collections.length === 0 
                  ? <div className="text-gray-400">No collections yet.</div>
                  : (
                  <ul className="space-y-2">
                    {collections.map((col) => (
                      <li
                        key={col.id}
                        className="p-3 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer flex items-center gap-3"
                      >
                        {/* Checkbox */}
                        <button
                          onClick={(e) => specificExprtClick(e, col.id)}
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            selectedExport.includes(col.id.toString()) ? 'bg-blue-600 border-blue-600' : 'border-gray-500 hover:border-blue-400'
                          }`}
                        >
                          {selectedExport.includes(col.id.toString()) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div 
                          className="flex-1 min-w-0"
                          onClick={() => onSelectCollection(col.id)}
                        >
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
          </div>
        </div>
      </aside>
    
      {/* Add Collection Overlay */}
      {showOverlay && (
        <div 
          className="fixed inset-0 flex justify-center items-center bg-black/50 z-50"
          // close on background click
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOverlay(false);
            }
          }}
        >
          <div 
            className="border p-6 rounded-lg shadow-lg w-[600px]" 
            style={{
              backgroundColor: 'var(--panel)', 
              border: '1px solid var(--border)'
            }}
          >
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Collection'}
              </button>
            </form>
          </div>
        </div>
      )}
      {success && (
        <div className="fixed bottom-6 right-10 bg-green-600 text-white rounded-md text-sm px-5 py-3 shadow-lg w-fit flex items-center gap-3">
          <span>Collection created successfully!</span>
          <button
            onClick={() => setSuccess(false)}
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
