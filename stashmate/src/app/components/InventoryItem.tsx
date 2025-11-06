'use client'

import { useState, useEffect} from 'react';
import { createItem } from '../actions/items/createItem'
import { deleteItem } from '../actions/items/deleteItem'
import { updateItem } from '../actions/items/updateItem'
import { sortItems } from '../actions/items/sortItems'
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
  collection_id: number
};


export default function Inventory({collectionId}: {collectionId: number}) {
  const [errorMessage, setErrorMessage] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'profit' | 'source' | 'status' | 'created_at' | 'condition' | 'cost'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  // Fetch Items with sorting
  const fetchItems = async () => {
    setIsLoading(true);
    setErrorMessage(''); // Clear previous errors
    
    try {
      // First try direct database query which we know works
      console.log('Fetching items directly from database...');
      const { error: fetchItemErr, data } = await supabase.from('items').select('*').eq('collection_id', collectionId);
      
      if (fetchItemErr) {
        console.error("Direct fetch error:", fetchItemErr);
        setErrorMessage("Error loading items");
        setItems([]);
      } else {
        console.log('Direct fetch successful:', data.length, 'items');
        
        // Sort the data locally instead of using the server action
        const sortedData = [...data].sort((a, b) => {
          let aValue = a[sortBy];
          let bValue = b[sortBy];
          
          // Handle different data types
          if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
          }
          
          if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
        
        setItems(sortedData);
        console.log('Items sorted locally:', sortedData.length, 'items');
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setErrorMessage("Error loading items");
      setItems([]);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [collectionId]);

  // Re-fetch when sorting changes
  useEffect(() => {
    fetchItems();
  }, [sortBy, sortOrder]);

  // Handle sorting
  const handleSort = (field: typeof sortBy) => {
    if (field === sortBy) {
      // If clicking the same field, toggle order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking different field, set new field and default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
  };


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
        setEditingItem(null)
        await fetchItems()
      } else {
        setErrorMessage('Failed to update item')
      }
    } else {
      const result = await createItem(formData)
      if (result.success) {
        setSuccess(true)
        form.reset()
        await fetchItems()
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
    } else {
      setErrorMessage(result.error || 'Failed to delete item');
    }

    setIsLoading(false);
  }

  function handleEdit(item: Item) {
    setEditingItem(item);
    setErrorMessage('');
  }

  function handleCancelEdit() {
    setEditingItem(null);
    setErrorMessage('');
  }

  return (
    <div>
      <h2>Inventory</h2>

      {/* Sort Controls */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Sort by:</span>
        {[
          { key: 'name', label: 'Name' },
          { key: 'condition', label: 'Condition' },
          { key: 'cost', label: 'Cost' },
          { key: 'price', label: 'Price' },
          { key: 'profit', label: 'Profit' },
          { key: 'source', label: 'Source' },
          { key: 'created_at', label: 'Date' },
          { key: 'status', label: 'Status' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSort(key as typeof sortBy)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: sortBy === key ? '#007acc' : '#f8f8f8',
              color: sortBy === key ? 'white' : '#333',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {label}
            {sortBy === key && (
              <span style={{ fontSize: '10px' }}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading 
        ? "Loading..." 
        : (
        <section className="tableWrap" style={{ marginTop: 12 }}>
          <table id="itemsTable">
            <thead>
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('condition')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Condition {sortBy === 'condition' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('cost')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Cost {sortBy === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('price')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('profit')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Profit {sortBy === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('source')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Source {sortBy === 'source' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('created_at')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0
                ? (
                  <tr>
                    <td colSpan={10}>No items found</td>
                  </tr>
                )
                : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.condition}</td>
                      <td>${item.cost}</td>
                      <td>${item.price}</td>
                      <td>${item.profit}</td>
                      <td>{item.source}</td>
                      <td>{item.created_at}</td>
                      <td>{getStatusText(item.status)}</td>
                      <td>
                        <button 
                          onClick={() => handleEdit(item)}
                          disabled={isLoading}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          disabled={isLoading}
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
      <form onSubmit={handleSubmit}>
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
          name="profit"
          type="number"
          placeholder="Profit"
          defaultValue={editingItem?.profit || ''}
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
      </form>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  )
}