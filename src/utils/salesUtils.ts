import type { SaleWithItems } from '../db/types';

/**
 * Assigns daily-reset sale numbers to sales.
 * -----------------------------
 * For each day, sales are numbered starting from 1 in chronological order.
 *
 * Works correctly even if sales are cached or new sales are added.
 *
 * @param sales Array of SaleWithItems
 * @returns Array of SaleWithItems with `saleNumber` populated
 */
export function generateDailySaleNumbers(
  sales: SaleWithItems[]
): (SaleWithItems & { saleNumber: number })[] {
  if (!sales || sales.length === 0) return [];

  // 1️⃣ Sort all sales ascending by creation time first
  const sortedSales = [...sales].sort((a, b) => a.createdAt - b.createdAt);

  // 2️⃣ Group sales by day (YYYY-MM-DD)
  const salesByDay: Record<string, SaleWithItems[]> = {};
  sortedSales.forEach((sale) => {
    const date = new Date(sale.createdAt);
const dateKey =
  date.getFullYear() +
  '-' +
  String(date.getMonth() + 1).padStart(2, '0') +
  '-' +
  String(date.getDate()).padStart(2, '0');

    if (!salesByDay[dateKey]) salesByDay[dateKey] = [];
    salesByDay[dateKey].push(sale);
  });

  // 3️⃣ Assign daily sale numbers
  const result: (SaleWithItems & { saleNumber: number })[] = [];
  Object.keys(salesByDay)
    .sort() // ensures days are processed oldest → newest
    .forEach((dateKey) => {
      const dailySales = salesByDay[dateKey];
      dailySales.forEach((sale, index) => {
        result.push({
          ...sale,
          saleNumber: index + 1, // daily reset starting at 1
        });
      });
    });

  // 4️⃣ Return array sorted descending by createdAt (newest first) for UI
  return result.sort((a, b) => b.createdAt - a.createdAt);
}
