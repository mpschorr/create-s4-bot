import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './connection';

(async () => {
  await migrate(db, { migrationsFolder: './drizzle' });
})();
