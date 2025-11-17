'use server'
import { createClient } from '@/lib/server'

export async function createItem(formData: FormData) {
  const name = formData.get('name') as string
  const condition = formData.get('condition') as string
  const cost = Number(formData.get('cost'))
  const price = Number(formData.get('price'))
  const profit = price - cost
  const source = formData.get('source') as string
  const status = Number(formData.get('status'));
  const quantity = Number(formData.get('quantity'));
  const collectionId = Number(formData.get('collection_id'))
  const imageFile = formData.get('image_url') as File
  const created_at = formData.get('created_at') as string
  
  const supabase = await createClient()
  
  const response = await supabase.auth.getUser()
  const info = response.data
  const user = info.user
  
  if (!user) {
    return { success: false, error: 'You must be logged in' }
  }

  let image_url = ''

  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: 'Failed to upload image: ' + uploadError.message }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('item-images')
      .getPublicUrl(fileName)
    
    image_url = publicUrl
  }

  const insertData = {
    name: name,
    condition: condition,
    cost: cost,
    price: price,
    quantity: quantity,
    profit: profit,
    source: source,
    status: status,
    created_at: created_at || new Date().toISOString().split('T')[0],
    collection_id: collectionId,
    image_url: image_url || null
  }

  console.log('Attempting insert')

  const { data, error } = await supabase
    .from('items')
    .insert([insertData])
    .select()

  if (error) {
    console.error('Insert error:', error)
    return { success: false, error: error.message }
  }

  console.log('SUCCESS!')
  return { success: true, data}
}
