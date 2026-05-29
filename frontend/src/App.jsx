import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import PredictionForm from './components/PredictionForm';
import BatchPrediction from './components/BatchPrediction';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';

function MainApp() {
  const { t } = useLanguage();
  const [mode, setMode] = React.useState('single');

  return (
    <div className="app-container">
      <Header />

      <main>
        {/* ── Hero Section ── */}
        <div className="hero-section">
          <h1 className="hero-title">
            {t('title_ideal')}{' '}
            <span className="text-gradient">{t('title_career')}</span>
          </h1>
          <p className="hero-subtitle">{t('subtitle')}</p>
        </div>

        {/* ── Mode Tabs ── */}
        <div className="mode-tabs">
          <button
            type="button"
            className={`btn ${mode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('single')}
            id="tab-single"
          >
            {t('tab_single')}
          </button>
          <button
            type="button"
            className={`btn ${mode === 'batch' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('batch')}
            id="tab-batch"
          >
            {t('tab_batch')}
          </button>
        </div>

        {mode === 'single' ? <PredictionForm /> : <BatchPrediction />}
      </main>

      <footer className="app-footer">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return !isLoggedIn ? children : <Navigate to="/" replace />;
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-color)',
          color: 'var(--text-main)',
          fontSize: '1.1rem',
          gap: '0.75rem',
          flexDirection: 'column',
        }}
      >
        <span className="spinner-sm" style={{ width: 28, height: 28, borderWidth: 3 }} />
        <span style={{ color: 'var(--text-muted)' }}>Memuat aplikasi...</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
