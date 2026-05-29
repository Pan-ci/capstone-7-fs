import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

export default function LoginPage() {
    const { login } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await login(form.email, form.password);
            navigate("/");
        } catch (err) {
            setError(
                err?.response?.data?.message || "Login gagal. Periksa email dan password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card glass-card">
                <div className="auth-logo">
                    <span className="text-gradient" style={{ fontSize: "2rem", fontWeight: 800 }}>
                        CareerAI
                    </span>
                </div>

                <h1 className="auth-title">Selamat Datang Kembali</h1>
                <p className="auth-subtitle">Masuk untuk melanjutkan sesi Anda</p>

                {error && (
                    <div className="alert alert-error">
                        <span>⚠️ {error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="nama@email.com"
                            required
                            autoComplete="email"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Masukkan password"
                            required
                            autoComplete="current-password"
                            className="form-input"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                        id="login-submit-btn"
                    >
                        {loading ? (
                            <span className="btn-loading">
                                <span className="spinner-sm" /> Memproses...
                            </span>
                        ) : (
                            "Masuk"
                        )}
                    </button>
                </form>

                <p className="auth-switch">
                    Belum punya akun?{" "}
                    <Link to="/register" className="auth-link">
                        Daftar sekarang
                    </Link>
                </p>
            </div>
        </div>
    );
}
