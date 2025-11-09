'use server'
import type { TablesUpdate } from '../../types/schema'
import { createClient } from '@/lib/server'

export async function updateItem(formData: FormData) {
    const id = Number(formData.get('id'))
    const name = formData.get('name') as string | null
    const condition = formData.get('condition') as string | null
    const cost = Number(formData.get('cost'))
    const price = Number(formData.get('price'))
    const profit = price-cost
    const source = formData.get('source') as string
    const status = Number(formData.get('status'))
    const created_at = formData.get('created_at') as string
    const collection_id = Number(formData.get('collection_id'))
    const image_url = formData.get('image_url') as string

    const supabase = await createClient()
    
    const response = await supabase.auth.getUser()
    const info = response.data
    const user = info.user

    if (!user) {
      throw new Error('You must be logged in')
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Item name is required')
    }
    
    const updateData: TablesUpdate<'items'> = {
      name: name.trim(),
      condition: condition?.trim() || null,
      cost: cost,
      price: price,
      profit: profit,
      source: source.trim(),
      status: status,
      created_at: created_at,
      collection_id: collection_id,
      image_url: image_url
    }

    const { data, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }
    
    return data
}