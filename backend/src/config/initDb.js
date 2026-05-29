// Script untuk menginisialisasi tabel PostgreSQL
// Jalankan: node src/config/initDb.js

import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import pool from "./db.js";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, "schema.sql");
const sql = readFileSync(schemaPath, "utf-8");

try {
    await pool.query(sql);
    logger.info("InitDb", null, "Database schema initialized successfully!");
    logger.info("InitDb", null, "Tables created: users, prediction_history");
} catch (err) {
    logger.error("InitDb", null, "Failed to initialize database:", err.message);
} finally {
    await pool.end();
}
