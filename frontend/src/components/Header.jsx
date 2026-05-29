import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaBullseye,
    FaUser,
    FaSignOutAlt,
    FaSignInAlt,
    FaBars,
    FaTimes,
    FaSearch,
    FaTable,
    FaMoon,
    FaSun,
    FaGlobeAsia,
} from 'react-icons/fa';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { apiUrl } from '../config/api';

const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const { theme, toggleTheme } = useTheme();
    const { lang, toggleLanguage, t } = useLanguage();
    const { user, isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();

    // Health check silent
    useEffect(() => {
        const checkHealth = async () => {
            try {
                await axios.get(apiUrl('/api/health'), { timeout: 4000 });
                try { await axios.get(apiUrl('/api/model/health'), { timeout: 4000 }); }
                catch { /* silent */ }
            } catch { /* silent */ }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    // Tutup menu saat klik di luar
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    // Kunci scroll body saat mobile menu terbuka
    useEffect(() => {
        const isMobile = window.innerWidth < 641;
        document.body.style.overflow = (menuOpen && isMobile) ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    // Tutup menu saat resize ke desktop
    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 641) setMenuOpen(false);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const handleLogout = () => {
        setMenuOpen(false);
        logout();
        navigate('/login');
    };

    const closeMenu = () => setMenuOpen(false);

    const scrollToTab = (tabId) => {
        closeMenu();
        const el = document.getElementById(tabId);
        if (el) {
            el.click();
            setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
        }
    };

    // ── Desktop: Auth section ────────────────────────────────────────────────
    const DesktopAuth = () => (
        isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '999px',
                        background: 'var(--status-bg)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.85rem',
                        color: 'var(--text-main)',
                        maxWidth: 180,
                    }}
                    title={user?.email}
                >
                    <FaUser style={{ color: 'var(--accent)', fontSize: '0.78rem', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.name}
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{ padding: '0.38rem 0.8rem', borderRadius: '999px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    title="Keluar"
                    id="logout-btn"
                >
                    <FaSignOutAlt />
                    <span>Keluar</span>
                </button>
            </div>
        ) : (
            <Link
                to="/login"
                className="btn btn-primary"
                style={{ padding: '0.38rem 1rem', borderRadius: '999px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                id="login-header-btn"
            >
                <FaSignInAlt />
                <span>Masuk</span>
            </Link>
        )
    );

    return (
        <header className="header-bar">

            {/* ── Logo ── */}
            <div className="logo">
                <span className="text-gradient"><FaBullseye /></span>
                <span>Ready to Perform<span className="logo-badge">AI</span></span>
            </div>

            {/* ══════════════════════════════════════════════
                DESKTOP (≥641px): tombol biasa seperti semula
                ══════════════════════════════════════════════ */}
            <div className="header-controls-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Bahasa */}
                <button
                    onClick={toggleLanguage}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 'bold' }}
                    title="Ubah Bahasa / Change Language"
                    id="toggle-language-btn"
                >
                    {lang === 'id' ? 'ID' : 'EN'}
                </button>

                {/* Tema */}
                <button
                    onClick={toggleTheme}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '1.2rem' }}
                    title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                    id="toggle-theme-btn"
                >
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>

                {/* Auth */}
                <DesktopAuth />
            </div>

            {/* ══════════════════════════════════════════════
                MOBILE (≤640px): nama user + hamburger ☰
                ══════════════════════════════════════════════ */}
            <div className="header-mobile-right">
                {/* Nama user singkat */}
                {isLoggedIn && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.28rem 0.65rem',
                            borderRadius: '999px',
                            background: 'var(--status-bg)',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.8rem',
                            color: 'var(--text-main)',
                            maxWidth: 120,
                        }}
                        title={user?.email}
                    >
                        <FaUser style={{ color: 'var(--accent)', fontSize: '0.7rem', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.name}
                        </span>
                    </div>
                )}

                {/* Hamburger — hanya mobile */}
                <div className="nav-menu-wrapper" ref={menuRef}>
                    <button
                        className="hamburger-btn"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        aria-label={menuOpen ? 'Tutup menu' : 'Buka menu navigasi'}
                        aria-expanded={menuOpen}
                        id="hamburger-btn"
                    >
                        {menuOpen ? <FaTimes /> : <FaBars />}
                    </button>

                    {menuOpen && (
                        <>
                            {/* Overlay gelap */}
                            <div className="nav-overlay" onClick={closeMenu} aria-hidden="true" />

                            {/* Slide-in panel */}
                            <nav
                                className="nav-dropdown"
                                role="dialog"
                                aria-modal="true"
                                aria-label="Menu navigasi"
                            >
                                <div className="nav-dropdown-header">
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                                        Menu
                                    </span>
                                    <button className="nav-close-btn" onClick={closeMenu} aria-label="Tutup menu">
                                        <FaTimes />
                                    </button>
                                </div>

                                {/* Fitur */}
                                <div className="nav-section">
                                    <p className="nav-section-label">Fitur</p>
                                    <button className="nav-item" onClick={() => scrollToTab('tab-single')} id="nav-single">
                                        <FaSearch className="nav-item-icon" />
                                        <div>
                                            <div className="nav-item-title">{t('tab_single') || 'Prediksi Tunggal'}</div>
                                            <div className="nav-item-desc">Analisis profil satu per satu</div>
                                        </div>
                                    </button>
                                    <button className="nav-item" onClick={() => scrollToTab('tab-batch')} id="nav-batch">
                                        <FaTable className="nav-item-icon" />
                                        <div>
                                            <div className="nav-item-title">{t('tab_batch') || 'Prediksi Batch'}</div>
                                            <div className="nav-item-desc">Upload CSV / XLSX massal</div>
                                        </div>
                                    </button>
                                </div>

                                <div className="nav-divider" />

                                {/* Pengaturan */}
                                <div className="nav-section">
                                    <p className="nav-section-label">Pengaturan</p>
                                    <button className="nav-item" onClick={toggleLanguage} id="nav-lang">
                                        <FaGlobeAsia className="nav-item-icon" />
                                        <div>
                                            <div className="nav-item-title">{lang === 'id' ? 'Bahasa Indonesia' : 'English'}</div>
                                            <div className="nav-item-desc">Ganti bahasa antarmuka</div>
                                        </div>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', padding: '0.12rem 0.45rem', borderRadius: '999px', background: 'rgba(99,102,241,0.12)', color: 'var(--accent)', fontWeight: 700 }}>
                                            {lang === 'id' ? 'ID' : 'EN'}
                                        </span>
                                    </button>
                                    <button className="nav-item" onClick={toggleTheme} id="nav-theme">
                                        {theme === 'dark'
                                            ? <FaSun className="nav-item-icon" style={{ color: '#f59e0b' }} />
                                            : <FaMoon className="nav-item-icon" style={{ color: '#6366f1' }} />
                                        }
                                        <div>
                                            <div className="nav-item-title">{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</div>
                                            <div className="nav-item-desc">Ubah tampilan tema</div>
                                        </div>
                                    </button>
                                </div>

                                <div className="nav-divider" />

                                {/* Akun */}
                                <div className="nav-section">
                                    <p className="nav-section-label">Akun</p>
                                    {isLoggedIn ? (
                                        <>
                                            <div className="nav-item" style={{ cursor: 'default' }}>
                                                <FaUser className="nav-item-icon" style={{ color: 'var(--accent)' }} />
                                                <div>
                                                    <div className="nav-item-title">{user?.name}</div>
                                                    <div className="nav-item-desc">{user?.email}</div>
                                                </div>
                                            </div>
                                            <button className="nav-item nav-item-danger" onClick={handleLogout} id="nav-logout">
                                                <FaSignOutAlt className="nav-item-icon" />
                                                <div>
                                                    <div className="nav-item-title">Keluar</div>
                                                    <div className="nav-item-desc">Akhiri sesi Anda</div>
                                                </div>
                                            </button>
                                        </>
                                    ) : (
                                        <Link to="/login" className="nav-item" onClick={closeMenu} id="nav-login">
                                            <FaSignInAlt className="nav-item-icon" style={{ color: 'var(--accent)' }} />
                                            <div>
                                                <div className="nav-item-title">Masuk</div>
                                                <div className="nav-item-desc">Login ke akun Anda</div>
                                            </div>
                                        </Link>
                                    )}
                                </div>

                                <div className="nav-dropdown-footer">
                                    <span>Ready to Perform AI</span>
                                </div>
                            </nav>
                        </>
                    )}
                </div>
            </div>

        </header>
    );
};

export default Header;