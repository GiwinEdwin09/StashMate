'use client';

import App from './app'
import React, { useState, useEffect } from 'react';
import RevenueGraph from './components/RevenueGraph';
import Navbar from './components/Navbar';

const Page: React.FC = () => {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [isCollectionSelected, setIsCollectionSelected] = useState<boolean>(false); 

  useEffect(() => {
    const sampleData = [
      { date: '2025-01-01', revenue: 500 },
      { date: '2025-02-01', revenue: 600 },
      { date: '2025-03-01', revenue: 700 },
      { date: '2025-04-01', revenue: 800 },
    ];
    setRevenueData(sampleData);
  }, []);

  const logout = () => {
    console.log("Logging out...");
  };

  const handleBack = () => {
    console.log("Going back...");
  };

  return (
    <div>
      {/* Main content container */}
      <div className="content-container">
        <h1>Revenue Overview</h1>
        <div className="graph-container">
          <RevenueGraph data={revenueData} />
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <App/>
  )
}

