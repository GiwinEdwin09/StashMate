'use server'
import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

export async function createCollection(formData: FormData) {
  const name = formData.get('name') as string
  const category = formData.get('category') as string

  const supabase = await createClient()
  
  const response = await supabase.auth.getUser()
  const info = response.data
  const user = info.user
  
  if (!user) {
    return { success: false, error: 'You must be logged in' }
  }

  // const { data: debugData, error: debugError } = await supabase.rpc('debug_session')
  // console.log('DEBUG SESSION DATA:', JSON.stringify(debugData, null, 2))
  // console.log('DEBUG ERROR:', debugError)

  if (!name?.trim() || !category?.trim()) {
    return { success: false, error: 'Name and category required' }
  }

  const insertData = {
    name: name,
    category: category,
    // cost: 0,
    // value: 0,
    // profit: 0,
    // qty: 0,
    // status: 0,
    acquired_date: new Date().toISOString().split('T')[0],
    owner_id: user.id,
  }

  console.log('Attempting insert')

  const { data, error } = await supabase
    .from('collections')
    .insert([insertData])
    .select()
    .single()

  if (error) {
    console.error('Insert error:', error)
    return { success: false, error: error.message }
  }

  console.log('SUCCESS!')
  revalidatePath('/collections')
  return { success: true, data }
}