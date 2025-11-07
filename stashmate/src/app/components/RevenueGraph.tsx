'use client';

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

type RevenueData = {
  date: string; // or number
  revenue: number;
};

interface RevenueGraphProps {
  data: RevenueData[];
}

const RevenueGraph: React.FC<RevenueGraphProps> = ({ data }) => {
  const [chartData, setChartData] = useState<any>(null);

  // Prepare the data for the chart when it changes
  useEffect(() => {
    const labels = data.map(item => item.date);
    const revenueValues = data.map(item => item.revenue);

    setChartData({
      labels,
      datasets: [
        {
          label: 'Revenue Over Time',
          data: revenueValues,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.4,
        },
      ],
    });
  }, [data]);

  return (
    <div>
      <h2>Revenue Graph</h2>
      {chartData ? <Line data={chartData} /> : <p>Loading...</p>}
    </div>
  );
};

export default RevenueGraph;
