'use server'
import { createClient } from '@/lib/server'

export async function getCollections() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Get owned collections
  const { data: ownedCollections, error: ownedError } = await supabase
    .from('collections')
    .select('*')
    .eq('owner_id', user.id);

  if (ownedError) {
    console.error('Error fetching owned collections:', ownedError);
  }

  // Get shared collection IDs
  const { data: shares, error: sharesError } = await supabase
    .from('collection_shares')
    .select('collection_id, permission_level')
    .eq('shared_with_user_id', user.id);

  if (sharesError) {
    console.error('Error fetching shares:', sharesError);
  }

  // Get the actual collection data for shared collections
  let sharedCollectionsData: any[] = [];
  if (shares && shares.length > 0) {
    const sharedIds = shares.map(s => s.collection_id);
    const { data: sharedCols, error: sharedError } = await supabase
      .from('collections')
      .select('*')
      .in('id', sharedIds);

    if (sharedError) {
      console.error('Error fetching shared collection details:', sharedError);
    } else if (sharedCols) {
      // Merge permission data with collection data
      sharedCollectionsData = sharedCols.map(col => {
        const share = shares.find(s => s.collection_id === col.id);
        return {
          ...col,
          is_owner: false,
          permission: share?.permission_level || 'view'
        };
      });
    }
  }

  const allCollections = [
    ...(ownedCollections || []).map(c => ({ ...c, is_owner: true, permission: 'admin' })),
    ...sharedCollectionsData
  ];

  console.log('Total collections:', allCollections.length, {
    owned: ownedCollections?.length || 0,
    shared: sharedCollectionsData.length
  });

  return { success: true, data: allCollections };
}