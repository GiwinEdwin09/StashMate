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
      // Get unique owner IDs
      const ownerIds = [...new Set(sharedCollectionsData.map(c => c.owner_id))]
      
      // Fetch owner information from users table
      const { data: ownerData, error: ownerError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', ownerIds)
      
      if (ownerError) {
        console.log('Error fetching owner data:', ownerError)
      }
      
      // Create a map of owner IDs to emails
      const ownerMap = new Map()
      if (ownerData) {
        ownerData.forEach(owner => {
          ownerMap.set(owner.id, owner.email || 'Unknown User')
        })
      }
      
      // Map permission levels and owner names to collections
      sharedCollections = sharedCollectionsData.map(col => {
        const perm = permissions.find(p => p.collection_id === col.id)
        return {
          ...col,
          permission: perm?.permission_level || 'view',
          is_owner: false,
          owner_name: ownerMap.get(col.owner_id) || 'Unknown User',
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