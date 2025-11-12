'use server';

import { createClient } from '@/lib/server';

type RevenueData = {
  date: string;
  revenue: number;
};

type AggregationPeriod = 'day' | 'week' | 'month';

export async function getRevenueData(
  userId: string,
  period: AggregationPeriod = 'day',
  startDate?: string,
  endDate?: string
): Promise<RevenueData[]> {
  const supabase = await createClient();

  try {
    // Build the query
    let query = supabase
      .from('items')
      .select('created_at, profit, price, status, collection_id')
      .eq('status', 2); // Status 2 = sold items

    // Add date filters if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Order by date
    query = query.order('created_at', { ascending: true });

    const { data: items, error } = await query;

    if (error) {
      console.error('Error fetching revenue data:', error);
      throw error;
    }

    if (!items || items.length === 0) {
      return [];
    }

    // Aggregate revenue by the specified period
    const revenueByPeriod: Record<string, number> = {};

    items.forEach((item) => {
      const date = new Date(item.created_at);
      let periodKey: string;

      switch (period) {
        case 'day':
          periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          // Get the Monday of the week
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

      if (!revenueByPeriod[periodKey]) {
        revenueByPeriod[periodKey] = 0;
      }

      // Use profit as revenue (you can change this to 'price' if needed)
      revenueByPeriod[periodKey] += item.price;
    });

    // Convert to array and sort by date
    const revenueData = Object.entries(revenueByPeriod)
      .map(([date, revenue]) => ({
        date,
        revenue,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return revenueData;
  } catch (error) {
    console.error('Failed to fetch revenue data:', error);
    throw error;
  }
}

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

    // Aggregate revenue by the specified period
    const revenueByPeriod: Record<string, number> = {};

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

      if (!revenueByPeriod[periodKey]) {
        revenueByPeriod[periodKey] = 0;
      }

      revenueByPeriod[periodKey] += item.price;
    });

    const revenueData = Object.entries(revenueByPeriod)
      .map(([date, revenue]) => ({
        date,
        revenue,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return revenueData;
  } catch (error) {
    console.error('Failed to fetch collection revenue data:', error);
    throw error;
  }
}

/**
 * Gets total revenue summary
 * @param userId - The user's ID
 * @returns Total revenue and count of sold items
 */
export async function getRevenueSummary(userId: string) {
  const supabase = await createClient();

  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('profit, price')
      .eq('status', 2); // Only sold items (status 2 = sold)

    if (error) {
      console.error('Error fetching revenue summary:', error);
      throw error;
    }

    if (!items || items.length === 0) {
      return {
        totalRevenue: 0,
        totalSales: 0,
        averageProfit: 0,
      };
    }

    const totalRevenue = items.reduce((sum, item) => sum + item.price, 0);
    const totalSales = items.length;
    const averageProfit = totalRevenue / totalSales;

    return {
      totalRevenue,
      totalSales,
      averageProfit,
    };
  } catch (error) {
    console.error('Failed to fetch revenue summary:', error);
    throw error;
  }
}
