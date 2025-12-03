'use server'
import { createClient } from '@/lib/server'

export async function getCollectionInfo(collectionId: number) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'You must be logged in', data: null }
    }

    const { data, error } = await supabase
      .from('collections')
      .select('name, category')
      .eq('id', collectionId)
      .single()

    if (error) {
      return { error: error.message, data: null }
    }

    return { error: null, data }
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : 'Unknown error', 
      data: null 
    }
  }
}

