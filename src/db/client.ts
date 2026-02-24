import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from './migrate';

// Open (or create) the SQLite database
const sqlite = SQLite.openDatabaseSync('app.db');

// IMPORTANT: Enable foreign key support
sqlite.execSync('PRAGMA foreign_keys = ON;');

// Initialize Drizzle ORM client
export const db = drizzle(sqlite);

/**
 * initializeDB()
 * ----------------
 * Initializes the database safely.
 *
 * @param reset - if true, drops tables and resets schema (dev/testing)
 */
export async function initializeDB(reset = false) {
  try {
    if (__DEV__) {
      console.log('Running database migrations...');
      await migrate(reset);
    } else {
      // Production: never reset
      await migrate(false);
    }
  } catch (err) {
    console.error('DB initialization failed:', err);
    throw err;
  }
}

// Optional: auto-run on app startup (recommended for Expo)
initializeDB(false).catch((err) =>
  console.error('DB init error:', err)
);
