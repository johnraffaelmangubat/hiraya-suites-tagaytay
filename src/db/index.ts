import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not defined. Add it to your .env.local file."
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __hirayaPostgresPool?: Pool;
};

export const pool =
  globalForDb.__hirayaPostgresPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__hirayaPostgresPool = pool;
}

pool.on("error", (error) => {
  console.error("[PostgreSQL Pool Error]", error);
});

export const db = drizzle({
  client: pool,
});
