'use server'
import { supabase } from '@/lib/supabaseClient'

export async function createItem(formData: FormData) {
  const name = formData.get('name') as string
  const condition = formData.get('condition') as string
  const cost = Number(formData.get('cost'))
  const price = Number(formData.get('price'))
  const collectionId = Number(formData.get('collection_id'))

  const profit = price - cost

  const { data, error } = await supabase
    .from('items')
    .insert([{ name, condition, cost, price, profit, collection_id: collectionId }])
    .select()

  if (error) throw new Error(error.message)
  return data
}