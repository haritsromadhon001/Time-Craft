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
    document.title = 'TimeCraft — Screen Time & Focus (Kesadaran Digital & Pengelolaan Waktu)';
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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
    dateStyle: 'long',
    timeStyle: 'short',
  });

  // Logika Analisis: Kritik & Saran
  const productivePct = grandTotal > 0 ? Math.round((productiveTotal / grandTotal) * 100) : 0;
  const nonProductivePct = 100 - productivePct;

  const evaluation = useMemo(() => {
    if (grandTotal === 0) {
      return {
        critique:
          'Belum ada catatan aktivitas pada periode ini. Konsistensi pencatatan manual atau pengukuran timer diperlukan agar kebiasaan layar dapat dievaluasi secara akurat.',
        suggestions: [
          'Mulai dengan mencatat penggunaan aplikasi utama setiap malam.',
          'Nyalakan Timer Aktivitas sebelum memulai sesi belajar atau bekerja.',
          'Tetapkan batas harian screen time pada menu Target & Refleksi.',
        ],
      };
    }

    let crit = '';
    if (productivePct >= 65) {
      crit = `Pola penggunaan layar sangat sehat. Waktu produktif mencapai ${productivePct}%, menunjukkan kendali diri yang baik atas distraksi digital.`;
    } else if (productivePct >= 40) {
      crit = `Keseimbangan cukup baik (${productivePct}% produktif vs ${nonProductivePct}% non-produktif). Namun, perhatikan lonjakan waktu pada kategori hiburan dan media sosial agar tidak memakan jam istirahat.`;
    } else {
      crit = `Waktu non-produktif mendominasi sebesar ${nonProductivePct}% (${formatMinutesWithUnit(
        nonProductiveTotal,
      )}). Scrolling pasif dan media sosial berisiko mengurangi konsentrasi serta energi mental harian.`;
    }

    const tips: string[] = [];
    if (completedFocusSessions.length === 0) {
      tips.push('Gunakan Focus Timer minimal 1–2 sesi Pomodoro (25 menit) per hari untuk tugas prioritas.');
    } else {
      tips.push(`Pertahankan kebiasaan fokus (${completedFocusSessions.length} sesi selesai dengan total ${formatMinutesWithUnit(totalFocusMinutes)}).`);
    }

    if (target?.max_daily_screentime_minutes && avgDaily > target.max_daily_screentime_minutes) {
      tips.push(
        `Rata-rata harian (${formatMinutesWithUnit(avgDaily)}) melebihi target batas harian (${formatMinutesWithUnit(
          target.max_daily_screentime_minutes,
        )}). Kurangi durasi media sosial di malam hari.`,
      );
    } else {
      tips.push('Terapkan aturan 20-20-20: istirahatkan mata selama 20 detik setiap 20 menit menatap layar.');
    }

    tips.push('Lakukan refleksi mingguan di menu Target & Refleksi untuk mengevaluasi kendali diri.');

    return { critique: crit, suggestions: tips };
  }, [grandTotal, productivePct, nonProductivePct, nonProductiveTotal, completedFocusSessions, totalFocusMinutes, target, avgDaily]);

  return (
    <div className="report-root-container">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 100% !important;
            background-color: #ffffff !important;
            font-size: 11px !important;
          }
          .no-print-bar {
            display: none !important;
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
            min-height: 270mm !important;
            height: 270mm !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
        .report-root-container {
          min-height: 100vh;
          background-color: #f1f5f9;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #111827;
        }
        .no-print-bar {
          position: sticky;
          top: 0;
          z-index: 999;
          background-color: #0f172a;
          color: #ffffff;
          padding: 9px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }
        .btn-print-action {
          background-color: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-print-action:hover {
          background-color: #1d4ed8;
        }
        .btn-back-action {
          background-color: transparent;
          color: #cbd5e1;
          border: 1px solid #475569;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .btn-back-action:hover {
          color: #ffffff;
          border-color: #94a3b8;
        }
        .report-paper-a4 {
          max-width: 780px;
          min-height: 270mm;
          margin: 16px auto;
          background-color: #ffffff;
          padding: 24px 28px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        .report-header-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 2px solid #2563eb;
          gap: 12px;
        }
        .brand-logo-img {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          flex-shrink: 0;
        }
        .brand-name-text {
          font-size: 19px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }
        .brand-slogan-text {
          font-size: 10.5px;
          font-weight: 600;
          color: #2563eb;
          letter-spacing: 0.02em;
        }
        .meta-text-box {
          text-align: right;
          font-size: 10.5px;
          color: #4b5563;
          line-height: 1.4;
        }
        .meta-text-box strong {
          color: #111827;
        }
        .period-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 10px 0 12px;
          padding: 4px 10px;
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 5px;
          font-size: 11px;
          color: #1e40af;
          font-weight: 600;
        }
        .metrics-4-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .metric-cell {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 7px 10px;
        }
        .metric-cell-label {
          font-size: 9.5px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .metric-cell-val {
          font-size: 14.5px;
          font-weight: 700;
          color: #111827;
          margin-top: 2px;
        }
        .section-headline {
          font-size: 11.5px;
          font-weight: 700;
          color: #111827;
          margin: 12px 0 5px;
          padding-bottom: 3px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .compact-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          margin-bottom: 8px;
        }
        .compact-table th {
          background-color: #f1f5f9;
          color: #475569;
          text-align: left;
          padding: 4px 7px;
          font-weight: 600;
          font-size: 9.5px;
          text-transform: uppercase;
          border-bottom: 1px solid #cbd5e1;
        }
        .compact-table td {
          padding: 4px 7px;
          border-bottom: 1px solid #f1f5f9;
          color: #1e293b;
        }
        .compact-table tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .bar-bg {
          width: 100%;
          height: 6px;
          background-color: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          background-color: #2563eb;
          border-radius: 999px;
        }
        .badge-compact {
          display: inline-block;
          padding: 1.5px 5px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
        }
        .badge-green {
          background-color: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .badge-gray {
          background-color: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }
        .eval-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          padding: 9px 12px;
          margin-top: 10px;
        }
        .eval-col-title {
          font-size: 10.5px;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 4px;
        }
        .eval-col-desc {
          font-size: 10px;
          color: #334155;
          line-height: 1.45;
        }
        .eval-list {
          padding-left: 14px;
          font-size: 10px;
          color: #334155;
          line-height: 1.4;
          margin: 0;
        }
        .footer-strip {
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid #cbd5e1;
          font-size: 9.5px;
          color: #64748b;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          box-sizing: border-box;
        }
      `}</style>

      {/* Bilah Aksi di Layar */}
      <div className="no-print-bar">
        <div>
          <strong style={{ fontSize: '13px' }}>TimeCraft — Laporan Resmi A4 (1 Halaman)</strong>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn-print-action" onClick={() => window.print()}>
            <Printer size={14} />
            <span>Simpan sebagai PDF / Cetak</span>
          </button>
          <button type="button" className="btn-back-action" onClick={() => navigate('/')}>
            <ArrowLeft size={13} />
            <span>Kembali</span>
          </button>
        </div>
      </div>

      {/* Lembar A4 Tunggal */}
      <div className="report-paper-a4">
        {/* Kop Surat Resmi */}
        <header className="report-header-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg className="brand-logo-img" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="16" fill="#2563EB" />
              <circle cx="32" cy="32" r="20" stroke="#FFFFFF" strokeWidth="4.5" strokeOpacity="0.95" />
              <circle cx="32" cy="32" r="14" stroke="#93C5FD" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M32 20V32L40 37" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="32" cy="12" r="2.5" fill="#EFF6FF" />
            </svg>
            <div>
              <div className="brand-name-text">TimeCraft</div>
              <div className="brand-slogan-text">Screen Time &amp; Focus — Kesadaran Digital &amp; Pengelolaan Waktu</div>
            </div>
          </div>
          <div className="meta-text-box">
            <div>Pengguna: <strong>{user?.display_name}</strong> ({user?.email})</div>
            <div>Zona Waktu: <strong>{timezone}</strong> • Dicetak: <strong>{nowFormatted}</strong></div>
          </div>
        </header>

        {/* Periode Strip */}
        <div className="period-strip">
          <span>Periode Analisis: <strong>{startDate}</strong> s/d <strong>{endDate}</strong></span>
          <span>Status: <strong>{uniqueDays} hari aktif tercatat</strong></span>
        </div>

        {/* 4 Metrik Ringkasan */}
        <div className="metrics-4-row">
          <div className="metric-cell">
            <div className="metric-cell-label">Total Screen Time</div>
            <div className="metric-cell-val">{formatMinutesWithUnit(grandTotal)}</div>
          </div>
          <div className="metric-cell">
            <div className="metric-cell-label">Rata-rata Harian</div>
            <div className="metric-cell-val">{formatMinutesWithUnit(avgDaily)}</div>
          </div>
          <div className="metric-cell">
            <div className="metric-cell-label">Waktu Produktif</div>
            <div className="metric-cell-val">{formatMinutesWithUnit(productiveTotal)} ({productivePct}%)</div>
          </div>
          <div className="metric-cell">
            <div className="metric-cell-label">Sesi Fokus Selesai</div>
            <div className="metric-cell-val">{completedFocusSessions.length} sesi ({formatMinutesWithUnit(totalFocusMinutes)})</div>
          </div>
        </div>

        {/* Tabel Distribusi Kategori */}
        <div className="section-headline">
          <span>Distribusi Waktu Berdasarkan Kategori</span>
          <span style={{ fontSize: '9.5px', color: '#64748b' }}>Dari {filteredLogs.length} catatan aktivitas</span>
        </div>

        <table className="compact-table">
          <thead>
            <tr>
              <th>Kategori Aktivitas</th>
              <th>Klasifikasi</th>
              <th>Durasi</th>
              <th>Persentase</th>
              <th style={{ width: '30%' }}>Proporsi Visual</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(ACTIVITY_CATEGORIES).map((cat) => {
              const mins = totals[cat.id] || 0;
              const pct = grandTotal > 0 ? Math.round((mins / grandTotal) * 100) : 0;
              return (
                <tr key={cat.id}>
                  <td><strong>{cat.label}</strong></td>
                  <td>
                    <span className={`badge-compact ${cat.isProductive ? 'badge-green' : 'badge-gray'}`}>
                      {cat.isProductive ? 'Produktif' : 'Non-Produktif'}
                    </span>
                  </td>
                  <td>{mins} menit ({(mins / 60).toFixed(1)} jam)</td>
                  <td><strong>{pct}%</strong></td>
                  <td>
                    <div className="bar-bg">
                      <div className="bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Bagian Kritik & Saran (Evaluasi Produktivitas & Keseimbangan Digital) */}
        <div className="section-headline" style={{ marginTop: '10px' }}>
          <span>Evaluasi Perilaku &amp; Rekomendasi (Kritik &amp; Saran)</span>
        </div>

        <div className="eval-box">
          <div>
            <div className="eval-col-title">
              <AlertCircle size={13} color="#2563eb" />
              <span>Analisis &amp; Kritik Pola Penggunaan</span>
            </div>
            <p className="eval-col-desc">{evaluation.critique}</p>
          </div>
          <div>
            <div className="eval-col-title">
              <Lightbulb size={13} color="#16a34a" />
              <span>Saran Perbaikan Kebiasaan Layar</span>
            </div>
            <ul className="eval-list">
              {evaluation.suggestions.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Dokumen Resmi */}
        <footer className="footer-strip">
          <div>
            <strong>TimeCraft</strong> — Kesadaran Digital &amp; Pengelolaan Waktu
            <span style={{ color: '#94a3b8', margin: '0 6px' }}>•</span>
            <span style={{ color: '#2563eb', fontWeight: 600 }}>Laporan Evaluasi Resmi</span>
          </div>
          <div>Dokumen Laporan Resmi • Halaman 1 dari 1</div>
        </footer>
      </div>
    </div>
  );
};
