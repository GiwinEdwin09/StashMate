// import {useState} from 'react';
'use client'
import { supabase } from '@/lib/supabaseClient';
import Auth from './components/auth';
import Inventory from './components/Inventory';
import {useEffect, useState} from 'react'

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
      <><button onClick={logout}> Log Out</button><Inventory/></>
    ): (
      <Auth/>
    )
    }
    </>
  )
}

export default App