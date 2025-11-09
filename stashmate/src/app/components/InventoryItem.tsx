'use client'

import { useState, useEffect} from 'react';
import { createItem } from '../actions/items/createItem'
import { deleteItem } from '../actions/items/deleteItem'
import { updateItem } from '../actions/items/updateItem'
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


export default function Inventory({collectionId}: {collectionId: number}) {
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [potentialProfit, setPotentialProfit] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

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

  // Fetch Items
  const fetchItems = async () => {
    setIsLoading(true);
    const { error: fetchItemErr, data } = await supabase.from('items').select('*').eq('collection_id', collectionId);
    if (fetchItemErr) {
      console.error("Error fetching items");
      setErrorMessage("Error fetching items");
      return;
    }
    else {
      setItems(data);
      setInventoryValue(data.reduce((sum, item) => sum + (item.cost || 0), 0));
      const unsoldItems = data.filter(item => item.status !== 2);
      const soldItems = data.filter(item => item.status === 2);
      setPotentialProfit(unsoldItems.reduce((sum, item) => sum + (item.profit || 0), 0));
      setTotalProfit(soldItems.reduce((sum, item) => sum + (item.profit || 0), 0));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [collectionId]);


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

      {/* Statistics */}
      <div className="flex gap-4">
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

      {/* Table */}
      {isLoading 
        ? "Loading..." 
        : (
        <section className="tableWrap" style={{ marginTop: 12 }}>
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
                    <td colSpan={11}>No items found</td>
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
      </form>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  )
}