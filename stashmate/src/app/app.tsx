// // import {useState} from 'react';
// 'use client'
// import { supabase } from '@/lib/supabaseClient';
// import Auth from './components/auth';
// // import InventoryItem from './components/InventoryItem';
// import {useEffect, useState} from 'react'
// import Collection from './components/collections';

// function App() {
//   const [session, setSession] = useState<any>(null)
//   const fetchSession = async ()=>{
//     const curSession = await supabase.auth.getSession()
//     setSession(curSession.data.session)
//   }

//   useEffect (() => {
//     fetchSession();
//     const {data} = supabase.auth.onAuthStateChange((_event,session) => {
//       setSession(session)
//     })
//     return () =>{
//       data.subscription.unsubscribe()
//     }
//   }, []);

//   const logout = async () => {
//     await supabase.auth.signOut();
//   };

  
//   return (
//     <>
//     {session ? (
//       <><button onClick={logout}> Log Out</button><Collection/></>
//     ): (
//       <Auth/>
//     )
//     }
//     </>
//   )
// }

// export default App

'use client'
import Auth from './components/auth';
import { useEffect, useState } from 'react'
import Collection from './components/collections';
import { createBrowserClient } from '@supabase/ssr'  // ← Change this

function App() {
  const [session, setSession] = useState<any>(null)
  
  // ✅ Create SSR browser client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <>
      {session ? (
        <>
          <button onClick={logout}>Log Out</button>
          <Collection />
        </>
      ) : (
        <Auth />
      )}
    </>
  )
}

export default App