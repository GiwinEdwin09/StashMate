import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
/* ServerClient created to read the authenticatied's user cookies and update it whenever authenticated user changed */
export async function createClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStore).getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(async ({ name, value, options }) =>
            (await cookieStore).set(name, value, options)
          )
        },
      },
    }
  )
}