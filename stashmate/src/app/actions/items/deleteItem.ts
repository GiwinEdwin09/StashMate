'use server'
import { supabase } from '@/lib/supabaseClient'

export async function deleteItem(formData: FormData) {
    const name = formData.get('name') as string

    const { data, error } = await supabase
    .from('items')
    .delete()
    .eq('name', name)
    .select()

    if (error) throw new Error(error.message)
    return data
}