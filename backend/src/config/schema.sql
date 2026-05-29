-- ======================================
-- Capstone Project — PostgreSQL Schema
-- ======================================

-- Tabel Users untuk autentikasi
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel riwayat prediksi (terhubung ke user)
CREATE TABLE IF NOT EXISTS prediction_history (
    id VARCHAR(60) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    experience_desc TEXT NOT NULL,
    years_experience FLOAT NOT NULL,
    predicted_job VARCHAR(100),
    confidence FLOAT,
    low_confidence BOOLEAN,
    prediction_gap FLOAT,
    top_predictions JSONB,
    probabilities JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
