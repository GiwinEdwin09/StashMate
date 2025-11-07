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
import Inventory from './components/InventoryItem';
import { createBrowserClient } from '@supabase/ssr'  // ← Change this
import Navbar from './components/Navbar'; 
import RevenueGraph from './components/RevenueGraph';

function App() {
  const [session, setSession] = useState<any>(null)
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null)
  const [revenueData, setRevenueData] = useState<any[]>([]);
  
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

  // Fetch revenue data 
  useEffect(() => {
    if (selectedCollectionId !== null) {
      // FOR TESTING (replace with actual values)
      const sampleData = [
        { date: '2025-01-01', revenue: 500 },
        { date: '2025-02-01', revenue: 600 },
        { date: '2025-03-01', revenue: 700 },
        { date: '2025-04-01', revenue: 800 },
      ];
      setRevenueData(sampleData);
    }
  }, [selectedCollectionId]);

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  const handleSelectCollection = (id: number) => {
    setSelectedCollectionId(id)
  }

  const handleBack = () => {
    setSelectedCollectionId(null)
  }

  const isCollectionSelected = selectedCollectionId !== null;

  return (
    <>
      <Navbar logout={logout} handleBack={handleBack} isCollectionSelected={isCollectionSelected} />
      {session ? (
        <>
          <div className="container">
            {selectedCollectionId ? (
              <div>
                <Inventory collectionId={selectedCollectionId} />
                {/* Only show RevenueGraph if a collection is selected */}
                <RevenueGraph data={revenueData} />
              </div>
            ) : (
              <Collection onSelectCollection={handleSelectCollection} />
            )}
          </div>
        </>
      ) : (
        <Auth />
      )}
    </>
  );
}

export default App