'use client'

import { useState, useEffect } from 'react';
import { createItem } from '../actions/items/createItem'
import { deleteItem } from '../actions/items/deleteItem'
import { updateItem } from '../actions/items/updateItem'
import { searchItems, type SearchField, type PriceFilters } from '../actions/items/searchItems'
import { supabase } from "@/lib/supabaseClient";
import './style.css';

type Item = {
  id: number
  name: string;
  condition: string;
  cost: number;
  price: number;
  profit: number;
  source: string;
  status: number; // Changed from string to number
  created_at: string;
  collection_id: number;
  image_url?: string;
};


export default function Inventory({collectionId, onItemUpdate}: {collectionId: number, onItemUpdate?: () => void}) {
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [potentialProfit, setPotentialProfit] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilters, setPriceFilters] = useState<PriceFilters>({
    minCost: undefined,
    maxCost: undefined,
    minPrice: undefined,
    maxPrice: undefined,
  });
  const [maxCost, setMaxCost] = useState(1000);
  const [maxPrice, setMaxPrice] = useState(1000);

  // Status mapping function
  const getStatusText = (status: number): string => {
    switch (status) {
      case 0:
        return 'Listed';
      case 1:
        return 'In Stock';
      case 2:
        return 'Sold';
      default:
        return 'Unknown';
    }
  };

  // Fetch Items (with optional search and filters)
  const fetchItems = async (searchTerm: string = '') => {
    setIsLoading(true);
    
    // Check if filters are active
    const hasFilters = priceFilters.minCost !== undefined || 
                      priceFilters.maxCost !== undefined || 
                      priceFilters.minPrice !== undefined || 
                      priceFilters.maxPrice !== undefined;
    
    if (searchTerm.trim() || hasFilters) {
      // Use server-side search with filters (even if search is empty, filters may be applied)
      const result = await searchItems(collectionId, searchTerm, searchField, priceFilters);
      if (result.success && result.data) {
        setItems(result.data);
        setInventoryValue(result.data.reduce((sum, item) => sum + (item.cost || 0), 0));
        const unsoldItems = result.data.filter(item => item.status !== 2);
        const soldItems = result.data.filter(item => item.status === 2);
        setPotentialProfit(unsoldItems.reduce((sum, item) => sum + (item.profit || 0), 0));
        setTotalProfit(soldItems.reduce((sum, item) => sum + (item.profit || 0), 0));
        
        // Update max values for sliders based on search results
        if (result.data.length > 0) {
          const costs = result.data.map(item => item.cost || 0);
          const prices = result.data.map(item => item.price || 0);
          setMaxCost(Math.max(...costs, 1000));
          setMaxPrice(Math.max(...prices, 1000));
        }
      } else {
        setErrorMessage(result.error || "Error searching items");
        setItems([]);
      }
    } else {
      // Fetch all items when no search query and no filters
      const { error: fetchItemErr, data } = await supabase.from('items').select('*').eq('collection_id', collectionId);
      if (fetchItemErr) {
        console.error("Error fetching items");
        setErrorMessage("Error fetching items");
        setItems([]);
      } else {
        setItems(data || []);
        setInventoryValue((data || []).reduce((sum, item) => sum + (item.cost || 0), 0));
        const unsoldItems = (data || []).filter(item => item.status !== 2);
        const soldItems = (data || []).filter(item => item.status === 2);
        setPotentialProfit(unsoldItems.reduce((sum, item) => sum + (item.profit || 0), 0));
        setTotalProfit(soldItems.reduce((sum, item) => sum + (item.profit || 0), 0));
        
        // Calculate max values for sliders
        if (data && data.length > 0) {
          const costs = data.map(item => item.cost || 0);
          const prices = data.map(item => item.price || 0);
          setMaxCost(Math.max(...costs, 1000));
          setMaxPrice(Math.max(...prices, 1000));
        }
      }
    }
    setIsLoading(false);
  };

  // Fetch items when collection changes (reset search and filters)
  useEffect(() => {
    setSearchQuery('');
    setSearchField('name');
    setPriceFilters({
      minCost: undefined,
      maxCost: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    });
    fetchItems('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

  // Debounced search effect - runs when searchQuery, searchField, or filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchItems(searchQuery);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchField, priceFilters]);


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsLoading(true)
    setErrorMessage('')
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget

    if (editingItem) {
      const result = await updateItem(formData)
      if (result) {
        setSuccess(true)
        form.reset()
        setShowForm(false)
        setEditingItem(null)
        setImagePreview(null)
        await fetchItems()
        onItemUpdate?.(); // Notify parent to refresh revenue
      } else {
        setErrorMessage('Failed to update item')
      }
    } else {
      const result = await createItem(formData)
      if (result.success) {
        setSuccess(true)
        form.reset()
        setShowForm(false)
        setImagePreview(null)
        await fetchItems()
        onItemUpdate?.(); // Notify parent to refresh revenue
      } else {
        setErrorMessage(result.error || 'Failed to create item')
      }
    }

    setIsLoading(false)
  }

  async function handleDelete(itemId: number) {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setIsLoading(true);
    const result = await deleteItem(itemId);

    if (result.success) {
      await fetchItems();
      onItemUpdate?.(); // Notify parent to refresh revenue
    } else {
      setErrorMessage(result.error || 'Failed to delete item');
    }

    setIsLoading(false);
  }

  function handleEdit(item: Item) {
    setEditingItem(item);
    setShowForm(true);
    setErrorMessage('');
  }

  function handleCancelEdit() {
    setEditingItem(null);
    setImagePreview(null);
    setErrorMessage('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', width: '100%' }}>

        {/* Statistics */}
        <div className="flex gap-4 mb-4">
          <div className="w-64 h-20 p-3 rounded-lg shadow border card">
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Items in Catalog
            </label>
            <p className="text-base font-semibold">{items.length}</p>
          </div>

          <div className="w-64 h-20 p-3 rounded-lg shadow border card">
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Inventory Value (Cost)
            </label>
            <p className="text-base font-semibold">${inventoryValue.toFixed(2)}</p>
          </div>

          <div className="w-64 h-20 p-3 rounded-lg shadow border card">
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Potential Profit (Unsold)
            </label>
            <p className="text-base font-semibold">${potentialProfit.toFixed(2)}</p>
          </div>

          <div className="w-64 h-20 p-3 rounded-lg shadow border card">
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Total Profit
            </label>
            <p className="text-base font-semibold">${totalProfit.toFixed(2)}</p>
          </div>
        </div>

        {/* Buttons & Sort/Search */}
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition"
            >
              + Add Item
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded transition ${
                  showFilters 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Filters
              </button>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as SearchField)}
                className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                style={{ minWidth: '120px' }}
              >
                <option value="name">Name</option>
                <option value="condition">Condition</option>
                <option value="status">Status</option>
                <option value="source">Source</option>
              </select>
              <input
                type="text"
                placeholder={`Search by ${searchField}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                style={{ minWidth: '250px' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-gray-500 hover:text-gray-700 px-2"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter Modal Overlay */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFilters(false);
            }
          }}
        >
          <div className="bg-black border border-gray-700 rounded-lg shadow-lg w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Filter Items</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none transition"
                title="Close"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Cost Range - Minimum */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Minimum Cost: ${priceFilters.minCost?.toFixed(2) || '0.00'}
                </label>
                <input
                  type="range"
                  min="0"
                  max={maxCost}
                  step="1"
                  value={priceFilters.minCost || 0}
                  onChange={(e) => setPriceFilters({
                    ...priceFilters,
                    minCost: parseFloat(e.target.value) || undefined
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>$0</span>
                  <span>${maxCost.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Cost Range - Maximum */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Maximum Cost: ${priceFilters.maxCost?.toFixed(2) || maxCost.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={maxCost}
                  step="1"
                  value={priceFilters.maxCost || maxCost}
                  onChange={(e) => setPriceFilters({
                    ...priceFilters,
                    maxCost: parseFloat(e.target.value) || undefined
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>$0</span>
                  <span>${maxCost.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Price Range - Minimum */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Minimum Price: ${priceFilters.minPrice?.toFixed(2) || '0.00'}
                </label>
                <input
                  type="range"
                  min="0"
                  max={maxPrice}
                  step="1"
                  value={priceFilters.minPrice || 0}
                  onChange={(e) => setPriceFilters({
                    ...priceFilters,
                    minPrice: parseFloat(e.target.value) || undefined
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>$0</span>
                  <span>${maxPrice.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Price Range - Maximum */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">
                  Maximum Price: ${priceFilters.maxPrice?.toFixed(2) || maxPrice.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={maxPrice}
                  step="1"
                  value={priceFilters.maxPrice || maxPrice}
                  onChange={(e) => setPriceFilters({
                    ...priceFilters,
                    maxPrice: parseFloat(e.target.value) || undefined
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>$0</span>
                  <span>${maxPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between gap-3">
              <button
                onClick={() => {
                  setPriceFilters({
                    minCost: undefined,
                    maxCost: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                  });
                }}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-600 rounded hover:bg-gray-800 transition"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}

      {isLoading 
        ? "Loading..." 
        : (
        <section className="tableWrap" style={{ marginTop: 3 }}>
          <table id="itemsTable">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Condition</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Profit</th>
                <th>Source</th>
                <th>Date</th>
                <th>Status</th>
                <th>Payment Method</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0
                ? (
                  <tr>
                    <td colSpan={11}>
                      {searchQuery ? `No items found matching "${searchQuery}"` : 'No items found'}
                    </td>
                  </tr>
                )
                : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <img 
                          src={item.image_url || '/default-item.svg'}
                          alt={item.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      </td>
                      <td>{item.name}</td>
                      <td>{item.condition}</td>
                      <td>${item.cost}</td>
                      <td>${item.price}</td>
                      <td>${item.profit}</td>
                      <td>{item.source}</td>
                      <td>{item.created_at}</td>
                      <td>{getStatusText(item.status)}</td>
                      <td>
                        <select defaultValue="Cash">
                          <option>Cash</option>
                          <option>Credit Card</option>
                          <option>Paypal</option>
                          <option>Venmo</option>
                          <option>Cashapp</option>
                          <option>Zelle</option>
                        </select> {}
                      </td>
                      <td>
                        <button 
                          type="button"
                          onClick={() => handleEdit(item)}
                          disabled={isLoading}
                          className="px-3 py-2 rounded transition editbutton"
                        >
                          Edit
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={isLoading}
                          className="px-3 py-2 rounded transition deletebutton"
                          style={{ marginLeft: '8px' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )
              }
            </tbody>
          </table>
        </section>
      )}

      {/* Form */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
          // close on background click
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false); 
              handleCancelEdit();
            }
          }}
        >
          <div 
            className="border p-6 rounded-lg shadow-lg w-[600px] relative" 
            style={{
              backgroundColor: 'var(--panel)', 
              border: '1px solid var(--border)'
            }}
          >
            <form onSubmit={handleSubmit}>
              <h3 className="text-lg font-semibold mb-4">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
              <hr className="-mx-6 my-4 border-t" style={{ borderColor: 'var(--border)' }} />

              {editingItem && (
                <input
                  type="hidden"
                  name="id"
                  value={editingItem.id}
                />
              )}

              <input
                type="hidden"
                name="collection_id"
                value={collectionId}
              />

              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <img
                    src={imagePreview || '/default-item.svg'}
                    alt="Preview"
                    className="w-32 h-32 h-auto mb-4 rounded border border-gray-300"
                  />
                  
                  <label 
                    htmlFor="image_url_input"
                    className="inline-block mb-4"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    Upload Image
                  </label>
                  <input
                    name="image_url"
                    type="file"
                    accept="image/jpg, image/jpeg, image/png"
                    id="image_url_input"
                    style={{ display: 'none' }}
                    //defaultValue={editingItem?.name || ''}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setImagePreview(URL.createObjectURL(file));
                    }}
                  />
                </div>
                
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    name="name"
                    type="text"
                    placeholder="Name"
                    defaultValue={editingItem?.name || ''}
                    required
                    disabled={isLoading}
                    className="border p-2 w-full mb-2 rounded"
                  />

                  <input
                    name="condition"
                    placeholder="Condition"
                    defaultValue={editingItem?.condition || ''}
                    className="border p-2 w-full mb-2 rounded"
                  />

                  <input
                    name="cost"
                    type="number"
                    placeholder="Cost"
                    defaultValue={editingItem?.cost || ''}
                    className="border p-2 w-full mb-2 rounded"
                  />

                  <input
                    name="price"
                    type="number"
                    placeholder="Price"
                    defaultValue={editingItem?.price || ''}
                    className="border p-2 w-full mb-2 rounded"
                  />

                  <input
                    name="source"
                    placeholder="Source"
                    defaultValue={editingItem?.source || ''}
                    className="border p-2 w-full mb-2 rounded"
                  />

                  <input
                    name="created_at"
                    type="date"
                    defaultValue={editingItem?.created_at || ''}
                    className="border p-2 w-full mb-2 rounded"
                  />

                  <select
                    name="status"
                    defaultValue={editingItem?.status || "0"}
                    className="border p-2 w-full mb-3 rounded"
                  >
                    <option value={0}>Listed</option>
                    <option value={1}>In Stock</option>
                    <option value={2}>Sold</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded transition cancelbutton"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition"
                >
                  {isLoading ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*<form onSubmit={handleSubmit}>
        <h3>{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
        
        {editingItem && (
          <input
            type="hidden"
            name="id"
            value={editingItem.id}
          />
        )}
        
        <input
          type="hidden"
          name="collection_id"
          value={collectionId}
        />

        <label 
          htmlFor="image_url_input"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          Upload Image
        </label>
        <input
          name="image_url"
          type="file"
          accept="image/jpg, image/jpeg, image/png"
          id="image_url_input"
          style={{ display: 'none' }}
          defaultValue={editingItem?.name || ''}
        />
        
        <input
          name="name"
          type="text"
          placeholder="Name"
          defaultValue={editingItem?.name || ''}
          required
          disabled={isLoading}
        />
        
        <input
          name="condition"
          placeholder="Condition"
          defaultValue={editingItem?.condition || ''}
        />
        
        <input
          name="cost"
          type="number"
          placeholder="Cost"
          defaultValue={editingItem?.cost || ''}
        />
        
        <input
          name="price"
          type="number"
          placeholder="Price"
          defaultValue={editingItem?.price || ''}
        />
        
        <input
          name="source"
          placeholder="Source"
          defaultValue={editingItem?.source || ''}
        />
        
        <input
          name="created_at"
          type="date"
          defaultValue={editingItem?.created_at || ''}
        />
        
        <select
          name="status"
          defaultValue={editingItem?.status || "0"}
        >
          <option value={0}>Listed</option>
          <option value={1}>In Stock</option>
          <option value={2}>Sold</option>
        </select>
        
        <button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Saving....' : (editingItem ? 'Update Item' : 'Add Item')}
        </button>
        
        {editingItem && (
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={isLoading}
            style={{ marginLeft: '8px' }}
          >
            Cancel
          </button>
        )}
      </form>*/}

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  )
}