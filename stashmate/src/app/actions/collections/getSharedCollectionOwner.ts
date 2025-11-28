'use server'

import { createClient } from '@/lib/server'

export async function getCollectionOwner(collectionId: number) {
  const supabase = await createClient()
  
  // Get collection to find owner_id
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('owner_id')
    .eq('id', collectionId)
    .single()

  if (collectionError || !collection) {
    console.error('Error fetching collection:', collectionError)
    return { error: 'Collection not found', data: null }
  }

  // Get owner info from users table
  const { data: owner, error: ownerError } = await supabase
    .from('users')
    .select('email')
    .eq('id', collection.owner_id)
    .single()

  if (ownerError || !owner) {
    console.error('Error fetching owner:', ownerError)
    return { error: 'Owner not found', data: null }
  }

  return { 
    error: null, 
    data: {
      owner_id: collection.owner_id,
      owner_name: owner.email
    }
  }
}