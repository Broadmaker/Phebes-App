/**
 * migrate(reset = false)
 */
export async function migrate(db: any, reset = false) {
  try {
    if (reset) {
      console.log('Dropping existing tables (dev reset)...');

      await db.run(`DROP TABLE IF EXISTS sale_items;`);
      await db.run(`DROP TABLE IF EXISTS sales;`);
      await db.run(`DROP TABLE IF EXISTS products;`);
    }

    await db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        image TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total REAL NOT NULL,
        payment_method TEXT,
        note TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
      );
    `);

    await db.run(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);

    console.log(`Migration complete${reset ? ' (reset)' : ''}: POS tables ready ✅`);
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  }
}

/**
 * migrateIfNeeded()
 */
export async function migrateIfNeeded(db: any) {
  try {
    if (__DEV__) {
      console.log('Development environment detected. Resetting tables...');
      await migrate(db, true);
      return;
    }

    const productsTable = await db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='products';`
    );

    if (!productsTable) {
      console.log('POS tables missing. Running safe migration for production...');
      await migrate(db, false);
    } else {
      console.log('POS tables exist. No migration needed ✅');
    }
  } catch (err) {
    console.error('Auto-migration failed:', err);
    throw err;
  }
}