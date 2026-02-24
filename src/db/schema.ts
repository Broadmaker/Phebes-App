import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * products table
 * ----------------
 * - id: autoincrement primary key
 * - name: product name
 * - price: product price (REAL)
 * - image: optional image URL
 * - createdAt / updatedAt: timestamps (stored as INTEGER in SQLite)
 */
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  name: text('name').notNull(),

  price: real('price').notNull(),

  image: text('image'), // optional

  // Drizzle uses camelCase in code; SQLite column is snake_case
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .defaultNow(),

  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .defaultNow(),
});


export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Total amount for the sale
  total: real('total').notNull(),

  // Optional fields depending on your POS needs
  paymentMethod: text('payment_method'), // 'cash', 'card', 'upi', etc.
  note: text('note'), // optional cashier notes

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .defaultNow(),

  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .defaultNow(),
});

export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  saleId: integer('sale_id')
    .notNull()
    .references(() => sales.id, { onDelete: 'cascade' }),

  productId: integer('product_id')
    .notNull()
    .references(() => products.id),

  quantity: integer('quantity').notNull(),

  // Price at time of sale (important even if product price changes later)
  unitPrice: real('unit_price').notNull(),

  // quantity * unitPrice
  subtotal: real('subtotal').notNull(),
});

