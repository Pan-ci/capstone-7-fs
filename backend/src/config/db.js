import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
import { logger } from "../utils/logger.js";

const isProd = process.env.NODE_ENV === "production";
const requiredVars = ["DATABASE_URL"];

if (isProd) {
    requiredVars.forEach((name) => {
        if (!process.env[name]) {
            throw new Error(`${name} must be set in production environment`);
        }
    });
}

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

const pool = new Pool(poolConfig);

pool.on("connect", () => {
    logger.info("DB", null, "PostgreSQL connected.");
});

pool.on("error", (err) => {
    logger.error("[DB] Unexpected PostgreSQL error:", err.message);
});

export default pool;
