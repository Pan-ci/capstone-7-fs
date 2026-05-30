import React, { useState, useEffect } from 'react';
import { FaSearch, FaSpinner, FaChartBar, FaBriefcase, FaFileAlt, FaUserTie, FaClipboardList } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../config/api';

const PredictionForm = () => {
    const [formData, setFormData] = useState({
        experience_desc: '',
        summary: '',
        years_experience: ''
    });

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        setFormData({
            experience_desc: '',
            summary: '',
            years_experience: ''
        });

        setResult(null);
        setError(null);
    }, []);

    const { t } = useLanguage();

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Kirim field terpisah sesuai skema FastAPI
            const dataToSubmit = {
                summary: formData.summary.trim(),
                experience_desc: formData.experience_desc.trim(),
                years_experience: parseFloat(formData.years_experience) || 0,
            };

            const res = await api.post('/api/predictions', dataToSubmit);
            if (res.data && res.data.data) {
                setResult(res.data.data);
            } else {
                setResult(res.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.detail || err.message || "Gagal menghubungi server");
        } finally {
            setLoading(false);
        }
    };

    // Format label agar lebih readable
    const formatLabel = (label) => {
        return label
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    };

    // Warna gradient untuk setiap bar probabilitas
    const getBarColor = (index) => {
        const colors = [
            'linear-gradient(90deg, #6366f1, #818cf8)',
            'linear-gradient(90deg, #a855f7, #c084fc)',
            'linear-gradient(90deg, #ec4899, #f472b6)',
            'linear-gradient(90deg, #10b981, #34d399)',
            'linear-gradient(90deg, #f59e0b, #fbbf24)',
            'linear-gradient(90deg, #3b82f6, #60a5fa)',
        ];
        return colors[index % colors.length];
    };

    // Confidence percentage
    const confidencePercent = result?.confidence ? (result.confidence * 100).toFixed(1) : 0;

    return (
        <div className="glass-panel">
            <div className="panel-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaFileAlt style={{ color: 'var(--accent)' }} /> {t('job_prediction')}
                </h2>
                <span className="tag" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>🤖 {t('ai_mode')}</span>
            </div>

            <form onSubmit={handleSubmit}>
                {/* === BAGIAN 1: Rangkuman CV === */}
                <div className="form-group">
                    <label className="form-label" htmlFor="summary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                        <FaClipboardList style={{ color: '#a855f7', fontSize: '1rem' }} />
                        {t('cv_summary_label')}
                    </label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem', lineHeight: '1.5' }}>
                        {t('cv_summary_hint')}
                    </p>
                    <textarea
                        className="form-input form-textarea"
                        id="summary"
                        name="summary"
                        rows="5"
                        required
                        value={formData.summary}
                        onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                        placeholder={t('cv_summary_placeholder')}
                        style={{ resize: 'vertical', minHeight: '120px', lineHeight: '1.6' }}
                    />
                </div>

                {/* === BAGIAN 2: Deskripsi Pengalaman Singkat === */}
                <div className="form-group">
                    <label className="form-label" htmlFor="experience_desc" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                        <FaUserTie style={{ color: 'var(--accent)', fontSize: '1rem' }} />
                        {t('experience_desc_label')}
                    </label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem', lineHeight: '1.5' }}>
                        {t('experience_desc_hint')}
                    </p>
                    <textarea
                        className="form-input form-textarea"
                        id="experience_desc"
                        name="experience_desc"
                        rows="4"
                        required
                        value={formData.experience_desc}
                        onChange={(e) => setFormData(prev => ({ ...prev, experience_desc: e.target.value }))}
                        placeholder={t('experience_desc_placeholder')}
                        style={{ resize: 'vertical', minHeight: '100px', lineHeight: '1.6' }}
                    />
                </div>

                {/* === Pengalaman Kerja (tahun) === */}
                <div className="form-group">
                    <label className="form-label" htmlFor="years_experience" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                        <FaBriefcase style={{ color: '#10b981', fontSize: '1rem' }} />
                        {t('work_experience_label')}
                    </label>
                    <input
                        className="form-input"
                        type="number"
                        id="years_experience"
                        name="years_experience"
                        step="0.5"
                        min="0"
                        max="50"
                        required
                        value={formData.years_experience}
                        onChange={(e) => setFormData(prev => ({ ...prev, years_experience: e.target.value }))}
                        placeholder={t('work_experience_placeholder')}
                    />
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        {t('work_experience_hint')}
                    </span>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? <FaSpinner className="spinner" /> : <FaSearch />}
                        <span>{loading ? t('predicting') : t('predict_btn')}</span>
                    </button>
                </div>
            </form>

            {/* === RESULT SECTION === */}
            {result && (
                <div className="prediction-result" style={{ marginTop: '2rem', animation: 'fadeIn 0.5s ease' }}>

                    {/* Main Prediction Card */}
                    <div className="result-card" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                            <FaBriefcase /> {t('predicted_role')}
                        </div>
                        <div className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '1rem', lineHeight: 1.2 }}>
                            {formatLabel(result.predicted_job || "Unknown")}
                        </div>

                        {/* Low Confidence Warning */}
                        {result.low_confidence && (
                            <div style={{
                                background: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                borderRadius: '0.75rem',
                                padding: '0.6rem 1rem',
                                marginBottom: '1rem',
                                fontSize: '0.85rem',
                                color: '#f59e0b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                justifyContent: 'center',
                            }}>
                                ⚠️ Kepercayaan model rendah — pertimbangkan top prediksi lainnya
                            </div>
                        )}

                        {/* Confidence Gauge */}
                        {result.confidence != null && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <div className="confidence-gauge">
                                    <svg width="120" height="120" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-color)" strokeWidth="8" />
                                        <circle
                                            cx="60" cy="60" r="52" fill="none"
                                            stroke="url(#gaugeGradient)"
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * 52}`}
                                            strokeDashoffset={`${2 * Math.PI * 52 * (1 - result.confidence)}`}
                                            transform="rotate(-90 60 60)"
                                            style={{ transition: 'stroke-dashoffset 1s ease' }}
                                        />
                                        <defs>
                                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#6366f1" />
                                                <stop offset="50%" stopColor="#a855f7" />
                                                <stop offset="100%" stopColor="#ec4899" />
                                            </linearGradient>
                                        </defs>
                                        <text x="60" y="55" textAnchor="middle" fill="var(--text-main)" fontSize="22" fontWeight="bold" fontFamily="Outfit, sans-serif">
                                            {confidencePercent}%
                                        </text>
                                        <text x="60" y="73" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="Inter, sans-serif">
                                            Confidence
                                        </text>
                                    </svg>
                                </div>
                                {/* Prediction Gap */}
                                {result.prediction_gap != null && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        Gap: <strong style={{ color: result.prediction_gap < 0.03 ? '#f59e0b' : 'var(--success)' }}>
                                            {(result.prediction_gap * 100).toFixed(1)}%
                                        </strong>
                                        {result.prediction_gap < 0.03 ? ' (ambigu)' : result.prediction_gap > 0.1 ? ' (jelas)' : ''}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Top Predictions */}
                        {result.top_predictions && result.top_predictions.length > 1 && (
                            <div style={{ marginTop: '1.25rem', textAlign: 'left' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Top Prediksi:</div>
                                {result.top_predictions.map((item, idx) => (
                                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.85rem', borderBottom: idx < result.top_predictions.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                        <span style={{ color: idx === 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: idx === 0 ? 600 : 400 }}>
                                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {formatLabel(item.label)}
                                        </span>
                                        <span style={{ color: idx === 0 ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}>
                                            {(item.score * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Probability Distribution */}
                    {result.probabilities && Object.keys(result.probabilities).length > 0 && (
                        <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600 }}>
                                <FaChartBar style={{ color: 'var(--accent)' }} /> {t('probability_dist')}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {Object.entries(result.probabilities)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([label, prob], idx) => {
                                        const percent = (prob * 100).toFixed(1);
                                        const isTop = idx === 0;
                                        return (
                                            <div key={label}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                                                    <span style={{ fontWeight: isTop ? 700 : 400, color: isTop ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                                        {isTop && '🏆 '}{formatLabel(label)}
                                                    </span>
                                                    <span style={{ fontWeight: 600, color: isTop ? 'var(--accent)' : 'var(--text-muted)' }}>
                                                        {percent}%
                                                    </span>
                                                </div>
                                                <div className="score-bar-bg">
                                                    <div
                                                        className="score-bar"
                                                        style={{
                                                            width: `${Math.max(Number(percent), 0.5)}%`,
                                                            background: isTop ? 'var(--gradient)' : getBarColor(idx),
                                                            opacity: isTop ? 1 : 0.6,
                                                            transition: 'width 0.8s ease'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="result-card error">
                    <div style={{ color: 'var(--danger)', fontWeight: 'bold', marginBottom: '0.5rem' }}>⚠️ Error</div>
                    <div style={{ fontSize: '0.9rem' }}>{error}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {t('error_hint')}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PredictionForm;