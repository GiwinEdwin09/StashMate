'use server'

import { createClient } from '@/lib/server'

type SortableFields = 'name' | 'price' | 'cost' | 'profit' | 'source' | 'status' | 'created_at' | 'condition'
type SortOrder = 'asc' | 'desc'

export async function sortItems(
  collectionId: number,
  sortBy: SortableFields,
  sortOrder: SortOrder = 'asc',
  filters?: {
    search?: string
    condition?: string
    status?: number
  }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { 
        success: false, 
        error: 'You must be logged in',
        data: []
      }
    }
   
    let query = supabase
      .from('items')
      .select('*')
      .eq('collection_id', collectionId) // Only items from same collection

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,source.ilike.%${filters.search}%`)
    }

    if (filters?.condition) {
      query = query.eq('condition', filters.condition)
    }

    if (filters?.status !== undefined) {
      query = query.eq('status', filters.status)
    }

    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    const { data, error } = await query

    if (error) {
      console.error('Sort error:', error)
      throw new Error('Failed to sort items')
    }

    return { 
      success: true, 
      data: data || [],
      sortedBy: sortBy,
      sortOrder 
    }

  } catch (error) {
    console.error('Sort items error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}
