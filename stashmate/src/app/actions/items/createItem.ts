'use server'
import { createClient } from '@/lib/server'

export async function createItem(formData: FormData) {
  const name = formData.get('name') as string
  const condition = formData.get('condition') as string
  const cost = Number(formData.get('cost'))
  const price = Number(formData.get('price'))
  const profit = price - cost
  const source = formData.get('source') as string
  const status = formData.get('status') as string
  const created_at = formData.get('created_at') as string
  const collectionId = Number(formData.get('collection_id'))
  
  const supabase = await createClient()
  
  const response = await supabase.auth.getUser()
  const info = response.data
  const user = info.user
  
  if (!user) {
    return { success: false, error: 'You must be logged in' }
  }

  const insertData = {
    name: name,
    condition: condition,
    cost: cost,
    price: price,
    profit: profit,
    source: source,
    status: status,
    created_at: created_at || new Date().toISOString().split('T')[0],
    collection_id: collectionId
  }

  console.log('Attempting insert')

  const { data, error } = await supabase
    .from('items')
    .insert([insertData])
    .select()

  if (error) {
    console.error('Insert error:', error)
    return { success: false, error: error.message }
  }

  console.log('SUCCESS!')
  return { success: true, data}
}
