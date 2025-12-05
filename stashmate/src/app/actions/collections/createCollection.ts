'use server'
import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

export async function createCollection(formData: FormData) {
  // Extract collection name and category from form data
  const name = formData.get('name') as string
  const category = formData.get('category') as string

  // Initialize Supabase client for server-side operations
  const supabase = await createClient()
  
  // Get the currently authenticated user
  const response = await supabase.auth.getUser()
  const info = response.data
  const user = info.user
  
  // Verify user is authenticated before allowing collection creation
  if (!user) {
    return { success: false, error: 'You must be logged in' }
  }

  // Validate that both name and category are provided and not empty
  if (!name?.trim() || !category?.trim()) {
    return { success: false, error: 'Name and category required' }
  }

  // Prepare collection data for database insertion
  const insertData = {
    name: name,
    category: category,
    acquired_date: new Date().toISOString().split('T')[0], // Set acquisition date to today (YYYY-MM-DD format)
    owner_id: user.id, // Link collection to current user
  }

  console.log('Attempting insert')

  // Insert new collection into database and return the created record
  const { data, error } = await supabase
    .from('collections')
    .insert([insertData])
    .select()
    .single()

  // Handle any database errors during insertion
  if (error) {
    console.error('Insert error:', error)
    return { success: false, error: error.message }
  }

  console.log('SUCCESS!')
  // Revalidate the collections page cache to show the new collection
  revalidatePath('/collections')
  return { success: true, data }
}