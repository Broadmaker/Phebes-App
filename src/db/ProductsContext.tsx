// src/db/ProductsContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { eq, sql } from 'drizzle-orm';
import { db } from './client';
import { products as productsTable } from './schema';

/**
 * ProductType
 * ----------------
 * Represents a single product in the database
 */
export interface ProductType {
  id: number;
  name: string;
  price: number;
  image?: string | null;
  createdAt: number; // Unix timestamp in ms
  updatedAt: number; // Unix timestamp in ms
}

/**
 * DeleteResult
 * ----------------
 * Result returned by deleteProduct to indicate success or failure
 */
export type DeleteResult = {
  success: boolean;
  message?: string;
};

/**
 * ProductsContextType
 * --------------------
 * Exposed context for components to access products
 */
interface ProductsContextType {
  products: ProductType[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<ProductType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (
    id: number,
    product: Partial<Omit<ProductType, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  deleteProduct: (id: number) => Promise<DeleteResult>;
  refresh: () => Promise<void>;
}

/** Default context with empty implementations */
const ProductsContext = createContext<ProductsContextType>({
  products: [],
  loading: true,
  error: null,
  addProduct: async () => {},
  updateProduct: async () => {},
  deleteProduct: async () => ({ success: false }),
  refresh: async () => {},
});

/**
 * ProductsProvider
 * -----------------
 * Wrap your app with this provider to share products state across screens
 */
export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load products from the database
   */
  const loadProducts = async () => {
    try {
      setLoading(true);

      const rows = await db
        .select()
        .from(productsTable)
        .orderBy(sql`${productsTable.createdAt} DESC`)
        .all();

      const formatted: ProductType[] = rows.map((p) => ({
        ...p,
        createdAt: p.createdAt instanceof Date ? p.createdAt.getTime() : p.createdAt,
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt.getTime() : p.updatedAt,
      }));

      setProducts(formatted);

      // Use the global cache helper instead
      if (global.PRODUCTS_CACHE) {
        global.PRODUCTS_CACHE.clear();
        formatted.forEach((p) => global.PRODUCTS_CACHE.add(p));
      }

      setError(null);
    } catch (err) {
      console.error('Failed to load products', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new product
   * @param product Product data (name, price, optional image)
   */
  const addProduct = async (product: Omit<ProductType, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date();
      await db.insert(productsTable).values({
        name: product.name,
        price: product.price,
        image: product.image ?? null,
        createdAt: now,
        updatedAt: now,
      });

      await loadProducts();
    } catch (err) {
      console.error('Failed to add product', err);
    }
  };

  /**
   * Update an existing product
   * @param id Product ID
   * @param product Partial product data to update
   */
  const updateProduct = async (
    id: number,
    product: Partial<Omit<ProductType, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    try {
      const now = new Date();
      await db
        .update(productsTable)
        .set({
          ...product,
          updatedAt: now,
        })
        .where(eq(productsTable.id, id));
      await loadProducts();
    } catch (err) {
      console.error('Failed to update product', err);
    }
  };

  /**
   * Delete a product
   * Returns a DeleteResult to indicate success/failure
   * @param id Product ID to delete
   */
  /** Delete product safely with FK check */
  /** Delete product safely with FK check */
  const deleteProduct = async (id: number): Promise<DeleteResult> => {
    try {
      // Wrap the native call in try/catch
      try {
        await db.delete(productsTable).where(eq(productsTable.id, id));
      } catch (err: any) {
        // If FK violation, swallow the native error and return friendly result
        if (err?.message?.includes('FOREIGN KEY constraint failed')) {
          return {
            success: false,
            message:
              'This product cannot be deleted because it is used in existing sales or orders.',
          };
        }

        // For any other errors, still return failure
        return {
          success: false,
          message: 'Failed to delete product.',
        };
      }

      // Refresh products list
      await loadProducts();

      return { success: true };
    } catch (err) {
      // This outer catch is just for safety — should rarely be hit
      console.error('Unexpected error in deleteProduct', err);
      return { success: false, message: 'Unexpected error deleting product.' };
    }
  };

  /**
   * Manually refresh products
   */
  const refresh = async () => {
    await loadProducts();
  };

  /** Load products on mount */
  useEffect(() => {
    const initialize = async () => {
      try {
        if (global.PRODUCTS_CACHE && global.PRODUCTS_CACHE.data.length > 0) {
          setProducts(global.PRODUCTS_CACHE.data);
          setLoading(false);
        } else {
          await loadProducts();
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize products');
        setLoading(false);
      }
    };

    initialize();
  }, []);

  return (
    <ProductsContext.Provider
      value={{
        products,
        loading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        refresh,
      }}>
      {children}
    </ProductsContext.Provider>
  );
};

/**
 * Hook to access the products context
 */
export const useProducts = () => useContext(ProductsContext);
