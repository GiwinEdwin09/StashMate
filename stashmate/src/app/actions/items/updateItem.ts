'use server'

import { supabase } from '@/lib/supabaseClient'
import type { TablesUpdate } from '../../types/schema'
import { create } from 'domain'

export async function updateItem(formData: FormData) {
    const id = Number(formData.get('id'))
    const name = formData.get('name') as string | null
    const cond = formData.get('cond') as string | null
    const cost = Number(formData.get('cost'))
    const price = Number(formData.get('price'))
    const profit = Number(formData.get('profit'))
    const source = formData.get('source') as string
    const status = Number(formData.get('status'))
    const created_at = formData.get('created_at') as string
    const collection_id = Number(formData.get('collection_id'))

    if (!name || name.trim().length === 0) {
      throw new Error('Collection name is required')
    }

    if (!source || source.trim().length === 0) {
      throw new Error('Source is required')
    }

    if (isNaN(cost) || cost < 0) {
      throw new Error('Cost must be a valid positive number')
    }
    if (isNaN(price) || price < 0) {
      throw new Error('Price must be a valid positive number')
    }

    if (isNaN(collection_id) || collection_id <= 0) {
      throw new Error('Valid collection ID is required')
    }

    if (!created_at) {
      throw new Error('created date is required')
    }

    // const profit = value - cost
    
    const updateData: TablesUpdate<'items'> = {
      name: name?.trim() || null,
      condition: cond?.trim() || null,
      cost: cost,
      price: price,
      profit: profit,
      source: source.trim(),
      status: status,
      created_at: created_at,
      collection_id: collection_id
    }

    const { data, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data

}