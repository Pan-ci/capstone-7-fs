-- ============================================================
-- Migration 002: Create prediction_history table
-- Description : Tabel riwayat prediksi pekerjaan (terhubung ke users)
-- Created     : 2026-05-26
-- ============================================================

CREATE TABLE IF NOT EXISTS prediction_history (
    id               VARCHAR(60)  PRIMARY KEY,
    user_id          INTEGER      REFERENCES users(id) ON DELETE CASCADE,
    summary          TEXT         NOT NULL,
    experience_desc  TEXT         NOT NULL,
    years_experience FLOAT        NOT NULL,
    predicted_job    VARCHAR(100),
    confidence       FLOAT,
    low_confidence   BOOLEAN,
    prediction_gap   FLOAT,
    top_predictions  JSONB,
    probabilities    JSONB,
    created_at       TIMESTAMP    DEFAULT NOW()
);
