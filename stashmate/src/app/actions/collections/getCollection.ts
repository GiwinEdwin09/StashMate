'use server'
import { createClient } from '@/lib/server'

export async function getCollections() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.log('Auth error or no user:', authError)
    return { error: 'You must be logged in', data: null }
  }
  
  // Get collections owned by the user
  const { data: ownedCollections, error: ownedError } = await supabase
    .from('collections')
    .select('*')
    .eq('owner_id', user.id)
    .order('id', { ascending: false })

  if (ownedError) {
    return { error: ownedError.message, data: null }
  }

  // Get permissions for collections shared with the user
  const { data: permissions, error: permissionsError } = await supabase
    .from('permissions')
    .select('collection_id, permission_level')
    .eq('user_id', user.id)

  if (permissionsError) {
    console.log('Permissions error:', permissionsError)
  }

  // Get the actual collection data for shared collections
  let sharedCollections: any[] = []
  if (permissions && permissions.length > 0) {
    const sharedIds = permissions.map(p => p.collection_id)
    const { data: sharedCollectionsData, error: sharedError } = await supabase
      .from('collections')
      .select('*')
      .in('id', sharedIds)

    if (sharedError) {
      console.log('Shared collections error:', sharedError)
    } else if (sharedCollectionsData) {
      // Map permission levels to collections
      sharedCollections = sharedCollectionsData.map(col => {
        const perm = permissions.find(p => p.collection_id === col.id)
        return {
          ...col,
          permission: perm?.permission_level || 'view',
          is_owner: false,
        }
      })
    }
  }

  const allCollections = [
    ...ownedCollections.map(c => ({ ...c, permission: 'owner', is_owner: true })),
    ...sharedCollections,
  ]

  console.log('Collections fetched:', { 
    owned: ownedCollections.length, 
    shared: sharedCollections.length,
    total: allCollections.length,
    user_id: user.id
  })

  return { error: null, data: allCollections }
}