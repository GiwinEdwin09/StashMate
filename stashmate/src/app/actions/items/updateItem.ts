'use server'

import { supabase } from '@/lib/supabaseClient'
import type { TablesUpdate } from '@/types/schema'

export async function updateItem(formData: FormData) {

    const name = formData.get('name') as string | null
    const collection_id = Number(formData.get('collection_id'))
    const condition = formData.get('condition') as string | null
    const cost = Number(formData.get('cost'))
    const price = Number(formData.get('price'))
    const source = formData.get('source') as string
    const status = Number(formData.get('status'))

    if (isNaN(collection_id) || collection_id <= 0) {
      throw new Error('Valid collection ID is required')
    }

    if (isNaN(cost) || cost < 0) {
      throw new Error('Cost must be a valid positive number')
    }

    if (isNaN(price) || price < 0) {
      throw new Error('Price must be a valid positive number')
    }

    if (!source || source.trim().length === 0) {
      throw new Error('Source is required')
    }

    if (isNaN(status)) {
      throw new Error('Valid status is required')
    }

    const profit = price - cost

    const updateData: TablesUpdate<'items'> = {
      name: name?.trim() || null,
      collection_id: collection_id,
      condition: condition?.trim() || null,
      cost: cost,
      price: price,
      profit: profit,
      source: source.trim(),
      status: status
    }

    const { data, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('name', name)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
}