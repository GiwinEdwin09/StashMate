'use server'

import { supabase } from '@/lib/supabaseClient'
import type { TablesUpdate } from '@/types/schema'

export async function updateCollection(formData: FormData) {
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const cond = formData.get('cond') as string | null
    const cost = Number(formData.get('cost'))
    const value = Number(formData.get('value'))
    const qty = formData.get('qty') ? Number(formData.get('qty')) : null
    const source = formData.get('source') as string | null
    const status = Number(formData.get('status'))
    const acquired_date = formData.get('acquired_date') as string

    if (!name || name.trim().length === 0) {
      throw new Error('Collection name is required')
    }

    if (!category || category.trim().length === 0) {
      throw new Error('Category is required')
    }

    if (isNaN(cost) || cost < 0) {
      throw new Error('Cost must be a valid positive number')
    }

    if (isNaN(value) || value < 0) {
      throw new Error('Value must be a valid positive number')
    }

    if (!acquired_date) {
      throw new Error('Acquired date is required')
    }

    const profit = value - cost
    
    const updateData: TablesUpdate<'collections'> = {
      name: name.trim(),
      category: category.trim(),
      cond: cond?.trim() || null,
      cost: cost,
      value: value,
      profit: profit,
      qty: qty,
      source: source?.trim() || null,
      status: status,
      acquired_date: acquired_date
    }

    const { data, error } = await supabase
      .from('collections')
      .update(updateData)
      .eq('name', name)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data

}
