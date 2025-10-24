'use server'
import { supabase } from '@/lib/supabaseClient'

export async function getCollections() {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('id', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}
