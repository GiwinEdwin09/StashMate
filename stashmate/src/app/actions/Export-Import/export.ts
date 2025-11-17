'use server'

import { createClient } from '@/lib/server'
import { json2csv } from 'json-2-csv' 


const getStatusText = (status: number): string => {
    switch (status) {
      case 0:
        return 'Listed';
      case 1:
        return 'In Stock';
      case 2:
        return 'Sold';
      default:
        return '';
    }
  };

export async function exportCollectionsWithItems(collectionID?: string[]) {
  const supabase = await createClient()
  
  const response = await supabase.auth.getUser()
  const user = response.data.user
  
  if (!user) {
    return {error: 'You must be logged in'}
  }

  let query = supabase
    .from('collections')
    .select(`
      *,
      items (*)
    `)
    .eq('owner_id', user.id)
    .order('acquired_date', { ascending: false })
  
  if (collectionID && collectionID.length > 0) {
    query = query.in('id',collectionID)
  }
  
  const { data: collections, error } = await query.order('acquired_date', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  if (!collections || collections.length === 0) {
    return { error: 'No collections to export' }
  }

  try {
    /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap */
    const exportData = collections.flatMap(collection => {
      const { id, owner_id, collection_status, collection_cond, collection_source, items, ...collectionData } = collection
      
      const collectionItems = items && items.length > 0 ? items : [null]
      
      return collectionItems.map((item: any) => {
        const { id, collection_id, ...itemData } = item || {}
        
        return {
          collection_name: collectionData.name,
          collection_category: collectionData.category,
          // collection_qty: collectionData.qty,
          // collection_cost: collectionData.cost,
          // collection_value: collectionData.value,
          collection_acquired_date: collectionData.acquired_date,
          // collection_profit: collectionData.profit,
          item_name: itemData.name || '',
          item_condition: itemData.condition || '',
          item_cost: itemData.cost ?? '',
          item_price: itemData.price ?? '',
          item_profit: itemData.profit ?? '',
          item_source: itemData.source || '',
          item_status: getStatusText(itemData.status) ?? '',
          item_quantity: itemData.quantity ?? '',
          item_image_url: itemData.image_url || '',
        }
      })
    })
    
    const csv = json2csv(exportData)
    
    return {csv, count: exportData.length }
  } catch (error) {
    return { error: 'Failed to generate CSV' }
  }
}