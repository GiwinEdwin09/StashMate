'use server'
import { supabase } from '@/lib/supabaseClient'

export async function getItemsByCollection(collectionId: number) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}