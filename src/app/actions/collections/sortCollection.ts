'use server'

import { supabase } from '@/lib/supabaseClient'
import type { Tables } from '@/app/types/schema'

type Collection = Tables<'collections'>
type SortableFields = 'name' | 'category' | 'cost' | 'value' | 'profit' | 'acquired_date' | 'status'
type SortOrder = 'asc' | 'desc'

export async function sortCollections(
  sortBy: SortableFields,
  sortOrder: SortOrder = 'asc',
  filters?: {
    search?: string
    category?: string
    status?: number
    owner_id?: string
  }
) {
  try {
   
    let query = supabase
      .from('collections')
      .select('*')

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,source.ilike.%${filters.search}%`)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.status !== undefined) {
      query = query.eq('status', filters.status)
    }

    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id)
    }

    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    const { data, error } = await query

    if (error) {
      console.error('Sort error:', error)
      throw new Error('Failed to sort collections')
    }

    return { 
      success: true, 
      data,
      sortedBy: sortBy,
      sortOrder 
    }

  } catch (error) {
    console.error('Sort collections error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}
