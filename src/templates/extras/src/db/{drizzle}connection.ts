import { container } from '@sapphire/framework';
import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';

const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite);

// Inject into container with sapphire (https://www.sapphirejs.dev/docs/Guide/additional-information/using-and-extending-container)
declare module '@sapphire/pieces' {
  interface Container {
    db: BetterSQLite3Database;
  }
}
container.db = db;
