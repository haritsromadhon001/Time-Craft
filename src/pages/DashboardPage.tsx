import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Timer,
  Target,
  TrendingUp,
  Info,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { computeDashboardSummary } from '../utils/analytics';
import { formatMinutesWithUnit, formatDateInTimezone } from '../utils/time';
import { openPdfReportWindow } from '../utils/pdfExport';
import { LiveClock } from '../components/ui/LiveClock';

export const DashboardPage: React.FC = () => {
  const { user, logs, focusSessions, target, loadingData, dataError } = useApp();
  const timezone = user?.timezone || 'Asia/Jakarta';

  const summary = useMemo(
    () =>
      computeDashboardSummary({
        logs,
        focusSessions,
        target,
        timezone,
      }),
    [logs, focusSessions, target, timezone],
  );

  if (loadingData) {
    return (
      <section className="card" aria-busy="true">
        <h1 className="card-title">Memuat Data Dashboard...</h1>
        <p className="card-description">
          Sedang mengambil catatan aktivitas asli milik akun Anda.
        </p>
      </section>
    );
  }

  if (dataError) {
    return (
      <section className="card">
        <div className="alert alert-error" role="alert">
          <AlertTriangle size={18} />
          <div>
            <strong>Gagal Memuat Data Database:</strong> {dataError}
            <p style={{ marginTop: '0.25rem' }}>
              Sesuai aturan integritas TimeCraft, kami tidak menyembunyikan kegagalan ini
              dengan menampilkan angka palsu.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const hasAnyDataEver = logs.length > 0 || focusSessions.length > 0;
  const maxDailyChartMinutes = Math.max(
    60,
    ...summary.last7DaysSeries.map((d) => d.totalMinutes ?? 0),
  );

  const handleExportPdf = () => {
    const thirtyDaysAgoStr = formatDateInTimezone(
      new Date(Date.now() - 29 * 86400000),
      timezone,
    );
    openPdfReportWindow({
      startDate: thirtyDaysAgoStr,
      endDate: summary.todayDate,
    });
  };

  return (
    <>
      {/* Header Ringkas & Tombol Aksi Utama */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Halo, {user?.display_name}</h1>
          <p className="page-subtitle">
            Ringkasan aktivitas hari ini • Zona waktu {summary.timezone}
          </p>
        </div>

        {/* Jam Klien Real-Time (Live Client Clock Widget) */}
        <LiveClock timezone={summary.timezone} variant="dashboard" />

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportPdf}
            title="Cetak atau simpan laporan PDF dengan logo TimeCraft"
          >
            <FileText size={16} color="var(--primary-blue)" />
            <span>Laporan PDF</span>
          </button>
          <Link to="/screen-time" className="btn btn-secondary">
            <PlusCircle size={16} color="var(--primary-blue)" />
            <span>Catat Screen Time</span>
          </Link>
          <Link to="/focus-timer" className="btn btn-primary">
            <Timer size={16} />
            <span>Mulai Fokus</span>
          </Link>
        </div>
      </header>

      {/* Peringatan Visual Jika Target Hampir / Sudah Tercapai */}
      {summary.screenTimeTargetPercentage !== null &&
        summary.screenTimeTargetPercentage >= 80 && (
          <div
            className={`alert ${
              summary.screenTimeTargetPercentage >= 100 ? 'alert-error' : 'alert-warning'
            }`}
            role="status"
            style={{ marginBottom: 0 }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <div>
              <strong>
                {summary.screenTimeTargetPercentage >= 100
                  ? 'Batas Screen Time Harian Terlewati'
                  : 'Mendekati Batas Screen Time Harian'}
              </strong>
              <p>
                Penggunaan layar hari ini sudah mencapai{' '}
                <strong>{summary.screenTimeTargetPercentage}%</strong> dari target batas harian
                Anda ({formatMinutesWithUnit(summary.screenTimeTargetMinutes)}).
              </p>
            </div>
          </div>
        )}

      {/* Empty State Ringkas & Bersih untuk Pengguna Baru */}
      {!hasAnyDataEver && (
        <section
          className="card"
          style={{
            borderColor: 'var(--border-blue-subtle)',
            backgroundColor: 'var(--surface-blue-light)',
            padding: '1.1rem 1.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              className="icon-box-blue"
              style={{ backgroundColor: 'var(--bg-primary)' }}
              aria-hidden="true"
            >
              <Info size={18} />
            </span>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Selamat datang di TimeCraft
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Belum ada aktivitas yang tercatat. Mulai atur target harian atau catat penggunaan layar Anda.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/targets" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
              Atur Target
            </Link>
            <Link to="/screen-time" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
              Catat Aktivitas
            </Link>
            <Link to="/focus-timer" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
              Mulai Fokus
            </Link>
          </div>
        </section>
      )}

      {/* 4 Kartu Ringkasan Utama Hari Ini */}
      <section className="grid-4" aria-label="Metrik Utama Hari Ini">
        {/* Kartu 1: Screen Time Hari Ini */}
        <div className="card">
          <div className="stat-card-header">
            <span>Screen Time Hari Ini</span>
            <span className="icon-box-blue" aria-hidden="true">
              <Clock size={18} />
            </span>
          </div>
          <div
            className={`stat-card-value ${
              summary.todayTotalMinutes === null ? 'empty' : ''
            }`}
          >
            {formatMinutesWithUnit(summary.todayTotalMinutes)}
          </div>
          {summary.todayTotalMinutes !== null ? (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Manual: <strong>{summary.todayManualMinutes}m</strong> • Timer:{' '}
              <strong>{summary.todayTimerMinutes}m</strong>
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Belum ada aktivitas hari ini
            </div>
          )}
        </div>

        {/* Kartu 2: Total Sesi Fokus Selesai */}
        <div className="card">
          <div className="stat-card-header">
            <span>Sesi Fokus Hari Ini</span>
            <span className="icon-box-blue" aria-hidden="true">
              <Timer size={18} />
            </span>
          </div>
          <div
            className={`stat-card-value ${
              summary.todayCompletedFocusCount === 0 &&
              summary.todayInterruptedFocusCount === 0
                ? 'empty'
                : ''
            }`}
          >
            {summary.todayCompletedFocusCount === 0 &&
            summary.todayInterruptedFocusCount === 0
              ? 'Belum ada sesi'
              : `${summary.todayCompletedFocusCount} sesi selesai`}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Total durasi: {formatMinutesWithUnit(summary.todayFocusMinutes)}
          </div>
        </div>

        {/* Kartu 3: Rata-rata Durasi Fokus */}
        <div className="card">
          <div className="stat-card-header">
            <span>Rata-rata Sesi Fokus</span>
            <span className="icon-box-blue" aria-hidden="true">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div
            className={`stat-card-value ${
              summary.averageCompletedFocusMinutes === null ? 'empty' : ''
            }`}
          >
            {summary.averageCompletedFocusMinutes === null
              ? 'Belum tersedia'
              : `${summary.averageCompletedFocusMinutes} menit`}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Waktu produktif:{' '}
            {summary.todayTotalMinutes !== null
              ? `${summary.todayProductiveMinutes} menit`
              : 'Belum ada data'}
          </div>
        </div>

        {/* Kartu 4: Perbandingan Periode 7 Hari */}
        <div className="card">
          <div className="stat-card-header">
            <span>Tren 7 Hari</span>
            <span className="icon-box-blue" aria-hidden="true">
              <TrendingUp size={18} />
            </span>
          </div>
          <div
            className={`stat-card-value ${
              summary.periodComparisonDeltaPercent === null ? 'empty' : ''
            }`}
          >
            {summary.periodComparisonDeltaPercent === null
              ? 'Belum cukup data'
              : `${summary.periodComparisonDeltaPercent > 0 ? '+' : ''}${
                  summary.periodComparisonDeltaPercent
                }%`}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {summary.periodComparisonDeltaPercent === null
              ? 'Dibandingkan 7 hari sebelumnya'
              : `${summary.current7DaysTotalMinutes}m vs ${summary.previous7DaysTotalMinutes}m minggu lalu`}
          </div>
        </div>
      </section>

      {/* Progress Target Harian & Grafik 7 Hari Terakhir */}
      <div className="grid-2">
        {/* Panel Pencapaian Target Harian */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Status Target Harian</h2>
              <p className="card-description">
                Progres pencapaian batas penggunaan layar dan waktu fokus hari ini.
              </p>
            </div>
            <span className="icon-box-blue" aria-hidden="true">
              <Target size={18} />
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Target 1: Batas Screen Time */}
            <div className="card-elevated">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  marginBottom: '0.45rem',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Batas Maksimal Screen Time
                </span>
                <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                  {summary.screenTimeTargetMinutes === null
                    ? 'Target belum diatur'
                    : `${summary.todayTotalMinutes ?? 0} / ${
                        summary.screenTimeTargetMinutes
                      } menit (${summary.screenTimeTargetPercentage ?? 0}%)`}
                </span>
              </div>
              {summary.screenTimeTargetMinutes !== null ? (
                <div className="progress-track">
                  <div
                    className={`progress-fill ${
                      (summary.screenTimeTargetPercentage ?? 0) >= 100
                        ? 'danger'
                        : (summary.screenTimeTargetPercentage ?? 0) >= 80
                          ? 'warning'
                          : ''
                    }`}
                    style={{
                      width: `${Math.min(100, summary.screenTimeTargetPercentage ?? 0)}%`,
                    }}
                  />
                </div>
              ) : (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Anda belum menetapkan batas harian.{' '}
                  <Link
                    to="/targets"
                    style={{ color: 'var(--primary-blue)', fontWeight: 600 }}
                  >
                    Atur di halaman Target →
                  </Link>
                </p>
              )}
            </div>

            {/* Target 2: Minimal Durasi Fokus */}
            <div className="card-elevated">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  marginBottom: '0.45rem',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Target Minimal Waktu Fokus
                </span>
                <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                  {summary.focusTargetMinutes === null
                    ? 'Target belum diatur'
                    : `${summary.todayFocusMinutes ?? 0} / ${
                        summary.focusTargetMinutes
                      } menit (${summary.focusTargetPercentage ?? 0}%)`}
                </span>
              </div>
              {summary.focusTargetMinutes !== null ? (
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, summary.focusTargetPercentage ?? 0)}%`,
                    }}
                  />
                </div>
              ) : (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Anda belum menetapkan target fokus harian.{' '}
                  <Link
                    to="/targets"
                    style={{ color: 'var(--primary-blue)', fontWeight: 600 }}
                  >
                    Atur di halaman Target →
                  </Link>
                </p>
              )}
            </div>

            {target?.preferred_focus_schedule && (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Sparkles size={15} color="var(--primary-blue)" />
                <span>
                  <strong>Jadwal Fokus Pilihan:</strong> {target.preferred_focus_schedule}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Panel Grafik Penggunaan 7 Hari Terakhir */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Grafik Screen Time 7 Hari Terakhir</h2>
              <p className="card-description">
                Satuan: Menit per hari • Timer Sistem (Biru Utama) vs Input Manual (Biru Muda)
              </p>
            </div>
          </div>

          <div
            className="bar-chart-grid"
            role="img"
            aria-label="Grafik batang screen time 7 hari terakhir"
          >
            {summary.last7DaysSeries.map((day) => {
              if (day.totalMinutes === null) {
                return (
                  <div
                    key={day.date}
                    className="bar-column"
                    title={`${day.date}: Belum ada data`}
                  >
                    <span
                      className="bar-value-label"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      —
                    </span>
                    <div className="bar-empty-slot">Kosong</div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {day.shortLabel}
                    </span>
                  </div>
                );
              }

              const heightPct = Math.max(
                8,
                Math.round((day.totalMinutes / maxDailyChartMinutes) * 145),
              );
              const timerRatio =
                day.totalMinutes > 0
                  ? Math.round((day.timerMinutes / day.totalMinutes) * 100)
                  : 0;
              const manualRatio = 100 - timerRatio;

              return (
                <div
                  key={day.date}
                  className="bar-column"
                  title={`${day.date}: Total ${day.totalMinutes} menit (Timer: ${day.timerMinutes}m, Manual: ${day.manualMinutes}m)`}
                >
                  <span className="bar-value-label">{day.totalMinutes}m</span>
                  <div className="bar-stack" style={{ height: `${heightPct}px` }}>
                    {day.timerMinutes > 0 && (
                      <div
                        className="bar-segment-timer"
                        style={{ height: `${timerRatio}%` }}
                      />
                    )}
                    {day.manualMinutes > 0 && (
                      <div
                        className="bar-segment-manual"
                        style={{ height: `${manualRatio}%` }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                    }}
                  >
                    {day.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Keterangan (Legend) Grafik */}
          <div
            style={{
              display: 'flex',
              gap: '1.25rem',
              flexWrap: 'wrap',
              marginTop: '0.85rem',
              fontSize: '0.76rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 3,
                  backgroundColor: 'var(--primary-blue)',
                  display: 'inline-block',
                }}
              />
              Timer Aktivitas
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 3,
                  backgroundColor: 'var(--secondary-blue-chart)',
                  display: 'inline-block',
                }}
              />
              Input Manual
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                style={{
                  width: 12,
                  height: 10,
                  border: '1px dashed var(--border-strong)',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'inline-block',
                }}
              />
              Belum Ada Catatan
            </span>
          </div>
        </section>
      </div>

      {/* Ringkasan Bulanan (30 Hari Terakhir) */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Ringkasan 30 Hari Terakhir</h2>
            <p className="card-description">
              Akumulasi penggunaan layar dan proporsi waktu produktif dalam sebulan terakhir.
            </p>
          </div>
          <span className="icon-box-blue" aria-hidden="true">
            <TrendingUp size={18} />
          </span>
        </div>

        {logs.length === 0 ? (
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Ringkasan bulanan akan muncul setelah Anda mencatat aktivitas.
          </p>
        ) : (
          <div className="grid-3">
            <div className="card-elevated">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Hari Aktif Tercatat
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: '0.4rem 0',
                  color: 'var(--text-primary)',
                }}
              >
                {new Set(logs.map((l) => l.activity_date)).size} hari
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Dari total {logs.length} catatan aktivitas
              </div>
            </div>

            <div className="card-elevated">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Total Screen Time
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: '0.4rem 0',
                  color: 'var(--text-primary)',
                }}
              >
                {formatMinutesWithUnit(
                  logs.reduce((acc, l) => acc + l.duration_minutes, 0),
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Gabungan input manual &amp; timer aktivitas
              </div>
            </div>

            <div className="card-elevated">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Proporsi Aktivitas Produktif
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: '0.4rem 0',
                  color: 'var(--primary-blue)',
                }}
              >
                {(() => {
                  const total = logs.reduce((acc, l) => acc + l.duration_minutes, 0);
                  const prod = logs
                    .filter(
                      (l) =>
                        l.category === 'productive_study' ||
                        l.category === 'productive_work',
                    )
                    .reduce((acc, l) => acc + l.duration_minutes, 0);
                  return total > 0
                    ? `${Math.round((prod / total) * 100)}% (${prod} menit)`
                    : 'Belum tersedia';
                })()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Kategori Belajar &amp; Pekerjaan
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};
