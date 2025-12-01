'use server'

import type { TablesUpdate } from '../../types/schema'
import { createClient } from '@/lib/server'

export async function renameCollection(formData: FormData) {
  try {
    const supabaseServer = createClient()
    
    const id = formData.get('id') as string
    const newName = formData.get('name') as string


    if (!id) {
      return { success: false, error: 'Collection ID is required' }
    }

    if (!newName || newName.trim().length === 0) {
      return { success: false, error: 'Collection name is required' }
    }

    // Get the current user
    const { data: { user }, error: userError } = await (await supabaseServer).auth.getUser()
    
    if (userError || !user) {
      console.log('Server: User auth error', userError);
      return { success: false, error: 'Authentication required' }
    }

    console.log('Server: Current user', user.id);

    // Check if new name already exists for different collection
    const { data: existingByName } = await (await supabaseServer)
      .from('collections')
      .select('id')
      .eq('name', newName.trim())
      .eq('owner_id', user.id) 
      .neq('id', id)
      .maybeSingle()

    if (existingByName) {
      return { success: false, error: 'A collection with this name already exists' }
    }

    // Update only the name attribute
    const updateData: TablesUpdate<'collections'> = {
      name: newName.trim()
    }

    const { data, error } = await (await supabaseServer)
      .from('collections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    console.log('Server: Update result', { data, error });

    if (error) {
      return {error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Rename collection error:', error)
    return { 
      error:  'Failed to rename collection' 
    }
  }
}