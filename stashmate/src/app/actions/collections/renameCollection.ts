'use server'

import type { TablesUpdate } from '../../types/schema'
import { createClient } from '@/lib/server'

export async function renameCollection(formData: FormData) {
  try {
    const supabaseServer = createClient()
    
    // Extract collection ID and new name from form data
    const id = formData.get('id') as string
    const newName = formData.get('name') as string

    // Validate that collection ID is provided
    if (!id) {
      return { success: false, error: 'Collection ID is required' }
    }

    // Validate that new name is provided and not empty
    if (!newName || newName.length === 0) {
      return { success: false, error: 'Collection name is required' }
    }

    // Get the current user for authentication and ownership verification
    const { data: { user }, error: userError } = await (await supabaseServer).auth.getUser()
    
    // Verify user is authenticated before allowing rename
    if (userError || !user) {
      console.log('Server: User auth error', userError);
      return { success: false, error: 'Authentication required' }
    }

    // console.log('Current user:', user.id);

    // Check if new name already exists for a different collection owned by this user
    const { data: existingByName } = await (await supabaseServer)
      .from('collections')
      .select('id')
      .eq('name', newName.trim())
      .eq('owner_id', user.id) 
      .neq('id', id) 
      .single()

    // Return error if duplicate name found
    if (existingByName) {
      return { success: false, error: 'A collection with this name already exists' }
    }

    // Prepare update data with type safety using schema types
    // Only update the name field, leaving other attributes unchanged
    const updateData: TablesUpdate<'collections'> = {
      name: newName.trim()
    }

    // Execute the update operation and return the updated record
    const { data, error } = await (await supabaseServer)
      .from('collections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    // console.log('Update result:', { data, error });

    // Handle any database errors during update
    if (error) {
      return {error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    // Catch any unexpected errors and return user-friendly message
    console.error('Rename collection error:', error)
    return { 
      error: 'Failed to rename collection' 
    }
  }
}