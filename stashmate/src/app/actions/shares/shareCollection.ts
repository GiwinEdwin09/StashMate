'use server';

import { createClient } from '@/lib/server';

export async function shareCollection(
  collectionId: number,
  userEmail: string,
  permissionLevel: 'view' | 'edit' | 'admin'
) {
  const supabase = await createClient();
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Find user in public.users table by email
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userEmail.toLowerCase().trim())
      .single();

    if (userError || !targetUser) {
      console.error('User lookup error:', userError);
      return { 
        success: false, 
        error: `User with email "${userEmail}" not found. Make sure they have registered.` 
      };
    }

    // Check if trying to share with self
    if (targetUser.id === user.id) {
      return { success: false, error: 'Cannot share collection with yourself' };
    }

    // Check if current user owns the collection
    const { data: collection } = await supabase
      .from('collections')
      .select('owner_id')
      .eq('id', collectionId)
      .single();

    if (collection?.owner_id !== user.id) {
      return { success: false, error: 'You do not own this collection' };
    }

    // Check if already shared
    const { data: existingShare } = await supabase
      .from('collection_shares')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('shared_with_user_id', targetUser.id)
      .single();

    if (existingShare) {
      return { success: false, error: 'Collection already shared with this user' };
    }

    // Create share
    const { error } = await supabase
      .from('collection_shares')
      .insert({
        collection_id: collectionId,
        shared_with_user_id: targetUser.id,
        shared_by_user_id: user.id,
        permission_level: permissionLevel,
      });

    if (error) {
      console.error('Share creation error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Share collection error:', error);
    return { success: false, error: error.message };
  }
}

export async function getCollectionPermission(collectionId: number) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if owner
  const { data: collection } = await supabase
    .from('collections')
    .select('owner_id')
    .eq('id', collectionId)
    .single();

  if (collection?.owner_id === user.id) {
    return 'admin';
  }

  // Check shared permissions
  const { data: share } = await supabase
    .from('collection_shares')
    .select('permission_level')
    .eq('collection_id', collectionId)
    .eq('shared_with_user_id', user.id)
    .single();

  return share?.permission_level || null;
}

export async function getSharedUsers(collectionId: number) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('collection_shares')
    .select(`
      id,
      permission_level,
      created_at,
      users:shared_with_user_id (
        id,
        email
      )
    `)
    .eq('collection_id', collectionId);

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function updateSharePermission(
  shareId: number,
  newPermission: 'view' | 'edit' | 'admin'
) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('collection_shares')
    .update({ permission_level: newPermission })
    .eq('id', shareId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeShare(shareId: number) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('collection_shares')
    .delete()
    .eq('id', shareId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}