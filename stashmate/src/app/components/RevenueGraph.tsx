'use client';

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

type RevenueData = {
  date: string;
  revenue: number;
  profit: number;
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
      const profitValues = data.map(item => item.profit);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenueValues,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: false,
            tension: 0.4,
          },
          {
            label: 'Profit',
            data: profitValues,
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            fill: false,
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
            const label = context.dataset.label || '';
            return `${label}: $${context.parsed.y.toFixed(2)}`;
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
      <h2>Revenue & Profit</h2>
      {chartData ? (
        <Line data={chartData} options={options} />
      ) : (
        <p>No data available. Sell some items to see your revenue and profit trends.</p>
      )}
    </div>
  );
};

export default RevenueGraph;
