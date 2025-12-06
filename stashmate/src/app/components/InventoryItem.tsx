'use client'

import { useState, useEffect, useCallback } from 'react';
import { createItem } from '../actions/items/createItem'
import { deleteItem } from '../actions/items/deleteItem'
import { updateItem } from '../actions/items/updateItem'
import { searchItems, type SearchField, type PriceFilters } from '../actions/items/searchItems'
import { getItemsByCollection } from '../actions/items/getItemByCollection'
import { getCollectionInfo } from '../actions/collections/getCollectionInfo'
import './style.css';

type Item = {
  id: number
  name: string;
  condition: string;
  cost: number;
  price: number;
  profit: number;
  source: string;
  status: number;
  created_at: string;
  quantity: number;
  collection_id: number;
  image_url?: string;
};


export default function Inventory({collectionId, onItemUpdate, permission = 'owner', ownerName}: {collectionId: number, onItemUpdate?: () => void, permission?: string, ownerName?: string}) {
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  // Permission check - view-only users cannot edit
  const isReadOnly = permission === 'view';
  const canEdit = permission === 'edit' || permission === 'owner';

  const [collectionName, setCollectionName] = useState("");
  const [collectionCategory, setCollectionCategory] = useState("");
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
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'cost'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  const fetchItems = useCallback(async (searchTerm: string = '') => {
    setIsLoading(true);
    
    const hasFilters = priceFilters.minCost !== undefined || 
                      priceFilters.maxCost !== undefined || 
                      priceFilters.minPrice !== undefined || 
                      priceFilters.maxPrice !== undefined;
    
    if (searchTerm.trim() || hasFilters) {
      const result = await searchItems(collectionId, searchTerm, searchField, priceFilters, sortBy, sortOrder);
      if (result.success && result.data) {
        setItems(result.data);
        setInventoryValue(result.data.reduce((sum, item) => sum + ((item.cost || 0) * (item.quantity || 1)), 0));
        const unsoldItems = result.data.filter(item => item.status !== 2);
        const soldItems = result.data.filter(item => item.status === 2);
        setPotentialProfit(unsoldItems.reduce((sum, item) => sum + (item.profit || 0), 0));
        setTotalProfit(soldItems.reduce((sum, item) => sum + (item.profit || 0), 0));
        
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
      const result = await getItemsByCollection(collectionId, sortBy, sortOrder);
      if (result.error) {
        console.error("Error fetching items:", result.error);
        setErrorMessage("Error fetching items");
        setItems([]);
      } else if (result.data) {
        setItems(result.data);
        setInventoryValue(result.data.reduce((sum, item) => sum + ((item.cost || 0) * (item.quantity || 1)), 0));
        const unsoldItems = result.data.filter(item => item.status !== 2);
        const soldItems = result.data.filter(item => item.status === 2);
        setPotentialProfit(unsoldItems.reduce((sum, item) => sum + (item.profit || 0), 0));
        setTotalProfit(soldItems.reduce((sum, item) => sum + (item.profit || 0), 0));
        
        if (result.data.length > 0) {
          const costs = result.data.map(item => item.cost || 0);
          const prices = result.data.map(item => item.price || 0);
          setMaxCost(Math.max(...costs, 1000));
          setMaxPrice(Math.max(...prices, 1000));
        }
      }
    }
    setIsLoading(false);
  }, [collectionId, searchField, priceFilters, sortBy, sortOrder]);

  useEffect(() => {
    async function fetchCollectionInfo() {
      const result = await getCollectionInfo(collectionId);
      if (!result.error && result.data) {
        setCollectionName(result.data.name);
        setCollectionCategory(result.data.category);
      }
    }

    fetchCollectionInfo();
  }, [collectionId]);

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
  }, [collectionId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchItems(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchField, priceFilters, sortBy, sortOrder, fetchItems]);


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
        onItemUpdate?.();
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
        onItemUpdate?.();
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
      onItemUpdate?.();
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

        {/* Collections Info */}
        <div className="flex-1 mb-4">
          <p className="font-semibold text-xl">{collectionName}</p>
          <p className="text-md text-gray-400">{collectionCategory}</p>
        </div>

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

          {ownerName && permission !== 'owner' && (
            <div className="w-64 h-20 p-3 rounded-lg shadow border card">
              <div className="flex flex-col">
                <span className="text-xs" style={{ opacity: 0.6 }}>Shared by</span>
                <span className="text-sm font-medium">{ownerName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Buttons & Sort/Search */}
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowForm(true)}
              disabled={isReadOnly}
              className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title={isReadOnly ? 'You have view-only access' : 'Add new item'}
            >
              + Add Item
            </button>
            <div className="flex items-center gap-2">
              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'cost')}
                  className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--panel)',
                    color: 'var(--text)',
                    minWidth: '120px',
                    cursor: 'pointer'
                  }}
                  disabled={isLoading}
                >
                  <option value="name">Sort by Name</option>
                  <option value="price">Sort by Price</option>
                  <option value="cost">Sort by Cost</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--panel)',
                    color: 'var(--text)',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  disabled={isLoading}
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--panel)',
                  color: 'var(--text)',          
                  padding: '8px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
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
      
      {/* Filter Modal */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFilters(false);
            }
          }}
        >
          <div
            className="rounded-lg shadow-xl p-6 w-full max-w-md"
            style={{
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--border)',
              color: 'var(--text)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Filter Items</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-2xl leading-none"
                style={{ 
                  color: 'var(--text)',
                  opacity: 0.7
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Cost Range */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text)' }}>Cost Range</h3>
                  <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.7 }}>
                    ${Math.round(priceFilters.minCost ?? 0)} - ${Math.round(priceFilters.maxCost ?? maxCost)}
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="minCost" className="block text-xs mb-2" style={{ color: 'var(--text)', opacity: 0.8 }}>
                      Min Cost: ${Math.round(priceFilters.minCost ?? 0)}
                    </label>
                    <input
                      id="minCost"
                      type="range"
                      min="0"
                      max={Math.round(priceFilters.maxCost ?? maxCost)}
                      step="1"
                      value={Math.round(priceFilters.minCost ?? 0)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        const currentMax = Math.round(priceFilters.maxCost ?? maxCost);
                        const clampedValue = Math.min(value, currentMax);
                        setPriceFilters(prev => ({
                          ...prev,
                          minCost: clampedValue > 0 ? clampedValue : undefined
                        }));
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((priceFilters.minCost ?? 0) / (priceFilters.maxCost ?? maxCost)) * 100}%, #e5e7eb ${((priceFilters.minCost ?? 0) / (priceFilters.maxCost ?? maxCost)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="maxCost" className="block text-xs mb-2" style={{ color: 'var(--text)', opacity: 0.8 }}>
                      Max Cost: ${Math.round(priceFilters.maxCost ?? maxCost)}
                    </label>
                    <input
                      id="maxCost"
                      type="range"
                      min={Math.round(priceFilters.minCost ?? 0)}
                      max={Math.round(maxCost)}
                      step="1"
                      value={Math.round(priceFilters.maxCost ?? maxCost)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        const currentMin = Math.round(priceFilters.minCost ?? 0);
                        const clampedValue = Math.max(value, currentMin);
                        setPriceFilters(prev => ({
                          ...prev,
                          maxCost: clampedValue < maxCost ? clampedValue : undefined
                        }));
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      style={{
                        background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((priceFilters.maxCost ?? maxCost) / maxCost) * 100}%, #3b82f6 ${((priceFilters.maxCost ?? maxCost) / maxCost) * 100}%, #3b82f6 100%)`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text)' }}>Price Range</h3>
                  <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.7 }}>
                    ${Math.round(priceFilters.minPrice ?? 0)} - ${Math.round(priceFilters.maxPrice ?? maxPrice)}
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="minPrice" className="block text-xs mb-2" style={{ color: 'var(--text)', opacity: 0.8 }}>
                      Min Price: ${Math.round(priceFilters.minPrice ?? 0)}
                    </label>
                    <input
                      id="minPrice"
                      type="range"
                      min="0"
                      max={Math.round(priceFilters.maxPrice ?? maxPrice)}
                      step="1"
                      value={Math.round(priceFilters.minPrice ?? 0)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        const currentMax = Math.round(priceFilters.maxPrice ?? maxPrice);
                        const clampedValue = Math.min(value, currentMax);
                        setPriceFilters(prev => ({
                          ...prev,
                          minPrice: clampedValue > 0 ? clampedValue : undefined
                        }));
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((priceFilters.minPrice ?? 0) / (priceFilters.maxPrice ?? maxPrice)) * 100}%, #e5e7eb ${((priceFilters.minPrice ?? 0) / (priceFilters.maxPrice ?? maxPrice)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="maxPrice" className="block text-xs mb-2" style={{ color: 'var(--text)', opacity: 0.8 }}>
                      Max Price: ${Math.round(priceFilters.maxPrice ?? maxPrice)}
                    </label>
                    <input
                      id="maxPrice"
                      type="range"
                      min={Math.round(priceFilters.minPrice ?? 0)}
                      max={Math.round(maxPrice)}
                      step="1"
                      value={Math.round(priceFilters.maxPrice ?? maxPrice)}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        const currentMin = Math.round(priceFilters.minPrice ?? 0);
                        const clampedValue = Math.max(value, currentMin);
                        setPriceFilters(prev => ({
                          ...prev,
                          maxPrice: clampedValue < maxPrice ? clampedValue : undefined
                        }));
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      style={{
                        background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((priceFilters.maxPrice ?? maxPrice) / maxPrice) * 100}%, #3b82f6 ${((priceFilters.maxPrice ?? maxPrice) / maxPrice) * 100}%, #3b82f6 100%)`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setPriceFilters({
                    minCost: undefined,
                    maxCost: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                  });
                }}
                className="flex-1 px-4 py-2 rounded-md transition"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--panel)',
                  color: 'var(--text)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-start)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--panel)';
                }}
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 px-4 py-2 rounded-md transition"
                style={{
                  background: 'var(--brand)',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
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
            <tr><th></th><th>Name</th><th>Condition</th><th>Cost</th><th>Price</th><th>Qty</th><th>Profit</th><th>Source</th><th>Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.length === 0
              ? (
                <tr><td colSpan={11}>
                  {searchQuery ? `No items found matching "${searchQuery}"` : 'No items found'}
                </td></tr>
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
                    <td>{item.quantity || 1}</td>
                    <td>${item.profit}</td>
                    <td>{item.source}</td>
                    <td>{item.created_at}</td>
                    <td>{getStatusText(item.status)}</td>
                    <td>
                      <button 
                        type="button"
                        onClick={() => handleEdit(item)}
                        disabled={isLoading || isReadOnly}
                        className="px-3 py-2 rounded transition text-white editbutton disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isReadOnly ? 'View-only access' : 'Edit item'}
                      >
                        Edit
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={isLoading || isReadOnly}
                        className="px-3 py-2 rounded transition text-white deletebutton disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ marginLeft: '8px' }}
                        title={isReadOnly ? 'View-only access' : 'Delete item'}
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
                    name="quantity"
                    type="number"
                    placeholder="Quantity"
                    min="1"
                    defaultValue={editingItem?.quantity || 1}
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

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  )
}