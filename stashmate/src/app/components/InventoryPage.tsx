'use client'

import { useState } from 'react';
import Collection from '../components/collections';
import Inventory from '../components/InventoryItem';
import RevenueGraph from '../components/RevenueGraph';

export default function InventoryPage({
  onBack,
  refreshRevenue,
  revenueData,
}: {
  onBack: () => void;
  refreshRevenue: () => void;
  revenueData: any[];
}) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside
        style={{
            width: '280px',
            backgroundColor: '#111',
            color: 'white',
            height: '100vh',
            padding: '1rem',
            borderRight: '1px solid #333',
            margin: 0,
            marginTop: '80px',
            position: 'fixed',
            left: 0,
        }}
      >
        <Collection onSelectCollection={(id) => setSelectedCollectionId(id)} />
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          marginLeft: '280px', // sidebar width
          padding: '1.5rem',
          paddingTop: '100px', // navbar height
          minHeight: '100vh',
          overflowY: 'auto'
        }}
      >
        {selectedCollectionId ? (
          <div>
            <Inventory collectionId={selectedCollectionId} onItemUpdate={refreshRevenue} />
            <RevenueGraph data={revenueData} />
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-10">
            Select a collection to view inventory
          </div>
        )}
      </main>
    </div>
  );
}
