// Service untuk autentikasi user menggunakan PostgreSQL

import pool from "../config/db.js";
import bcrypt from "bcryptjs";

/**
 * Daftarkan user baru
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {object} User yang tersimpan (tanpa password)
 */
export const registerUser = async (name, email, password) => {
    // Cek apakah email sudah terdaftar
    const existing = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
    );
    if (existing.rows.length > 0) {
        throw new Error("Email sudah terdaftar. Gunakan email lain.");
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Simpan user
    const result = await pool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, created_at`,
        [name, email, password_hash]
    );

    return result.rows[0];
};

/**
 * Login user — validasi email + password
 * @param {string} email
 * @param {string} password
 * @returns {object} User data (tanpa password)
 */
export const loginUser = async (email, password) => {
    const result = await pool.query(
        "SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1",
        [email]
    );

    if (result.rows.length === 0) {
        throw new Error("Email atau password salah.");
    }

    const user = result.rows[0];

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
        throw new Error("Email atau password salah.");
    }

    // Kembalikan user tanpa password_hash
    const { password_hash, ...userSafe } = user;
    return userSafe;
};

/**
 * Ambil user berdasarkan ID
 * @param {number} id
 * @returns {object|null}
 */
export const getUserById = async (id) => {
    const result = await pool.query(
        "SELECT id, name, email, created_at FROM users WHERE id = $1",
        [id]
    );
    return result.rows[0] || null;
};
