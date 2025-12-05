'use server';

import { createClient } from '@/lib/server';

type RevenueData = {
  date: string;
  revenue: number;
  profit: number;
};

type AggregationPeriod = 'day' | 'week' | 'month';

/**
 * Gets revenue data for a specific collection
 * @param collectionId - The collection ID
 * @param period - How to aggregate the data
 * @returns Array of revenue data points
 */
export async function getRevenueDataByCollection(
  collectionId: number,
  period: AggregationPeriod = 'day'
): Promise<RevenueData[]> {
  const supabase = await createClient();

  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('created_at, profit, price, status')
      .eq('collection_id', collectionId)
      .eq('status', 2) // Only sold items (status 2 = sold)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching collection revenue data:', error);
      throw error;
    }

    if (!items || items.length === 0) {
      return [];
    }

    // Aggregate revenue and profit by the specified period
    const dataByPeriod: Record<string, { revenue: number; profit: number }> = {};

    items.forEach((item) => {
      const date = new Date(item.created_at);
      let periodKey: string;

      switch (period) {
        case 'day':
          periodKey = date.toISOString().split('T')[0];
          break;
        case 'week':
          const monday = new Date(date);
          monday.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
          periodKey = monday.toISOString().split('T')[0];
          break;
        case 'month':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        default:
          periodKey = date.toISOString().split('T')[0];
      }

      if (!dataByPeriod[periodKey]) {
        dataByPeriod[periodKey] = { revenue: 0, profit: 0 };
      }

      dataByPeriod[periodKey].revenue += item.price;
      dataByPeriod[periodKey].profit += item.profit;
    });

    const revenueData = Object.entries(dataByPeriod)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        profit: data.profit,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return revenueData;
  } catch (error) {
    console.error('Failed to fetch collection revenue data:', error);
    throw error;
  }
}
