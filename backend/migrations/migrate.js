// migrations/migrate.js
/**
 * migrate.js — PostgreSQL Migration Runner
 *
 * Cara pakai:
 *   node migrations/migrate.js          → jalankan semua migrasi yang belum dijalankan
 *   node migrations/migrate.js --status → tampilkan status tiap migration
 *   node migrations/migrate.js --reset  → hapus tabel schema_migrations (HATI-HATI!)
 *
 * Tambahkan npm script di package.json:
 *   "migrate": "node migrations/migrate.js"
 */

import dotenv from "dotenv";
dotenv.config();
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Koneksi ke PostgreSQL ────────────────────────────────────────────────────
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

// ── Buat tabel schema_migrations jika belum ada ──────────────────────────────
async function ensureMigrationsTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id         SERIAL      PRIMARY KEY,
            filename   VARCHAR(255) UNIQUE NOT NULL,
            applied_at TIMESTAMP   DEFAULT NOW()
        )
    `);
}

// ── Ambil daftar migration yang sudah dijalankan ─────────────────────────────
async function getAppliedMigrations(client) {
    const { rows } = await client.query(
        "SELECT filename FROM schema_migrations ORDER BY filename"
    );
    return new Set(rows.map((r) => r.filename));
}

// ── Ambil semua file .sql di folder migrations, diurutkan ────────────────────
function getMigrationFiles() {
    return fs
        .readdirSync(__dirname)
        .filter((f) => f.endsWith(".sql"))
        .sort(); // sort alfanumerik → 001_, 002_, 003_, …
}

// ── Jalankan satu migration ───────────────────────────────────────────────────
async function applyMigration(client, filename) {
    const filePath = path.join(__dirname, filename);
    const sql = fs.readFileSync(filePath, "utf-8");

    console.log(`  ⏳  Applying: ${filename}`);
    await client.query("BEGIN");
    try {
        await client.query(sql);
        await client.query(
            "INSERT INTO schema_migrations (filename) VALUES ($1)",
            [filename]
        );
        await client.query("COMMIT");
        console.log(`  ✅  Applied : ${filename}`);
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(`  ❌  Failed  : ${filename} — ${err.message}`);
        throw err;
    }
}

// ── Tampilkan status semua migration ─────────────────────────────────────────
async function showStatus(client, applied) {
    const files = getMigrationFiles();
    console.log("\n📋  Migration Status:");
    console.log("─".repeat(55));
    if (files.length === 0) {
        console.log("   (tidak ada file migration .sql)");
    }
    for (const f of files) {
        const status = applied.has(f) ? "✅ applied" : "⏳ pending";
        console.log(`   ${status}  ${f}`);
    }
    console.log("─".repeat(55));
}

// ── Entry point ───────────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    const client = await pool.connect();

    try {
        await ensureMigrationsTable(client);
        const applied = await getAppliedMigrations(client);

        // ── --status ──
        if (args.includes("--status")) {
            await showStatus(client, applied);
            return;
        }

        // ── --reset (hapus tabel pelacak, BUKAN data) ──
        if (args.includes("--reset")) {
            await client.query("DROP TABLE IF EXISTS schema_migrations");
            console.log("⚠️  schema_migrations table dropped. Jalankan ulang untuk re-apply semua migrasi.");
            return;
        }

        // ── Jalankan semua migration yang pending ──
        const files = getMigrationFiles();
        const pending = files.filter((f) => !applied.has(f));

        console.log("\n🚀  PostgreSQL Migration Runner");
        console.log("─".repeat(55));
        console.log(`   Total files  : ${files.length}`);
        console.log(`   Already done : ${applied.size}`);
        console.log(`   Pending      : ${pending.length}`);
        console.log("─".repeat(55));

        if (pending.length === 0) {
            console.log("\n✅  Semua migrasi sudah up-to-date. Tidak ada yang perlu dijalankan.\n");
            return;
        }

        for (const filename of pending) {
            await applyMigration(client, filename);
        }

        console.log("\n🎉  Semua migrasi berhasil dijalankan!\n");
    } catch (err) {
        console.error("\n❌  Migration gagal:", err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
