'use server'
import { supabase } from '@/lib/supabaseClient'

export async function createCollection(formData: FormData) {
  const name = formData.get('name') as string
  const category = formData.get('category') as string

  const { data, error } = await supabase
    .from('collections')
    .insert([{ name, category }])
    .select()

  if (error) throw new Error(error.message)
  return data
}
