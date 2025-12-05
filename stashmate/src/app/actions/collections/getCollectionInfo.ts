'use server'
import { createClient } from '@/lib/server'

export async function getCollectionInfo(collectionId: number) {
  try {
    // Initialize Supabase client for server-side operations
    const supabase = await createClient()
    
    // Get the currently authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Verify user is authenticated before fetching collection info
    if (authError || !user) {
      return { error: 'You must be logged in', data: null }
    }

    // Fetch only name and category fields for the specified collection
    // This is a lightweight query for basic collection metadata
    const { data, error } = await supabase
      .from('collections')
      .select('name, category')
      .eq('id', collectionId)
      .single()

    // Handle any database errors during query
    if (error) {
      return { error: error.message, data: null }
    }

    return { error: null, data }
  } catch (error) {
    // Type-safe error handling for unexpected errors
    return { 
      /* reference: https://omakoleg.github.io/typescript-practices/pages/topics/errors.html */
      error: error instanceof Error ? error.message : 'Unknown error', 
      data: null 
    }
  }
}

