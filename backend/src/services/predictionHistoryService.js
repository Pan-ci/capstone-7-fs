// Service riwayat prediksi menggunakan PostgreSQL

import pool from "../config/db.js";
import { logger } from "../utils/logger.js";

/**
 * Simpan prediksi baru ke database
 * @param {number|null} userId
 * @param {object} inputData — { summary, experience_desc, years_experience }
 * @param {object} resultData — { predicted_job, confidence, low_confidence, prediction_gap, top_predictions, probabilities }
 * @returns {object} Record yang tersimpan
 */
export const savePrediction = async (userId, inputData, resultData) => {
    const id = `pred_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const query = `
        INSERT INTO prediction_history (
            id, user_id, summary, experience_desc, years_experience,
            predicted_job, confidence, low_confidence, prediction_gap,
            top_predictions, probabilities
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
    `;

    const values = [
        id,
        userId || null,
        inputData.summary || "",
        inputData.experience_desc || "",
        Number(inputData.years_experience) || 0,
        resultData.predicted_job,
        resultData.confidence,
        resultData.low_confidence,
        resultData.prediction_gap,
        JSON.stringify(resultData.top_predictions),
        JSON.stringify(resultData.probabilities),
    ];

    const result = await pool.query(query, values);
    const record = result.rows[0];
    logger.info("HistoryService", null, `Saved prediction ${record.id}`);
    return record;
};

/**
 * Ambil semua riwayat prediksi (dengan filter opsional per user)
 * @param {number|null} userId — jika null, ambil semua (admin)
 * @returns {Array}
 */
export const getAllPredictions = async (userId = null) => {
    let query = `
        SELECT ph.*, u.name as user_name, u.email as user_email
        FROM prediction_history ph
        LEFT JOIN users u ON ph.user_id = u.id
    `;
    const values = [];

    if (userId) {
        query += " WHERE ph.user_id = $1";
        values.push(userId);
    }

    query += " ORDER BY ph.created_at DESC";

    const result = await pool.query(query, values);
    return result.rows;
};

/**
 * Ambil satu prediksi berdasarkan ID
 * @param {string} id
 * @param {number|null} userId — jika ada, pastikan milik user ini
 * @returns {object|null}
 */
export const getPredictionById = async (id, userId = null) => {
    let query = "SELECT * FROM prediction_history WHERE id = $1";
    const values = [id];

    if (userId) {
        query += " AND user_id = $2";
        values.push(userId);
    }

    const result = await pool.query(query, values);
    return result.rows[0] || null;
};

/**
 * Hapus satu prediksi berdasarkan ID
 * @param {string} id
 * @param {number|null} userId
 * @returns {boolean}
 */
export const deletePredictionById = async (id, userId = null) => {
    let query = "DELETE FROM prediction_history WHERE id = $1";
    const values = [id];

    if (userId) {
        query += " AND user_id = $2";
        values.push(userId);
    }

    const result = await pool.query(query, values);
    const deleted = result.rowCount > 0;
    if (deleted) logger.info("HistoryService", null, `Deleted prediction ${id}`);
    return deleted;
};

/**
 * Hapus semua prediksi milik user
 * @param {number|null} userId — jika null, hapus semua (admin)
 * @returns {number} jumlah yang dihapus
 */
export const deleteAllPredictions = async (userId = null) => {
    let query = "DELETE FROM prediction_history";
    const values = [];

    if (userId) {
        query += " WHERE user_id = $1";
        values.push(userId);
    }

    query += " RETURNING id";

    const result = await pool.query(query, values);
    const count = result.rowCount;
    logger.info("HistoryService", null, `Cleared ${count} prediction(s).`);
    return count;
};
