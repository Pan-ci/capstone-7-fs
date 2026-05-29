-- ============================================================
-- Migration 003: Add indexes for performance
-- Description : Index tambahan agar query lebih cepat
-- Created     : 2026-05-26
-- ============================================================

-- Index untuk pencarian riwayat prediksi berdasarkan user
CREATE INDEX IF NOT EXISTS idx_prediction_history_user_id
    ON prediction_history (user_id);

-- Index untuk pengurutan berdasarkan waktu pembuatan
CREATE INDEX IF NOT EXISTS idx_prediction_history_created_at
    ON prediction_history (created_at DESC);

-- Index untuk pencarian berdasarkan hasil prediksi
CREATE INDEX IF NOT EXISTS idx_prediction_history_predicted_job
    ON prediction_history (predicted_job);
