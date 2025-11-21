'use server'
import { createClient } from '@/lib/server'

export async function getCollections() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.log('Auth error or no user:', authError)
    return { error: 'You must be logged in', data: null }
  }
  
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('owner_id', user.id)
    .order('id', { ascending: false })

  console.log('Supabase response:', { data, error });

  if (error) {
    return { error: error.message, data: null }
  }
  
  return { error: null, data }
}