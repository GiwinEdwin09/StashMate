// 'use client'
// import Auth from './components/auth';
// import { useEffect, useState } from 'react'
// import Collection from './components/collections';
// import Inventory from './components/InventoryItem';
// import { createBrowserClient } from '@supabase/ssr'
// import Navbar from './components/Navbar'; 
// import RevenueGraph from './components/RevenueGraph';
// import { getRevenueDataByCollection } from './actions/dashboard/getRevenueData';

// // import ExportButton from './components/exportButton';

// function App() {
//   const [session, setSession] = useState<any>(null)
//   const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null)
//   const [revenueData, setRevenueData] = useState<any[]>([]);
//   const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
//   const [revenueRefreshTrigger, setRevenueRefreshTrigger] = useState(0);
  
//   const supabase = createBrowserClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//   )

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session)
//     })

//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session)
//     })

//     return () => subscription.unsubscribe()
//   }, [])


//   // Fetch revenue data when a collection is selected
//   useEffect(() => {
//     const fetchRevenueData = async () => {
//       if (selectedCollectionId !== null) {
//         setIsLoadingRevenue(true);
//         try {
//           console.log('Fetching revenue data for collection:', selectedCollectionId);
//           // Fetch revenue data by collection
//           // You can change 'day' to 'week' or 'month' for different aggregation
//           const data = await getRevenueDataByCollection(selectedCollectionId, 'day');
//           console.log('Revenue data received:', data);
//           setRevenueData(data);
//         } catch (error) {
//           console.error('Error fetching revenue data:', error);
//           // Fallback to empty array on error
//           setRevenueData([]);
//         } finally {
//           setIsLoadingRevenue(false);
//         }
//       } else {
//         setRevenueData([]);
//       }
//     };

//     fetchRevenueData();
//   }, [selectedCollectionId, revenueRefreshTrigger]);

//   useEffect(() => {
//     if (selectedCollectionId !== null) {
//       const sampleData = [
//         { date: '2025-01-01', revenue: 500 },
//         { date: '2025-02-01', revenue: 600 },
//         { date: '2025-03-01', revenue: 700 },
//         { date: '2025-04-01', revenue: 800 },
//       ];
//       setRevenueData(sampleData);
//     }
//   }, [selectedCollectionId]);

//   const logout = async () => {
//     await supabase.auth.signOut()
//     setSession(null)
//   }

//   const handleSelectCollection = (id: number) => {
//     setSelectedCollectionId(id)
//   }

//   const handleBack = () => {
//     setSelectedCollectionId(null)
//   }

//   const refreshRevenue = () => {
//     setRevenueRefreshTrigger(prev => prev + 1);
//   }

//   const isCollectionSelected = selectedCollectionId !== null;

//   return (
//     <>
//       <Navbar 
//         logout={logout} 
//         handleBack={handleBack} 
//         isCollectionSelected={isCollectionSelected} 
//         // exportButton={<ExportButton />}
//       />
//       {session ? (
//         <>
//           <div className="container">
//             {selectedCollectionId ? (
//               <div>
//                 <Inventory collectionId={selectedCollectionId} onItemUpdate={refreshRevenue} />
//                 {/* Only show RevenueGraph if a collection is selected */}

//                 <Inventory collectionId={selectedCollectionId} />

//                 <RevenueGraph data={revenueData} />
//               </div>
//             ) : (
//               <Collection onSelectCollection={handleSelectCollection} />
//             )}
//           </div>
//         </>
//       ) : (
//         <Auth />
//       )}
//     </>
//   );
// }

// export default App

'use client'
import Auth from './components/auth';
import { useEffect, useState } from 'react'
import Collection from './components/collections';
import Inventory from './components/InventoryItem';
import { createBrowserClient } from '@supabase/ssr'
import Navbar from './components/Navbar'; 
import RevenueGraph from './components/RevenueGraph';
import { getRevenueDataByCollection } from './actions/dashboard/getRevenueData';

function App() {
  const [session, setSession] = useState<any>(null)
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null)
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
  const [revenueRefreshTrigger, setRevenueRefreshTrigger] = useState(0);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch revenue data when a collection is selected
  useEffect(() => {
    const fetchRevenueData = async () => {
      if (selectedCollectionId !== null) {
        setIsLoadingRevenue(true);
        try {
          const data = await getRevenueDataByCollection(selectedCollectionId, 'day');
          setRevenueData(data);
        } catch (error) {
          console.error('Error fetching revenue data:', error);
          setRevenueData([]);
        } finally {
          setIsLoadingRevenue(false);
        }
      } else {
        setRevenueData([]);
      }
    };

    fetchRevenueData();
  }, [selectedCollectionId, revenueRefreshTrigger]);

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

  const refreshRevenue = () => {
    setRevenueRefreshTrigger(prev => prev + 1);
  }

  const isCollectionSelected = selectedCollectionId !== null;

  return (
    <>
      <Navbar 
        logout={logout} 
        handleBack={handleBack} 
        isCollectionSelected={isCollectionSelected}
      />
      {session ? (
        <div className="flex" style={{ height: 'calc(100vh - 64px)', marginTop: '64px' }}>
          <div className="w-80 border-r border-gray-700" style={{ backgroundColor: 'var(--bg)' }}>
            <Collection onSelectCollection={handleSelectCollection} />
          </div>
          
          <div className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--bg)' }}>
            {selectedCollectionId ? (
              <div className="p-6">
                <Inventory collectionId={selectedCollectionId} onItemUpdate={refreshRevenue} />
                <RevenueGraph data={revenueData} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-xl">Select a collection to view items</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Auth />
      )}
    </>
  );
}

export default App;