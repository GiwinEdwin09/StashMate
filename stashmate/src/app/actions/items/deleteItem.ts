'use server'
import { createClient } from '@/lib/server'

export async function deleteItem(id: number) {
    console.log('Attempting to delete item with id:', id)
    
    const supabase = await createClient()
    
    const response = await supabase.auth.getUser()
    const info = response.data
    const user = info.user
    
    console.log('User:', user?.id)
    
    if (!user) {
        console.log('No user found')
        return { success: false, error: 'You must be logged in' }
    }

    const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id)

    if (error) {
        console.log('Delete error:', error)
        return { success: false, error: error.message }
    }
    
    console.log('Delete successful')
    return { success: true }
}