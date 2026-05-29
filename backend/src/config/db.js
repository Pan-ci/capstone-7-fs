import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
import { logger } from "../utils/logger.js";

const isProd = process.env.NODE_ENV === "production";
const requiredVars = ["PGHOST", "PGDATABASE", "PGUSER", "PGPASSWORD"];

if (isProd) {
    requiredVars.forEach((name) => {
        if (!process.env[name]) {
            throw new Error(`${name} must be set in production environment`);
        }
    });
}

const { Pool } = pg;

const pool = new Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || "capstone_db",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on("connect", () => {
    logger.info("DB", null, "PostgreSQL connected.");
});

pool.on("error", (err) => {
    logger.error("[DB] Unexpected PostgreSQL error:", err.message);
});

export default pool;
