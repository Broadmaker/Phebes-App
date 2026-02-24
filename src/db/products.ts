import { db } from './client';
import { products } from './schema';
import { eq } from 'drizzle-orm';
import type { Product, NewProduct } from './types';

/**
 * Convert Drizzle timestamp (Date or number) to number (milliseconds)
 */
function convertToTimestamp(value: Date | number): number {
  return value instanceof Date ? value.getTime() : value;
}

/**
 * Get all products
 */
export async function getAllProducts(): Promise<Product[]> {
  const result = await db.select().from(products);

  return result.map(
    (product): Product => ({
      ...product,
      createdAt: convertToTimestamp(product.createdAt),
      updatedAt: convertToTimestamp(product.updatedAt),
    })
  );
}

/**
 * Get a product by ID
 */
export async function getProductById(id: number): Promise<Product | null> {
  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

  if (result.length === 0) return null;

  const product = result[0];

  return {
    ...product,
    createdAt: convertToTimestamp(product.createdAt),
    updatedAt: convertToTimestamp(product.updatedAt),
  };
}

/**
 * Create a new product
 */
export async function createProduct(data: NewProduct): Promise<void> {
  // For INTEGER timestamp columns, Drizzle automatically sets defaultNow() if undefined
  await db.insert(products).values(data);
}

/**
 * Update a product by ID
 */
export async function updateProduct(
  id: number,
  data: Partial<NewProduct>
): Promise<void> {
  await db
    .update(products)
    .set({
      ...data,
      // Pass Date object — Drizzle converts to INTEGER for timestamp columns
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));
}

/**
 * Delete a product by ID
 */
export async function deleteProduct(id: number): Promise<void> {
  await db.delete(products).where(eq(products.id, id));
}
