'use server'
import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

export async function deleteCollection(id: number) {
    // Initialize Supabase client and get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
  
    // Verify user is authenticated before allowing deletion
    if (authError || !user) {
        console.log('Auth error or no user:', authError)
        return { success: false, error: 'You must be logged in' }
    }

    // Delete collection only if user is the owner (security check)
    // Using both id and owner_id ensures users can only delete their own collections
    const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id)

    // Handle any database errors during deletion
    if (error) {
        return { success: false, error: error.message }
    }
    // Revalidate collections page cache to reflect deletion
    /* https://nextjs.org/docs/app/api-reference/functions/revalidatePath */
    revalidatePath('/collections')
    return { success: true }
}