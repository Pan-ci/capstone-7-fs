import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (form.password !== form.confirm) {
            return setError("Password dan konfirmasi password tidak cocok.");
        }
        if (form.password.length < 6) {
            return setError("Password minimal 6 karakter.");
        }

        setLoading(true);
        try {
            await register(form.name, form.email, form.password);
            navigate("/");
        } catch (err) {
            setError(
                err?.response?.data?.message || "Registrasi gagal. Coba lagi."
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

                <h1 className="auth-title">Buat Akun Baru</h1>
                <p className="auth-subtitle">Daftar untuk menyimpan riwayat prediksi Anda</p>

                {error && (
                    <div className="alert alert-error">
                        <span>⚠️ {error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="reg-name">Nama Lengkap</label>
                        <input
                            id="reg-name"
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Nama Anda"
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-email">Email</label>
                        <input
                            id="reg-email"
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
                        <label htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Minimal 6 karakter"
                            required
                            autoComplete="new-password"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-confirm">Konfirmasi Password</label>
                        <input
                            id="reg-confirm"
                            type="password"
                            name="confirm"
                            value={form.confirm}
                            onChange={handleChange}
                            placeholder="Ulangi password"
                            required
                            autoComplete="new-password"
                            className="form-input"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                        id="register-submit-btn"
                    >
                        {loading ? (
                            <span className="btn-loading">
                                <span className="spinner-sm" /> Mendaftarkan...
                            </span>
                        ) : (
                            "Daftar"
                        )}
                    </button>
                </form>

                <p className="auth-switch">
                    Sudah punya akun?{" "}
                    <Link to="/login" className="auth-link">
                        Masuk di sini
                    </Link>
                </p>
            </div>
        </div>
    );
}
