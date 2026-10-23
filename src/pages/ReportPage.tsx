import React, { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ACTIVITY_CATEGORIES, ActivityCategory } from '../types/domain';
import { formatDateInTimezone, formatMinutesWithUnit } from '../utils/time';
import { Printer, ArrowLeft, AlertCircle, Lightbulb } from 'lucide-react';

export const ReportPage: React.FC = () => {
  const { user, logs, focusSessions, target } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const timezone = user?.timezone || 'Asia/Jakarta';
  const todayStr = formatDateInTimezone(new Date(), timezone);
  const thirtyDaysAgoStr = useMemo(() => {
    const d = new Date(Date.now() - 29 * 86400000);
    return formatDateInTimezone(d, timezone);
  }, [timezone]);

  const startDate = searchParams.get('start') || thirtyDaysAgoStr;
  const endDate = searchParams.get('end') || todayStr;

  useEffect(() => {
    document.title = `Laporan Resmi TimeCraft — ${user?.display_name || 'Pengguna'}`;
    const timer = setTimeout(() => {
      window.print();
    }, 400);
    return () => clearTimeout(timer);
  }, [user]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => l.activity_date >= startDate && l.activity_date <= endDate);
  }, [logs, startDate, endDate]);

  const { totals, grandTotal, productiveTotal, nonProductiveTotal } = useMemo(() => {
    const t: Record<ActivityCategory, number> = {
      productive_study: 0,
      productive_work: 0,
      social_media: 0,
      entertainment: 0,
      gaming: 0,
      communication: 0,
      other: 0,
    };
    let g = 0;
    let p = 0;
    let np = 0;
    for (const l of filteredLogs) {
      t[l.category] = (t[l.category] || 0) + l.duration_minutes;
      g += l.duration_minutes;
      if (ACTIVITY_CATEGORIES[l.category]?.isProductive) {
        p += l.duration_minutes;
      } else {
        np += l.duration_minutes;
      }
    }
    return { totals: t, grandTotal: g, productiveTotal: p, nonProductiveTotal: np };
  }, [filteredLogs]);

  const uniqueDays = useMemo(() => {
    return new Set(filteredLogs.map((l) => l.activity_date)).size;
  }, [filteredLogs]);

  const avgDaily = uniqueDays > 0 ? Math.round(grandTotal / uniqueDays) : 0;

  const completedFocusSessions = useMemo(() => {
    return focusSessions.filter((s) => s.status === 'completed');
  }, [focusSessions]);

  const totalFocusMinutes = useMemo(() => {
    const sec = completedFocusSessions.reduce((acc, s) => acc + s.actual_focus_seconds, 0);
    return Math.round(sec / 60);
  }, [completedFocusSessions]);

  const nowFormatted = new Date().toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const productivePct = grandTotal > 0 ? Math.round((productiveTotal / grandTotal) * 100) : 0;
  const nonProductivePct = 100 - productivePct;

  const evaluation = useMemo(() => {
    if (grandTotal === 0) {
      return {
        critique:
          'Belum ada catatan aktivitas pada rentang tanggal ini. Konsistensi pencatatan manual atau pengukuran timer diperlukan agar kebiasaan layar dapat dievaluasi secara akurat.',
        suggestions: [
          'Mulai dengan mencatat penggunaan aplikasi utama setiap malam.',
          'Nyalakan Focus Timer sebelum memulai sesi belajar atau bekerja.',
          'Tetapkan batas harian screen time pada menu Target & Refleksi.',
        ],
      };
    }

    let crit = '';
    if (productivePct >= 65) {
      crit = `Pola penggunaan gawai sangat sehat dan tertib. Waktu produktif mencapai ${productivePct}%, membuktikan kendali diri yang tinggi dalam mengelola distraksi digital harian.`;
    } else if (productivePct >= 40) {
      crit = `Keseimbangan cukup baik (${productivePct}% produktif vs ${nonProductivePct}% non-produktif). Namun, perhatikan durasi hiburan dan media sosial agar tidak memakan waktu istirahat utama.`;
    } else {
      crit = `Waktu non-produktif mendominasi sebesar ${nonProductivePct}% (${formatMinutesWithUnit(
        nonProductiveTotal,
      )}). Disarankan membatasi penjelajahan pasif (*scrolling*) dan game berlebih demi menjaga daya fokus dan kebugaran mental.`;
    }

    const tips: string[] = [];
    if (completedFocusSessions.length === 0) {
      tips.push('Gunakan Focus Timer minimal 1–2 sesi Pomodoro (25 menit) per hari untuk menyelesaikan tugas berprioritas tinggi.');
    } else {
      tips.push(`Pertahankan konsistensi sesi fokus (${completedFocusSessions.length} sesi tuntas dengan total durasi ${formatMinutesWithUnit(totalFocusMinutes)}).`);
    }

    if (target?.max_daily_screentime_minutes && avgDaily > target.max_daily_screentime_minutes) {
      tips.push(
        `Rata-rata harian (${formatMinutesWithUnit(avgDaily)}) melebihi target batas harian (${formatMinutesWithUnit(
          target.max_daily_screentime_minutes,
        )}). Kurangi akses media sosial 1 jam sebelum tidur.`,
      );
    } else {
      tips.push('Terapkan aturan 20-20-20: setiap 20 menit menatap layar, istirahatkan mata selama 20 detik memandang objek sejauh 6 meter.');
    }

    tips.push('Lakukan refleksi mingguan di menu Target & Refleksi untuk mengukur perkembangan produktivitas secara berkesinambungan.');

    return { critique: crit, suggestions: tips };
  }, [grandTotal, productivePct, nonProductivePct, nonProductiveTotal, completedFocusSessions, totalFocusMinutes, target, avgDaily]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/analytics');
    }
  };

  return (
    <div className="report-root-container">
      <style>{`
        /* ====================================================================
         * ATURAN CETAK / PDF (A4 STANDAR PROFESIONAL UNTUK HP & LAPTOP)
         * ==================================================================== */
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print-bar {
            display: none !important;
          }
          .report-root-container {
            background-color: #ffffff !important;
            padding: 0 !important;
            min-height: auto !important;
          }
          .report-paper-a4 {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            min-height: auto !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .header-bar {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding-bottom: 14px !important;
            border-bottom: 2px solid #2563eb !important;
            margin-bottom: 14px !important;
          }
          .metrics-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 16px !important;
          }
          .eval-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
            margin-bottom: 14px !important;
          }
          .footer-sign-block {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-end !important;
            margin-top: 24px !important;
            padding-top: 14px !important;
            border-top: 1px dashed #cbd5e1 !important;
            page-break-inside: avoid !important;
          }
        }

        /* ====================================================================
         * TAMPILAN PRATINJAU DI LAYAR (DESKTOP / LAPTOP & HP)
         * ==================================================================== */
        .report-root-container {
          min-height: 100vh;
          background-color: #090b10;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          padding-bottom: 40px;
          box-sizing: border-box;
        }

        .no-print-bar {
          position: sticky;
          top: 0;
          z-index: 999;
          background-color: #0f172a;
          color: #ffffff;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
          border-bottom: 1px solid #1e293b;
        }

        .no-print-bar-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .no-print-bar-title strong {
          font-size: 14px;
          letter-spacing: -0.2px;
        }

        .no-print-bar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-print-action {
          background-color: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 7px;
          padding: 8px 16px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
          transition: background-color 0.15s ease, transform 0.1s ease;
        }

        .btn-print-action:hover {
          background-color: #1d4ed8;
          transform: translateY(-1px);
        }

        .btn-back-action {
          background-color: transparent;
          color: #cbd5e1;
          border: 1px solid #334155;
          border-radius: 7px;
          padding: 8px 14px;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .btn-back-action:hover {
          color: #ffffff;
          border-color: #64748b;
          background-color: rgba(255, 255, 255, 0.06);
        }

        /* Lembar Dokumen A4 */
        .report-paper-a4 {
          max-width: 820px;
          margin: 20px auto;
          background-color: #ffffff;
          padding: 28px 32px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        /* Header Dokumen Resmi */
        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 14px;
          border-bottom: 2px solid #2563eb;
          margin-bottom: 14px;
        }

        .brand-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-name {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.4px;
          line-height: 1.15;
        }

        .brand-tagline {
          font-size: 10.5px;
          color: #64748b;
          font-weight: 500;
        }

        .doc-badge {
          text-align: right;
        }

        .doc-pill {
          display: inline-block;
          background: #eff6ff;
          color: #2563eb;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid #bfdbfe;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .doc-date {
          font-size: 11px;
          color: #475569;
          margin-top: 4px;
          font-weight: 500;
        }

        /* Informasi Pengguna & Periode */
        .info-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        /* 4 Kartu Metrik Ringkasan */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .metric-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 11px 12px;
          text-align: center;
        }

        .metric-lbl {
          font-size: 10.5px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .metric-val {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 3px;
        }

        /* Judul Seksi */
        .section-header {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Tabel Distribusi Waktu */
        .table-wrap {
          width: 100%;
          overflow-x: auto;
          margin-bottom: 16px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
        }

        th {
          background: #0f172a;
          color: #ffffff;
          padding: 9px 12px;
          text-align: left;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        td {
          padding: 8px 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #1e293b;
        }

        tr:nth-child(even) td {
          background: #f8fafc;
        }

        .status-pill {
          display: inline-block;
          padding: 2.5px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .pill-prod {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .pill-nonprod {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
        }

        .bar-track {
          width: 100%;
          height: 7px;
          background: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
          border-radius: 999px;
        }

        /* Grid Evaluasi & Rekomendasi (Kritik & Saran) */
        .eval-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }

        .eval-card {
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 11.5px;
          line-height: 1.5;
        }

        .eval-card-critique {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
        }

        .eval-card-suggestions {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .eval-card-head {
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
          font-size: 11.5px;
        }

        .eval-card ul {
          margin: 0;
          padding-left: 16px;
        }

        .eval-card li {
          margin-bottom: 4px;
        }

        /* Kotak Pedoman Kebiasaan Sehat */
        .insight-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 11px 14px;
          margin-bottom: 18px;
          font-size: 11px;
          color: #1e40af;
          line-height: 1.5;
        }

        /* Footer Pengesahan Resmi */
        .footer-sign-block {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 20px;
          padding-top: 14px;
          border-top: 1px dashed #cbd5e1;
        }

        .system-watermark {
          font-size: 10.5px;
          color: #94a3b8;
          max-width: 360px;
          line-height: 1.45;
        }

        .sign-box {
          text-align: center;
          min-width: 190px;
        }

        .sign-line {
          margin-top: 46px;
          border-bottom: 1px solid #334155;
        }

        /* ====================================================================
         * RESPONSIVITAS KHUSUS TAMPILAN LAYAR HP (MOBILE PREVIEW)
         * ==================================================================== */
        @media screen and (max-width: 640px) {
          .no-print-bar {
            padding: 10px 14px;
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .no-print-bar-title {
            justify-content: center;
          }
          .no-print-bar-actions {
            width: 100%;
          }
          .btn-print-action,
          .btn-back-action {
            flex: 1;
            justify-content: center;
            font-size: 12px;
            padding: 8px 10px;
          }
          .report-paper-a4 {
            margin: 10px 8px;
            padding: 16px 14px;
            max-width: 100%;
            border-radius: 8px;
          }
          .header-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .doc-badge {
            text-align: left;
          }
          .info-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .eval-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .footer-sign-block {
            flex-direction: column;
            align-items: stretch;
            gap: 18px;
          }
          .sign-box {
            text-align: right;
          }
          .sign-line {
            margin-top: 36px;
            width: 180px;
            margin-left: auto;
          }
        }
      `}</style>

      {/* Bilah Aksi di Layar */}
      <div className="no-print-bar">
        <div className="no-print-bar-title">
          <strong style={{ fontSize: '13px' }}>TimeCraft — Laporan Resmi Pengelolaan Waktu</strong>
        </div>
        <div className="no-print-bar-actions">
          <button type="button" className="btn-print-action" onClick={() => window.print()}>
            <Printer size={15} />
            <span>Simpan PDF / Cetak</span>
          </button>
          <button type="button" className="btn-back-action" onClick={handleBack}>
            <ArrowLeft size={14} />
            <span>Kembali</span>
          </button>
        </div>
      </div>

      {/* Lembar Dokumen Resmi A4 */}
      <div className="report-paper-a4">
        {/* Header Resmi TimeCraft */}
        <header className="header-bar">
          <div className="brand-box">
            <svg width="42" height="42" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
              <rect width="64" height="64" rx="14" fill="#2563EB" />
              <circle cx="32" cy="32" r="20" stroke="#FFFFFF" strokeWidth="4.5" strokeOpacity="0.95" />
              <circle cx="32" cy="32" r="14" stroke="#93C5FD" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M32 20V32L40 37" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="32" cy="12" r="2.5" fill="#EFF6FF" />
            </svg>
            <div>
              <div className="brand-name">TimeCraft</div>
              <div className="brand-tagline">Screen Time &amp; Focus Monitoring Platform</div>
            </div>
          </div>
          <div className="doc-badge">
            <span className="doc-pill">Laporan Resmi Pengelolaan Waktu</span>
            <div className="doc-date">Dicetak: {nowFormatted} WIB</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>time-craft-ruby.vercel.app</div>
          </div>
        </header>

        {/* Informasi Akun & Periode */}
        <div className="info-card">
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              {user?.display_name || 'Pengguna TimeCraft'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Akun: <strong>{user?.email || '—'}</strong> • Zona Waktu: <strong>{timezone}</strong>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Periode Analisis</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb' }}>
              {startDate} <span style={{ fontWeight: 400, color: '#64748b' }}>s/d</span> {endDate}
            </div>
            <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '1px' }}>
              Status: <strong>{uniqueDays} hari aktif tercatat</strong>
            </div>
          </div>
        </div>

        {/* 4 Kartu Metrik Ringkasan */}
        <div className="metrics-grid">
          <div className="metric-box">
            <div className="metric-lbl">Total Screen Time</div>
            <div className="metric-val">{formatMinutesWithUnit(grandTotal)}</div>
          </div>
          <div className="metric-box">
            <div className="metric-lbl">Rerata Harian</div>
            <div className="metric-val">{formatMinutesWithUnit(avgDaily)}</div>
          </div>
          <div className="metric-box">
            <div className="metric-lbl">Waktu Produktif</div>
            <div className="metric-val" style={{ color: productivePct >= 50 ? '#059669' : '#d97706' }}>
              {productivePct}% <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#64748b' }}>({formatMinutesWithUnit(productiveTotal)})</span>
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-lbl">Sesi Fokus Tuntas</div>
            <div className="metric-val" style={{ color: '#2563eb' }}>
              {completedFocusSessions.length} <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#64748b' }}>({formatMinutesWithUnit(totalFocusMinutes)})</span>
            </div>
          </div>
        </div>

        {/* Tabel Distribusi Waktu per Kategori */}
        <div className="section-header">
          <span>Distribusi Waktu Berdasarkan Kategori</span>
          <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'none', fontWeight: 500 }}>
            Total {filteredLogs.length} catatan aktivitas
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '36px', textAlign: 'center' }}>No</th>
                <th>Kategori Aktivitas</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Klasifikasi</th>
                <th style={{ width: '150px' }}>Durasi Layar</th>
                <th style={{ width: '85px', textAlign: 'center' }}>Porsi</th>
                <th style={{ width: '22%' }}>Proporsi Visual</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(ACTIVITY_CATEGORIES).map((cat, idx) => {
                const mins = totals[cat.id] || 0;
                const pct = grandTotal > 0 ? Math.round((mins / grandTotal) * 100) : 0;
                return (
                  <tr key={cat.id}>
                    <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{cat.label}</strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-pill ${cat.isProductive ? 'pill-prod' : 'pill-nonprod'}`}>
                        {cat.isProductive ? '✓ Produktif' : 'Non-Produktif'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{mins} menit</strong>{' '}
                      <span style={{ color: '#64748b', fontSize: '10.5px' }}>({(mins / 60).toFixed(1)} jam)</span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>{pct}%</td>
                    <td>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%`, background: cat.isProductive ? '#059669' : '#3b82f6' }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bagian Evaluasi & Rekomendasi (Kritik & Saran) */}
        <div className="section-header" style={{ marginTop: '4px' }}>
          <span>Evaluasi Perilaku &amp; Rekomendasi (Kritik &amp; Saran)</span>
        </div>

        <div className="eval-grid">
          <div className="eval-card eval-card-critique">
            <div className="eval-card-head">
              <AlertCircle size={14} color="#d97706" />
              <span>Analisis Pola Penggunaan Layar</span>
            </div>
            <div>{evaluation.critique}</div>
          </div>
          <div className="eval-card eval-card-suggestions">
            <div className="eval-card-head">
              <Lightbulb size={14} color="#16a34a" />
              <span>Saran Perbaikan Kebiasaan Layar</span>
            </div>
            <ul>
              {evaluation.suggestions.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Catatan Edukasi & Pengawasan */}
        <div className="insight-box">
          <strong>💡 Pedoman Kebiasaan Layar Sehat TimeCraft:</strong><br/>
          Biasakan aturan istirahat mata 20-20-20 (memandang jarak 6 meter selama 20 detik setiap 20 menit menatap layar) serta hindari paparan layar 1 jam sebelum waktu tidur demi kualitas istirahat dan ketajaman fokus yang maksimal.
        </div>

        {/* Tanda Tangan & Verifikasi Resmi Dokumen */}
        <footer className="footer-sign-block">
          <div className="system-watermark">
            <strong>TimeCraft Verified Document</strong><br />
            Dokumen elektronik resmi ini diterbitkan secara otomatis oleh platform TimeCraft (time-craft-ruby.vercel.app). Data dicatat secara aman dari aktivitas perangkat pengguna.
          </div>
          <div className="sign-box">
            <div style={{ fontSize: '11px', color: '#64748b' }}>Mengetahui &amp; Memverifikasi,</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>Pengguna / Pemilik Akun</div>
            <div className="sign-line" />
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
              {user?.display_name || user?.email}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
