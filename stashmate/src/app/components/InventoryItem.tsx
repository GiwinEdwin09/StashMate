'use client'

import { useState, useEffect} from 'react';
import { createItem } from '../actions/items/createItem'
import { deleteItem } from '../actions/items/deleteItem'
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
  status: string;
  created_at: string;
  collection_id: number
};


export default function Inventory({collectionId}: {collectionId: number}) {
  const [errorMessage, setErrorMessage] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

    const result = await createItem(formData)

    if (result.success) {
      setSuccess(true)
      form.reset()
      await fetchItems()
    } else {
      setErrorMessage(result.error || 'Failed to create item')
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

  return (
    <div>
      <h2>Inventory</h2>

      {/* Table */}
      {isLoading 
        ? "Loading..." 
        : (
        <section className="tableWrap" style={{ marginTop: 12 }}>
          <table id="itemsTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Condition</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Profit</th>
                <th>Source</th>
                <th>Date</th>
                <th>Status</th>
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
                      <td>{item.status}</td>
                      <td>
                        {/* <button onClick={() => onEdit(item)}>Edit</button> */}
                        <button onClick={() => handleDelete(item.id)}>Delete</button>
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
        <input
          type="hidden"
          name="collection_id"
          value={collectionId}
        />
        <input
          name="name"
          type="text"
          placeholder="Name"
          required
          disabled={isLoading}
        />
        <input
          name="condition"
          placeholder="Condition"
        />
        <input
          name="cost"
          type="number"
          placeholder="Cost"
        />
        <input
          name="price"
          type="number"
          placeholder="Price"
        />
        <input
          name="source"
          placeholder="Source"
        />
        <input
          name="created_at"
          type="date"
        />
        <select
          name="status"
          defaultValue="0"
        >
          <option value={0}>Listed</option>
          <option value={1}>In Stock</option>
          <option value={2}>Sold</option>
        </select>
        <button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Adding...' : 'Add Item'}
        </button>
        {/*</div>{editingItem && (
          <button
            type="button"
            onClick={() => setEditingItem(null)}
          >
            Cancel
          </button>
        )}*/}
      </form>

    </div>
  )
}
