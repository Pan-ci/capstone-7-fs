import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FaUpload,
    FaSpinner,
    FaDownload,
    FaTable,
    FaFileExcel,
    FaClock,
    FaTrash,
    FaChartBar,
} from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { getApiErrorMessage } from '../utils/apiError';
import api from "../config/api";

const POLL_INTERVAL_MS = 2000;

const formatLabel = (label) =>
    String(label || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

const probabilityEntries = (probabilities) =>
    Object.entries(probabilities || {})
        .filter(([, value]) => value != null && !Number.isNaN(Number(value)))
        .sort(([, a], [, b]) => Number(b) - Number(a));

const getBarColor = (index) => {
    const colors = [
        'linear-gradient(90deg, #6366f1, #818cf8)',
        'linear-gradient(90deg, #10b981, #34d399)',
        'linear-gradient(90deg, #f59e0b, #fbbf24)',
        'linear-gradient(90deg, #3b82f6, #60a5fa)',
        'linear-gradient(90deg, #ec4899, #f472b6)',
    ];
    return colors[index % colors.length];
};

const BatchPrediction = () => {
    const { t } = useLanguage();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [job, setJob] = useState(null);
    const [error, setError] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const fileInputRef = useRef(null);
    const pollRef = useRef(null);

    const clearPoll = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    const fetchJob = useCallback(async (jobId) => {
        try {
            const res = await api.get(`/api/batch/predictions/${jobId}`);
            const data = res.data?.data;
            setJob(data);
            if (data?.status !== 'processing') {
                clearPoll();
            }
            return data;
        } catch (err) {

            if (err.response?.status === 410) {
                setError(getApiErrorMessage(err));
                setJob(null);
            } else {
                setError(
                    getApiErrorMessage(err) ||
                    t('batch_error_generic')
                );
            }
            clearPoll();
            return null;
        }
    }, [t]);

    useEffect(() => {
        if (!job?.expiresAt) {
            setTimeLeft(null);
            return;
        }

        const updateTimer = () => {
            const diff = new Date(job.expiresAt).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft(t('batch_expired_short'));
                return;
            }
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [job?.expiresAt, t]);

    useEffect(() => () => clearPoll(), []);

    const handleFileChange = (e) => {
        setFile(e.target.files?.[0] || null);
        setError(null);
    };

    const handleDownloadTemplate = async () => {
        try {
            const files = [
                {
                    endpoint: '/api/batch/template',
                    filename: 'batch_template.csv',
                },
                {
                    endpoint: '/api/batch/template',
                    filename: 'batch_template.xlsx',
                },
            ];

            for (const file of files) {
                const res = await api.get(file.endpoint, {
                    responseType: 'blob',
                });

                const url = window.URL.createObjectURL(
                    new Blob([res.data])
                );

                const link = document.createElement('a');

                link.href = url;
                link.setAttribute('download', file.filename);

                document.body.appendChild(link);

                link.click();

                link.remove();

                window.URL.revokeObjectURL(url);

                // delay agar browser tidak blok download kedua
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (err) {
            setError(getApiErrorMessage(err));
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setError(t('batch_no_file'));
            return;
        }

        setUploading(true);
        setError(null);
        setJob(null);
        clearPoll();

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/api/batch/predictions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const jobId = res.data?.data?.id;
            if (!jobId) throw new Error('Invalid response');

            const initial = await fetchJob(jobId);
            if (initial?.status === 'processing') {
                pollRef.current = setInterval(() => fetchJob(jobId), POLL_INTERVAL_MS);
            }
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadResults = async (format) => {
        if (!job?.id) return;
        try {
            const res = await api.get(
                `/api/batch/predictions/${job.id}/download?format=${format}`,
                { responseType: 'blob' }
            );
            const ext = format === 'xlsx' ? 'xlsx' : 'csv';
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `batch_results.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(getApiErrorMessage(err));
        }
    };

    const handleDeleteJob = async () => {
        if (!job?.id) return;
        try {
            await api.delete(`/api/batch/predictions/${job.id}`);
            setJob(null);
            setFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            clearPoll();
        } catch (err) {
            setError(getApiErrorMessage(err));
        }
    };

    const progressPercent =
        job?.totalRows > 0
            ? Math.round((job.processedRows / job.totalRows) * 100)
            : 0;

    return (
        <div className="glass-panel" style={{ marginTop: '2rem' }}>
            <div className="panel-header">
                <h2
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        margin: 0,
                    }}
                >
                    <FaFileExcel style={{ color: 'var(--accent)' }} />
                    {t('batch_title')}
                </h2>
                <span
                    className="tag"
                    style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--accent)',
                    }}
                >
                    {t('batch_ttl_hint')}
                </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {t('batch_description')}
            </p>

            <form onSubmit={handleUpload}>
                <div className="form-group">
                    <label className="form-label">{t('batch_file_label')}</label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="form-input"
                        onChange={handleFileChange}
                    />
                    <span
                        style={{
                            display: 'block',
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.4rem',
                        }}
                    >
                        {t('batch_file_hint')}
                    </span>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                        marginTop: '1rem',
                    }}
                >
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleDownloadTemplate}
                    >
                        <FaDownload /> {t('batch_download_template')}
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={uploading || !file}
                    >
                        {uploading ? (
                            <FaSpinner className="spinner" />
                        ) : (
                            <FaUpload />
                        )}
                        <span>
                            {uploading ? t('batch_uploading') : t('batch_upload_btn')}
                        </span>
                    </button>
                </div>
            </form>

            {job && (
                <div style={{ marginTop: '2rem' }}>
                    <div
                        className="result-card"
                        style={{
                            marginBottom: '1rem',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                Job ID: <code>{job.id}</code>
                            </div>
                            <div style={{ marginTop: '0.25rem' }}>
                                {t('batch_status')}:{' '}
                                <strong>
                                    {job.status === 'processing'
                                        ? t('batch_status_processing')
                                        : job.status === 'completed'
                                            ? t('batch_status_completed')
                                            : t('batch_status_failed')}
                                </strong>
                            </div>
                            {timeLeft && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        marginTop: '0.35rem',
                                        fontSize: '0.85rem',
                                        color: 'var(--text-muted)',
                                    }}
                                >
                                    <FaClock /> {t('batch_expires_in')}: {timeLeft}
                                </div>
                            )}
                        </div>

                        {job.status === 'processing' && (
                            <div style={{ minWidth: '200px', flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: '0.85rem',
                                        marginBottom: '0.35rem',
                                    }}
                                >
                                    {job.processedRows} / {job.totalRows} ({progressPercent}%)
                                </div>
                                <div className="score-bar-bg">
                                    <div
                                        className="score-bar"
                                        style={{
                                            width: `${progressPercent}%`,
                                            background: 'var(--gradient)',
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {job.status === 'completed' && (
                        <div className="batch-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleDownloadResults('csv')}
                            >
                                <FaDownload /> {t('batch_download_csv')}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleDownloadResults('xlsx')}
                            >
                                <FaDownload /> {t('batch_download_xlsx')}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleDeleteJob}
                                style={{ color: 'var(--danger)' }}
                            >
                                <FaTrash /> {t('batch_delete')}
                            </button>
                        </div>
                    )}

                    {job.results?.length > 0 && (
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <p className="scroll-hint">← Geser untuk melihat selengkapnya</p>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.75rem',
                                    fontWeight: 600,
                                }}
                            >
                                <FaTable style={{ color: 'var(--accent)' }} />
                                {t('batch_results_table')} ({job.results.length})
                            </div>
                            <table className="batch-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{t('batch_col_prediction')}</th>
                                        <th>{t('batch_col_confidence')}</th>
                                        <th>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <FaChartBar /> {t('batch_col_probabilities')}
                                            </span>
                                        </th>
                                        <th>{t('batch_col_years')}</th>
                                        <th>{t('batch_col_error')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {job.results.map((r) => (
                                        <tr key={r.row}>
                                            <td>{r.row}</td>
                                            <td>
                                                {r.error
                                                    ? '—'
                                                    : formatLabel(r.predicted_job)}
                                            </td>
                                            <td>
                                                {r.confidence != null
                                                    ? `${(r.confidence * 100).toFixed(1)}%`
                                                    : '—'}
                                            </td>
                                            <td style={{ minWidth: '240px' }}>
                                                {probabilityEntries(r.probabilities).length > 0 ? (
                                                    <div className="batch-probability-list">
                                                        {probabilityEntries(r.probabilities).map(([label, prob], idx) => {
                                                            const percent = Number(prob) * 100;
                                                            return (
                                                                <div className="batch-probability-row" key={label}>
                                                                    <div className="batch-probability-meta">
                                                                        <span
                                                                            style={{
                                                                                fontWeight: idx === 0 ? 700 : 500,
                                                                                color: idx === 0 ? 'var(--text-main)' : 'var(--text-muted)',
                                                                            }}
                                                                        >
                                                                            {formatLabel(label)}
                                                                        </span>
                                                                        <span
                                                                            style={{
                                                                                color: idx === 0 ? 'var(--accent)' : 'var(--text-muted)',
                                                                                fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            {percent.toFixed(1)}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="score-bar-bg">
                                                                        <div
                                                                            className="score-bar"
                                                                            style={{
                                                                                width: `${Math.max(percent, 0.5)}%`,
                                                                                background: idx === 0 ? 'var(--gradient)' : getBarColor(idx),
                                                                                opacity: idx === 0 ? 1 : 0.65,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                                                )}
                                            </td>
                                            <td>{r.input?.num ?? '—'}</td>
                                            <td
                                                style={{
                                                    color: r.error
                                                        ? 'var(--danger)'
                                                        : 'var(--text-muted)',
                                                    fontSize: '0.8rem',
                                                }}
                                            >
                                                {r.error || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="result-card error" style={{ marginTop: '1.5rem' }}>
                    <div
                        style={{
                            color: 'var(--danger)',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                        }}
                    >
                        ⚠️ Error
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>{error}</div>
                </div>
            )}
        </div>
    );
};

export default BatchPrediction;
