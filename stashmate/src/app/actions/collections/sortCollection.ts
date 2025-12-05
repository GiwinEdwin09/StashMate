'use server'

import { supabase } from '@/lib/supabaseClient'
import type { Tables } from '@/app/types/schema'

// Define allowed sort fields and order directions for type safety
type SortableFields = 'name' | 'category' | 'acquired_date' 
type SortOrder = 'asc' | 'desc'

export async function sortCollections(
  sortBy: SortableFields,
  sortOrder: SortOrder = 'asc',
  filters?: {
    search?: string
    category?: string
    // status?: number
    owner_id?: string
  }
) {
  try {
    // Start with base query selecting all collections
    let query = supabase
      .from('collections')
      .select('*')

    // Apply search filter if provided (case-insensitive search in name or source)
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,source.ilike.%${filters.search}%`)
    }

    // Apply category filter if provided (exact match)
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    // if (filters?.status !== undefined) {
    //   query = query.eq('status', filters.status)
    // }

    // Apply owner filter if provided (for user-specific collections)
    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id)
    }

    // Convert sort order to boolean for Supabase (true = ascending, false = descending)
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    const { data, error } = await query

    // Handle any database errors during sorting
    if (error) {
      console.error('Sort error:', error)
      throw new Error('Failed to sort collections')
    }

    // Return sorted data along with metadata about the sort operation
    return { 
      success: true, 
      data,
      sortedBy: sortBy,
      sortOrder 
    }

  } catch (error) {
    // Catch any unexpected errors and return user-friendly message
    console.error('Sort collections error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}
