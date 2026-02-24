import { db } from './client';
import { sales, saleItems, products } from './schema';
import { eq, inArray } from 'drizzle-orm';
import type { NewSale, NewSaleItem, SaleWithItems } from './types';

// Helper: convert date to timestamp
function convertToTimestamp(value?: number | Date): number {
  if (!value) return Date.now();
  return value instanceof Date ? value.getTime() : value;
}

// Helper: normalize sale for frontend
function normalizeSaleRow(sale: any, items: SaleWithItems['items'] = []): SaleWithItems {
  return {
    ...sale,
    createdAt: convertToTimestamp(sale.createdAt),
    updatedAt: convertToTimestamp(sale.updatedAt),
    items,
  };
}

// -----------------------------
// CREATE SALE
// -----------------------------
export async function createSale(
  saleData: NewSale,
  items: NewSaleItem[]
): Promise<SaleWithItems> {
  return db.transaction(async (trx) => {
    const now = new Date();

    // Insert sale
    const insertResult = await trx.insert(sales).values({
      ...saleData,
      createdAt: now,
      updatedAt: now,
    });

    const saleId = Number(insertResult.lastInsertRowId);
    if (!saleId) throw new Error('Failed to get sale ID after insert');

    // Insert sale items (ensure numbers)
    const itemsToInsert = items.map((i) => ({
      saleId,
      productId: Number(i.productId),
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      subtotal: Number(i.unitPrice) * Number(i.quantity),
    }));

    await trx.insert(saleItems).values(itemsToInsert);

    // Fetch inserted sale
    const insertedSale = await trx.select().from(sales).where(eq(sales.id, saleId)).then(r => r[0]);
    if (!insertedSale) throw new Error('Sale not found after insert');

    // Fetch product names
    const productIds = itemsToInsert.map(i => i.productId);
    const productsRows = await trx.select().from(products).where(inArray(products.id, productIds));
    const productsMap = new Map(productsRows.map(p => [p.id, p.name]));

    const detailedItems: SaleWithItems['items'] = itemsToInsert.map(i => ({
      productId: i.productId,
      productName: productsMap.get(i.productId) ?? 'Unknown',
      quantity: i.quantity,
      subtotal: i.subtotal,
    }));

    return normalizeSaleRow(insertedSale, detailedItems);
  });
}

// -----------------------------
// GET ALL SALES WITH ITEMS
// -----------------------------
export async function getAllSalesWithItems(): Promise<SaleWithItems[]> {
  const allSales = await db.select().from(sales);
  const allItems = await db.select().from(saleItems);
  const allProducts = await db.select().from(products);

  return allSales.map(sale => {
    const detailedItems = allItems
      .filter(i => i.saleId === sale.id)
      .map(i => {
        const product = allProducts.find(p => p.id === i.productId);
        return {
          productId: i.productId,
          productName: product?.name ?? 'Unknown',
          quantity: i.quantity,
          subtotal: i.subtotal,
        };
      });

    return normalizeSaleRow(sale, detailedItems);
  });
}
