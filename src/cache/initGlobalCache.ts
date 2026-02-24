/**
 * initGlobalCache.ts
 * --------------------------------------------------------
 * Runtime initializer for global in-memory caches.
 *
 * IMPORTANT:
 * - Import this file ONCE in App.tsx:
 *      import './src/cache/initGlobalCache';
 * - global.d.ts contains only type declarations.
 *
 * Purpose:
 * - Provide fast in-memory access to sales and products.
 * - Reduce repeated database reads.
 * - Maintain simple cache API across the app.
 * --------------------------------------------------------
 */

import { generateDailySaleNumbers } from '../utils/salesUtils';
import type { SaleWithItems } from '../db/types';
import type { ProductType } from '../db/ProductsContext';

/* ========================================================
   SALES CACHE INITIALIZATION
======================================================== */

/**
 * Initializes SALES_CACHE if it does not exist.
 * Prevents overwriting during fast refresh.
 */
if (!global.SALES_CACHE) {
  global.SALES_CACHE = {
    /**
     * In-memory array of sales with guaranteed saleNumbers.
     */
    data: [] as (SaleWithItems & { saleNumber: number })[],

    /**
     * Retrieve a sale by its saleNumber.
     * @param saleNumber - The human-readable sale number.
     */
    getByNumber: function (saleNumber: number) {
      return this.data.find((sale) => sale.saleNumber === saleNumber);
    },

    /**
     * Add a new sale to cache.
     * Ensures every sale has a valid saleNumber.
     * Prevents duplicate sales by ID.
     * Updates saleNumbers safely using generateDailySaleNumbers.
     * @param sale - SaleWithItems to add
     */
add: function (sale: SaleWithItems) {
  // Assign a saleNumber if missing
  if (sale.saleNumber === undefined) {
    const nextNumber =
      this.data.length > 0
        ? Math.max(...this.data.map((s) => s.saleNumber || 0)) + 1
        : 1;
    sale = { ...sale, saleNumber: nextNumber };
  }

  // Avoid duplicates by saleNumber
  const exists = this.data.find((s) => s.saleNumber === sale.saleNumber);
  if (!exists) {
    this.data.push(sale as SaleWithItems & { saleNumber: number });
  }
}
,

    /**
     * Clears all cached sales.
     */
    clear: function () {
      this.data = [];
    },
  };
}

/* ========================================================
   PRODUCTS CACHE INITIALIZATION
======================================================== */

/**
 * Initializes PRODUCTS_CACHE if it does not exist.
 * Prevents overwriting during fast refresh.
 */
if (!global.PRODUCTS_CACHE) {
  global.PRODUCTS_CACHE = {
    /**
     * In-memory array of products.
     */
    data: [] as ProductType[],

    /**
     * Retrieve a product by ID.
     * @param id - Product ID (number)
     */
    getById: function (id: number) {
      return this.data.find((product) => product.id === id);
    },

    /**
     * Add a product to cache.
     * Prevents duplicate product IDs.
     * @param product - Product to add
     */
    add: function (product: ProductType) {
      const exists = this.data.find((p) => p.id === product.id);
      if (!exists) {
        this.data.push(product);
      }
    },

    /**
     * Clears all cached products.
     */
    clear: function () {
      this.data = [];
    },
  };
}

/**
 * Export empty object to ensure this file
 * is treated as a module.
 */
export {};
