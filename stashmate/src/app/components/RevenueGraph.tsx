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
    if (data && data.length > 0) {
      // Format dates for better display
      const labels = data.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      const revenueValues = data.map(item => item.revenue);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenueValues,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.4,
          },
        ],
      });
    } else {
      setChartData(null);
    }
  }, [data]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Revenue: $${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value;
          }
        }
      }
    }
  };

  return (
    <div>
      <h2>Revenue Graph</h2>
      {chartData ? (
        <Line data={chartData} options={options} />
      ) : (
        <p>No revenue data available. Sell some items to see your revenue graph!</p>
      )}
    </div>
  );
};

export default RevenueGraph;
