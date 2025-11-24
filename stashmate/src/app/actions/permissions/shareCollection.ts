'use server'
import { createClient } from '@/lib/server'

export async function shareCollection(
  collectionId: number,
  userEmail: string,
  permissionLevel: 'view' | 'edit'
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'You must be logged in', success: false }
  }

  // Verify the user owns this collection
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('owner_id')
    .eq('id', collectionId)
    .single()

  if (collectionError || !collection) {
    return { error: 'Collection not found', success: false }
  }

  if (collection.owner_id !== user.id) {
    return { error: 'You do not own this collection', success: false }
  }

  // Find the user by email
  const { data: targetUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', userEmail)
    .single()

  if (userError || !targetUser) {
    return { error: 'User not found with that email', success: false }
  }

  if (targetUser.id === user.id) {
    return { error: 'Cannot share with yourself', success: false }
  }

  // Check if permission already exists
  const { data: existingPermission } = await supabase
    .from('permissions')
    .select('id')
    .eq('collection_id', collectionId)
    .eq('user_id', targetUser.id)
    .single()

  if (existingPermission) {
    return { error: 'This user already has access to this collection', success: false }
  }

  // Create the permission
  const { error: insertError } = await supabase
    .from('permissions')
    .insert({
      collection_id: collectionId,
      user_id: targetUser.id,
      permission_level: permissionLevel,
    })

  if (insertError) {
    console.error('Error creating permission:', insertError)
    return { error: 'Failed to share collection', success: false }
  }

  return { success: true, error: null }
}

export async function getSharedUsers(collectionId: number) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'You must be logged in', data: null }
  }

  // Verify ownership
  const { data: collection } = await supabase
    .from('collections')
    .select('owner_id')
    .eq('id', collectionId)
    .single()

  if (!collection || collection.owner_id !== user.id) {
    return { error: 'Unauthorized', data: null }
  }

  // Get all permissions for this collection
  const { data: permissions, error } = await supabase
    .from('permissions')
    .select(`
      id,
      permission_level,
      user_id,
      users!inner (
        email
      )
    `)
    .eq('collection_id', collectionId)

  if (error) {
    console.error('Error fetching permissions:', error)
    return { error: 'Failed to fetch shared users', data: null }
  }

  const formattedData = permissions?.map((p: any) => ({
    id: p.id,
    permission_level: p.permission_level,
    user_id: p.user_id,
    email: p.users.email,
  })) || []

  return { error: null, data: formattedData }
}

export async function updateSharePermission(
  permissionId: number,
  newPermissionLevel: 'view' | 'edit'
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'You must be logged in', success: false }
  }

  // Verify the permission exists and user owns the collection
  const { data: permission } = await supabase
    .from('permissions')
    .select(`
      collection_id,
      collections!inner (
        owner_id
      )
    `)
    .eq('id', permissionId)
    .single()

  if (!permission || (permission.collections as any).owner_id !== user.id) {
    return { error: 'Unauthorized', success: false }
  }

  // Update the permission
  const { error } = await supabase
    .from('permissions')
    .update({ permission_level: newPermissionLevel })
    .eq('id', permissionId)

  if (error) {
    console.error('Error updating permission:', error)
    return { error: 'Failed to update permission', success: false }
  }

  return { success: true, error: null }
}

export async function removeShare(permissionId: number) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'You must be logged in', success: false }
  }

  // Verify the permission exists and user owns the collection
  const { data: permission } = await supabase
    .from('permissions')
    .select(`
      collection_id,
      collections!inner (
        owner_id
      )
    `)
    .eq('id', permissionId)
    .single()

  if (!permission || (permission.collections as any).owner_id !== user.id) {
    return { error: 'Unauthorized', success: false }
  }

  // Delete the permission
  const { error } = await supabase
    .from('permissions')
    .delete()
    .eq('id', permissionId)

  if (error) {
    console.error('Error removing permission:', error)
    return { error: 'Failed to remove access', success: false }
  }

  return { success: true, error: null }
}

export async function getCollectionPermission(collectionId: number) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { permission: null }
  }

  // Check if user owns the collection
  const { data: collection } = await supabase
    .from('collections')
    .select('owner_id')
    .eq('id', collectionId)
    .single()

  if (collection?.owner_id === user.id) {
    return { permission: 'owner' }
  }

  // Check if user has a permission for this collection
  const { data: permission } = await supabase
    .from('permissions')
    .select('permission_level')
    .eq('collection_id', collectionId)
    .eq('user_id', user.id)
    .single()

  return { permission: permission?.permission_level || null }
}
