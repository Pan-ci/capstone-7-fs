-- migrations/001_create_users.sql
-- ============================================================
-- Migration 001: Create users table
-- Description : Tabel autentikasi pengguna aplikasi
-- Created     : 2026-05-26
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  UNIQUE NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    created_at    TIMESTAMP     DEFAULT NOW()
);
