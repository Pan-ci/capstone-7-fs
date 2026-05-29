import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  id: {
    title_ideal: "Temukan Karir",
    title_career: "Ideal Anda",
    subtitle: "Masukkan deskripsi pengalaman dan rangkuman CV, lalu biarkan AI memprediksi klasifikasi pekerjaan terbaik.",
    footer: "Ready to Perform! © 2026 — Proyek Capstone",
    status_checking: "Mengecek...",
    status_connected: "Terhubung",
    status_error: "Terputus",
    job_prediction: "Prediksi Pekerjaan",
    ai_mode: "Mode AI",

    // Bagian 1: Deskripsi Pengalaman Singkat
    experience_desc_label: "Deskripsi Pengalaman Singkat",
    experience_desc_hint: "Tuliskan ringkasan singkat tentang pengalaman kerja Anda, termasuk posisi terakhir, tanggung jawab utama, dan keahlian yang digunakan.",
    experience_desc_placeholder: "Contoh: Berpengalaman 3 tahun sebagai Data Analyst di perusahaan teknologi. Bertanggung jawab membuat dashboard, menganalisis data penjualan, dan membuat laporan mingguan menggunakan Python dan SQL.",

    // Bagian 2: Rangkuman CV
    cv_summary_label: "Rangkuman CV",
    cv_summary_hint: "Masukkan rangkuman CV Anda meliputi pendidikan, keahlian teknis, sertifikasi, dan pencapaian utama.",
    cv_summary_placeholder: "Contoh: S1 Teknik Informatika, IPK 3.8. Menguasai Python, SQL, Tableau, Excel. Sertifikasi Google Data Analytics. Pernah memenangkan hackathon data science tingkat nasional. Terbiasa bekerja dalam tim agile.",

    // Pengalaman Kerja (pengganti Numeric Feature)
    work_experience_label: "Pengalaman Kerja (Tahun)",
    work_experience_placeholder: "Contoh: 3",
    work_experience_hint: "Masukkan jumlah tahun pengalaman kerja Anda yang relevan.",

    predict_btn: "Prediksi Pekerjaan",
    predicting: "Memprediksi...",
    predicted_role: "Peran Pekerjaan yang Diprediksi",
    probability_dist: "Distribusi Probabilitas",
    error_hint: "Pastikan model AI server (FastAPI) berjalan di port 8000.",

    tab_single: "Prediksi Tunggal",
    tab_batch: "Prediksi Batch",
    batch_title: "Prediksi Batch (CSV / Excel)",
    batch_ttl_hint: "Hasil disimpan 1 jam",
    batch_description: "Unggah file CSV atau Excel dengan kolom experience_desc, cv_summary, dan num. Hasil dapat dilihat di tabel dan diunduh.",
    batch_file_label: "File CSV / Excel",
    batch_file_hint: "Maks. 500 baris, 5 MB. Format: .csv atau .xlsx",
    batch_download_template: "Unduh Template",
    batch_upload_btn: "Unggah & Prediksi",
    batch_uploading: "Mengunggah...",
    batch_no_file: "Pilih file terlebih dahulu.",
    batch_status: "Status",
    batch_status_processing: "Memproses",
    batch_status_completed: "Selesai",
    batch_status_failed: "Gagal",
    batch_expires_in: "Sisa waktu",
    batch_expired_short: "Kedaluwarsa",
    batch_expired: "Hasil batch sudah dihapus (lebih dari 1 jam). Silakan unggah ulang.",
    batch_error_generic: "Gagal memproses batch.",
    batch_download_csv: "Unduh CSV",
    batch_download_xlsx: "Unduh Excel",
    batch_delete: "Hapus hasil",
    batch_results_table: "Hasil prediksi",
    batch_col_prediction: "Prediksi",
    batch_col_confidence: "Keyakinan",
    batch_col_probabilities: "Probabilitas",
    batch_col_years: "Tahun",
    batch_col_error: "Error",

    // Legacy keys (untuk SampleData)
    sample_data: "Data Sampel",
    load_samples: "Muat Sampel",
    age: "Usia",
    experience: "Pengalaman",
    education: "Pendidikan",
    major: "Jurusan",
    skill_score: "Skor Keahlian",
  },
  en: {
    title_ideal: "Discover Your",
    title_career: "Ideal Career",
    subtitle: "Enter your experience description and CV summary, then let AI predict the best job classification.",
    footer: "Ready to Perform! © 2026 — Capstone Project",
    status_checking: "Checking...",
    status_connected: "Connected",
    status_error: "Disconnected",
    job_prediction: "Job Prediction",
    ai_mode: "AI Mode",

    // Part 1: Brief Experience Description
    experience_desc_label: "Brief Experience Description",
    experience_desc_hint: "Write a brief summary of your work experience, including your last position, key responsibilities, and skills used.",
    experience_desc_placeholder: "Example: 3 years of experience as a Data Analyst in a tech company. Responsible for creating dashboards, analyzing sales data, and generating weekly reports using Python and SQL.",

    // Part 2: CV Summary
    cv_summary_label: "CV Summary",
    cv_summary_hint: "Enter your CV summary including education, technical skills, certifications, and key achievements.",
    cv_summary_placeholder: "Example: Bachelor's in Computer Science, GPA 3.8. Proficient in Python, SQL, Tableau, Excel. Google Data Analytics certified. Won a national-level data science hackathon. Experienced in agile team environments.",

    // Work Experience (replacing Numeric Feature)
    work_experience_label: "Work Experience (Years)",
    work_experience_placeholder: "e.g. 3",
    work_experience_hint: "Enter the number of years of relevant work experience.",

    predict_btn: "Predict Job",
    predicting: "Predicting...",
    predicted_role: "Predicted Job Role",
    probability_dist: "Probability Distribution",
    error_hint: "Make sure the AI model server (FastAPI) is running on port 8000.",

    tab_single: "Single Prediction",
    tab_batch: "Batch Prediction",
    batch_title: "Batch Prediction (CSV / Excel)",
    batch_ttl_hint: "Results kept for 1 hour",
    batch_description: "Upload a CSV or Excel file with columns experience_desc, cv_summary, and num. View results in the table or download them.",
    batch_file_label: "CSV / Excel file",
    batch_file_hint: "Max 500 rows, 5 MB. Formats: .csv or .xlsx",
    batch_download_template: "Download Template",
    batch_upload_btn: "Upload & Predict",
    batch_uploading: "Uploading...",
    batch_no_file: "Please select a file first.",
    batch_status: "Status",
    batch_status_processing: "Processing",
    batch_status_completed: "Completed",
    batch_status_failed: "Failed",
    batch_expires_in: "Time left",
    batch_expired_short: "Expired",
    batch_expired: "Batch results were deleted (older than 1 hour). Please upload again.",
    batch_error_generic: "Failed to process batch.",
    batch_download_csv: "Download CSV",
    batch_download_xlsx: "Download Excel",
    batch_delete: "Delete results",
    batch_results_table: "Prediction results",
    batch_col_prediction: "Prediction",
    batch_col_confidence: "Confidence",
    batch_col_probabilities: "Probabilities",
    batch_col_years: "Years",
    batch_col_error: "Error",

    // Legacy keys (for SampleData)
    sample_data: "Sample Data",
    load_samples: "Load Samples",
    age: "Age",
    experience: "Experience",
    education: "Education",
    major: "Major",
    skill_score: "Skill Score",
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('app_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  const t = (key) => translations[lang][key] || key;

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'id' ? 'en' : 'id'));
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
