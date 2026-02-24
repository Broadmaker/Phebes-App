import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createSale as createSaleDB, getAllSalesWithItems } from './sales';
import type { NewSale, NewSaleItem } from './types';
import type { SaleWithItems } from './types';
import { generateDailySaleNumbers } from '../utils/salesUtils';

interface SalesContextType {
  sales: (SaleWithItems & { saleNumber: number })[];
  loading: boolean;
  error: string | null;
  addSale: (
    saleData: NewSale,
    items: NewSaleItem[]
  ) => Promise<SaleWithItems & { saleNumber: number }>;
  refreshSales: () => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<(SaleWithItems & { saleNumber: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------
  // Load all sales from DB or cache
  // ------------------------------------
  const loadSales = async () => {
    setLoading(true);
    try {
      const allSales = await getAllSalesWithItems();

      // Generate sale numbers for all sales
      const numberedSales = generateDailySaleNumbers(allSales);

      // Update React state
      setSales(numberedSales);

      // Update global cache
      if (global.SALES_CACHE) {
        global.SALES_CACHE.clear();
        numberedSales.forEach((s) => global.SALES_CACHE.add(s));
      }

      setError(null);
    } catch (err) {
      console.error('Failed to load sales:', err);
      setError('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------
  // Add a new sale
  // ------------------------------------
  const addSale = async (saleData: NewSale, items: NewSaleItem[]) => {
    try {
      // 1. Create sale in DB
      const newSale = await createSaleDB(saleData, items);

      // 2. Ensure the sale is unique (generateDailySaleNumbers expects unique ids)
      const allSales = [...sales, newSale].filter(
        (s, index, self) => index === self.findIndex((t) => t.id === s.id)
      );

      // 3. Regenerate saleNumbers for all sales
      const numberedSales = generateDailySaleNumbers(allSales);

      // 4. Find the newly added sale with its saleNumber
      const numberedNewSale = numberedSales.find((s) => s.id === newSale.id)!;

      // 5. Update state and cache
      setSales(numberedSales);
      if (global.SALES_CACHE) {
        global.SALES_CACHE.add(numberedNewSale);
      }

      return numberedNewSale;
    } catch (err) {
      console.error('Failed to create sale:', err);
      throw err;
    }
  };

  // ------------------------------------
  // Initialize on mount
  // ------------------------------------
  useEffect(() => {
    const initialize = async () => {
      try {
        if (global.SALES_CACHE && global.SALES_CACHE.data.length) {
          // Use cached sales if available
          setSales(global.SALES_CACHE.data);
          setLoading(false);
        } else {
          await loadSales();
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize sales');
        setLoading(false);
      }
    };

    initialize();
  }, []);

  return (
    <SalesContext.Provider
      value={{
        sales,
        loading,
        error,
        addSale,
        refreshSales: loadSales,
      }}>
      {children}
    </SalesContext.Provider>
  );
};

// ------------------------------------
// Hook to use sales context
// ------------------------------------
export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) throw new Error('useSales must be used within a SalesProvider');
  return context;
};
