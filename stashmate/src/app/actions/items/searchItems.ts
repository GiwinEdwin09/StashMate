'use server'
import { createClient } from '@/lib/server'

export type SearchField = 'name' | 'condition' | 'status' | 'source'

export type PriceFilters = {
  minCost?: number
  maxCost?: number
  minPrice?: number
  maxPrice?: number
}

export async function searchItems(
  collectionId: number, 
  searchQuery: string, 
  searchField?: SearchField,
  filters?: PriceFilters
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
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: false })

    // If search query is provided, filter results
    if (searchQuery && searchQuery.trim()) {
      const trimmedQuery = searchQuery.trim()
      
      if (searchField) {
        // Search by specific field
        if (searchField === 'status') {
          // For status, map text to status numbers
          const statusMap: { [key: string]: number } = {
            'listed': 0,
            'in stock': 1,
            'sold': 2
          }
          const statusText = trimmedQuery.toLowerCase()
          if (statusMap[statusText] !== undefined) {
            query = query.eq('status', statusMap[statusText])
          } else {
            // Try to parse as number
            const statusNum = parseInt(trimmedQuery)
            if (!isNaN(statusNum) && statusNum >= 0 && statusNum <= 2) {
              query = query.eq('status', statusNum)
            } else {
              // No match, return empty results
              return { success: true, data: [], error: null }
            }
          }
        } else {
          // For name, condition, and source, use ilike for case-insensitive search
          const searchTerm = `%${trimmedQuery}%`
          query = query.ilike(searchField, searchTerm)
        }
      } else {
        // Default: search across all fields (original behavior)
        const searchTerm = `%${trimmedQuery}%`
        let orConditions = `name.ilike.${searchTerm},condition.ilike.${searchTerm},source.ilike.${searchTerm}`
        
        // Also try to match numeric fields if the search term is numeric
        const numericValue = parseFloat(trimmedQuery)
        if (!isNaN(numericValue)) {
          orConditions += `,cost.eq.${numericValue},price.eq.${numericValue},profit.eq.${numericValue}`
        }
        
        query = query.or(orConditions)
      }
    }

    // Apply price range filters (applied regardless of search query)
    if (filters) {
      if (filters.minCost !== undefined && filters.minCost !== null) {
        query = query.gte('cost', filters.minCost)
      }
      if (filters.maxCost !== undefined && filters.maxCost !== null) {
        query = query.lte('cost', filters.maxCost)
      }
      if (filters.minPrice !== undefined && filters.minPrice !== null) {
        query = query.gte('price', filters.minPrice)
      }
      if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
        query = query.lte('price', filters.maxPrice)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Search error:', error)
      return { 
        success: false, 
        error: error.message, 
        data: [] 
      }
    }

    return { 
      success: true, 
      data: data || [],
      error: null
    }

  } catch (error) {
    console.error('Search items error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}

