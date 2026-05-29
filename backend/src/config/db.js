import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
import { logger } from "../utils/logger.js";

const isProd = process.env.NODE_ENV === "production";

const { Pool } = pg;

const poolConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
          host: process.env.PGHOST || "localhost",
          port: Number(process.env.PGPORT) || 5432,
          database: process.env.PGDATABASE || "capstone_db",
          user: process.env.PGUSER || "postgres",
          password: process.env.PGPASSWORD || "",
      };

const useSsl = process.env.DB_SSL === "true" || process.env.DB_SSL === "1";
if (useSsl) {
    poolConfig.ssl = { rejectUnauthorized: false };
}

// Log which config is being used (avoid printing secrets)
if (process.env.DATABASE_URL) {
    logger.info("DB", null, "Using DATABASE_URL for PostgreSQL connection");
} else {
    logger.info("DB", null, `Using direct PG config host=${poolConfig.host} port=${poolConfig.port} database=${poolConfig.database} user=${poolConfig.user}`);
}
if (useSsl) {
    logger.info("DB", null, "DB SSL is enabled (rejectUnauthorized=false)");
}

const pool = new Pool(poolConfig);

pool.on("connect", () => {
    logger.info("DB", null, "PostgreSQL connected.");
});

pool.on("error", (err) => {
    logger.error("[DB] Unexpected PostgreSQL error:", err.message);
});

export default pool;
