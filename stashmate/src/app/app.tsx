'use client'
import Auth from './components/auth';
import { useEffect, useState } from 'react'
import Collection from './components/collections';
import Inventory from './components/InventoryItem';
import { createBrowserClient } from '@supabase/ssr'
import Navbar from './components/Navbar'; 
import RevenueGraph from './components/RevenueGraph';
import InventoryPage from './components/InventoryPage';
import { getRevenueDataByCollection } from './actions/dashboard/getRevenueData';

//import ExportButton from './components/exportButton';

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
          console.log('Fetching revenue data for collection:', selectedCollectionId);
          // Fetch revenue data by collection
          // You can change 'day' to 'week' or 'month' for different aggregation
          const data = await getRevenueDataByCollection(selectedCollectionId, 'day');
          console.log('Revenue data received:', data);
          setRevenueData(data);
        } catch (error) {
          console.error('Error fetching revenue data:', error);
          // Fallback to empty array on error
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

  // Remove this sample data - it was overwriting the real data

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
        <>
          <div>
            <InventoryPage
              onBack={handleBack}
              refreshRevenue={refreshRevenue}
              revenueData={revenueData}
              selectedCollectionId={selectedCollectionId}
              setSelectedCollectionId={setSelectedCollectionId}
            />
          </div>
        </>
      ) : (
        <Auth />
      )}
    </>
  );
}

export default App