// import {useState} from 'react';
'use client'
import { supabase } from '@/lib/supabaseClient';
import Auth from './components/auth';
// import InventoryItem from './components/InventoryItem';
import {useEffect, useState} from 'react'
import Collection from './components/collections';

function App() {
  const [session, setSession] = useState<any>(null)
  const fetchSession = async ()=>{
    const curSession = await supabase.auth.getSession()
    setSession(curSession.data.session)
  }

  useEffect (() => {
    fetchSession();
    const {data} = supabase.auth.onAuthStateChange((_event,session) => {
      setSession(session)
    })
    return () =>{
      data.subscription.unsubscribe()
    }
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };
  return (
    <>
    {session ? (
      <><button onClick={logout}> Log Out</button><Collection/></>
    ): (
      <Auth/>
    )
    }
    </>
  )
}

export default App