// src/db/useProducts.ts
import { useEffect, useState } from 'react';
import type { Product, NewProduct } from './types';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from './products';

/**
 * Custom hook: useProducts
 * ------------------------
 * Handles fetching and managing products in state.
 * Provides methods for CRUD operations including image support.
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load products from the database
   */
const fetchProducts = async () => {
  try {
    setLoading(true);
    const data = await getAllProducts();
    // Normalize null -> undefined for TypeScript safety
    const normalized = data.map(p => ({ ...p, image: p.image ?? undefined }));
    setProducts(normalized);
    setError(null);
  } catch (err) {
    setError('Failed to fetch products.');
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  /**
   * Add a new product
   * @param newProduct - Product data including optional image
   */
  const addProduct = async (newProduct: NewProduct) => {
    try {
      await createProduct(newProduct);
      await fetchProducts(); // refresh state
    } catch (err) {
      console.error('Failed to add product:', err);
      setError('Failed to add product.');
    }
  };

  /**
   * Update an existing product by ID
   * @param id - Product ID
   * @param updatedData - Partial product data including optional image
   */
  const updateProductById = async (id: number, updatedData: Partial<NewProduct>) => {
    try {
      await updateProduct(id, updatedData);
      await fetchProducts();
    } catch (err) {
      console.error('Failed to update product:', err);
      setError('Failed to update product.');
    }
  };

  /**
   * Delete a product by ID
   * @param id - Product ID
   */
  const deleteProductById = async (id: number) => {
    try {
      await deleteProduct(id);
      await fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError('Failed to delete product.');
    }
  };

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct: updateProductById, // renamed for clarity
    deleteProduct: deleteProductById,
    refresh: fetchProducts, // manual refresh
  };
}
