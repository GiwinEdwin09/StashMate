'use server'
import { supabase } from '@/lib/supabaseClient'

export async function deleteCollection(formData: FormData) {
    const name = formData.get('name') as string

    const { data, error } = await supabase
    .from('collections')
    .delete()
    .eq('name', name)
    .select()

    if (error) throw new Error(error.message)
    return data
}