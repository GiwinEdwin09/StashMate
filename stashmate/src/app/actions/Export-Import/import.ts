'use server'

import { createClient } from '@/lib/server'
import { csv2json } from 'json-2-csv'

function toNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

function toString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined) {
    return defaultValue
  }
  return String(value).trim()
}

export async function importCollectionsWithItems(csvContent: string) {
  const supabase = await createClient()
  
  const {data: { user }} = await supabase.auth.getUser()
  if (!user) {
    return {error: 'You must be logged in'}
  }

  try {
    const rows = csv2json(csvContent) as any[]
    
    if (!rows?.length){
      return { error: 'No data found in CSV' } 
    }

    const collections = new Map()
    
    rows.forEach(row => {
      const key = `${row.collection_name}_${row.collection_acquired_date}`
      
      if (!collections.has(key)) {
        collections.set(key, {
          name: toString(row.collection_name),
          category: toString(row.collection_category),
          // cond: toString(row.collection_cond) || null,
          // source: toString(row.collection_source) || null,
          acquired_date: row.collection_acquired_date,
          // status: toNumber(row.collection_status, 0),
          items: []
        })
      }

      if (row.item_name?.trim()) {
        const cost = toNumber(row.item_cost, 0)
        const price = toNumber(row.item_price, 0)
        const quantity = toNumber(row.item_quantity, 1)
        
        const profit = (price - cost) * quantity
        
        collections.get(key).items.push({
          name: toString(row.item_name),
          condition: toString(row.item_condition),
          cost: cost,
          price: price,
          profit: profit,
          source: toString(row.item_source),
          status: toNumber(row.item_status, 0),
          quantity: quantity,
          image_url: toString(row.item_image_url),
          created_at: new Date().toISOString(),
        })
      }
    })

    let created = 0, updated = 0

    for (const [key, collection] of collections) {
      const items = collection.items
      /* https://www.geeksforgeeks.org/typescript/typescript-array-reduce-method/ */
      // const collectionQty = items.reduce((sum: any, item: { quantity: any }) => sum + item.quantity, 0)
      // const collectionCost = items.reduce((sum: number, item: { cost: number; quantity: number }) => sum + (item.cost * item.quantity), 0)
      // const collectionValue = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0)
      // const collectionProfit = collectionValue - collectionCost
      
      delete collection.items

      const { data: existingCollection } = await supabase
        .from('collections')
        .select('id')
        .eq('owner_id', user.id)
        .eq('name', collection.name)
        .eq('acquired_date', collection.acquired_date)
        .maybeSingle()

      let collectionId: string

      if (existingCollection) {
        const { error: updateError } = await supabase
          .from('collections')
          .update({
            category: collection.category,
            // qty: collectionQty,
            // cost: collectionCost,
            // value: collectionValue,
            // profit: collectionProfit,
          })
          .eq('id', existingCollection.id)

        if (updateError) {
          console.error('Update error:', updateError)
          return {error: "failed to make update from the csv import file"}
        }
        
        collectionId = existingCollection.id
        updated++
      } else {
        const { data: newCol, error: createError } = await supabase
          .from('collections')
          .insert({ 
            ...collection,
            // qty: collectionQty,
            // cost: collectionCost,
            // value: collectionValue,
            // profit: collectionProfit,
            owner_id: user.id 
          })
          .select()
          .single()

        if (createError) {
          console.error('Create error:', createError)
          return {error: "failed to created item from csv import"}
        }
        
        collectionId = newCol.id
        created++
      }

      if (items.length > 0) {
        await supabase.from('items').delete().eq('collection_id', collectionId)

        const { error: itemsError } = await supabase
          .from('items')
          .insert(items.map((item: any) => ({ 
            ...item, 
            collection_id: collectionId 
          })))

        if (itemsError) {
          return {error: 'failed to insert new item from the csv import'}
        }
      }
    }

    return {
      success: true,
      message: `Import complete! Created: ${created}, Updated: ${updated}`,
    }

  } catch (error) {
    return {error: 'Failed to import CSV'}
  }
}