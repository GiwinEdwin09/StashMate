'use server'
import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

export async function deleteCollection(id: number) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
  
    if (authError || !user) {
        console.log('Auth error or no user:', authError)
        return { success: false, error: 'You must be logged in' }
    }

    const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id)

    if (error) {
        return { success: false, error: error.message }
    }
    /* https://nextjs.org/docs/app/api-reference/functions/revalidatePath */
    revalidatePath('/collections')
    return { success: true }
}