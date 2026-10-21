import React, { useState, useMemo } from 'react';
import { Filter, Trash2, BarChart3, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ACTIVITY_CATEGORIES, ActivityCategory } from '../types/domain';
import { repository } from '../services/repository';
import { formatDateInTimezone, formatMinutesWithUnit } from '../utils/time';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { openPdfReportWindow } from '../utils/pdfExport';

export const AnalyticsPage: React.FC = () => {
  const { user, logs, refreshUserData } = useApp();
  const timezone = user?.timezone || 'Asia/Jakarta';
  const todayStr = formatDateInTimezone(new Date(), timezone);

  const thirtyDaysAgoStr = useMemo(() => {
    const d = new Date(Date.now() - 29 * 86400000);
    return formatDateInTimezone(d, timezone);
  }, [timezone]);

  const [startDateFilter, setStartDateFilter] = useState<string>(thirtyDaysAgoStr);
  const [endDateFilter, setEndDateFilter] = useState<string>(todayStr);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pendingDeleteLogId, setPendingDeleteLogId] = useState<string | null>(null);

  const [deleteFeedback, setDeleteFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const inDateRange =
        l.activity_date >= startDateFilter && l.activity_date <= endDateFilter;
      const inCategory = categoryFilter === 'all' || l.category === categoryFilter;
      return inDateRange && inCategory;
    });
  }, [logs, startDateFilter, endDateFilter, categoryFilter]);

  // Hitung distribusi kategori dari catatan yang difilter
  const categoryBreakdown = useMemo(() => {
    const totals: Record<ActivityCategory, number> = {
      productive_study: 0,
      productive_work: 0,
      social_media: 0,
      entertainment: 0,
      gaming: 0,
      communication: 0,
      other: 0,
    };
    let grandTotal = 0;
    for (const l of filteredLogs) {
      totals[l.category] = (totals[l.category] || 0) + l.duration_minutes;
      grandTotal += l.duration_minutes;
    }
    return { totals, grandTotal };
  }, [filteredLogs]);

  // Hitung kelengkapan data pada rentang tanggal yang dipilih
  const dataCompleteness = useMemo(() => {
    const startMs = Date.parse(`${startDateFilter}T00:00:00Z`);
    const endMs = Date.parse(`${endDateFilter}T00:00:00Z`);
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
      return { totalDaysInRange: 0, recordedDaysCount: 0, statusLabel: 'Rentang tidak valid' };
    }
    const totalDaysInRange = Math.round((endMs - startMs) / 86400000) + 1;
    const uniqueDates = new Set(filteredLogs.map((l) => l.activity_date));
    const recordedDaysCount = uniqueDates.size;

    let statusLabel = 'Belum tersedia (0 hari tercatat)';
    if (recordedDaysCount > 0 && recordedDaysCount < totalDaysInRange) {
      statusLabel = `Data Parsial (${recordedDaysCount} dari ${totalDaysInRange} hari memiliki catatan)`;
    } else if (recordedDaysCount >= totalDaysInRange && totalDaysInRange > 0) {
      statusLabel = `Data Lengkap (${recordedDaysCount} dari ${totalDaysInRange} hari tercatat)`;
    }

    return { totalDaysInRange, recordedDaysCount, statusLabel };
  }, [startDateFilter, endDateFilter, filteredLogs]);

  const handleExportPdf = () => {
    openPdfReportWindow({
      startDate: startDateFilter,
      endDate: endDateFilter,
    });
  };

  const confirmDeleteLog = async () => {
    if (!user || !pendingDeleteLogId) return;
    const logId = pendingDeleteLogId;
    setPendingDeleteLogId(null);

    const res = await repository.deleteScreenTimeLog(user.id, logId);
    if (res.ok) {
      setDeleteFeedback({
        type: 'success',
        message: 'Catatan riwayat berhasil dihapus dan grafik telah diperbarui.',
      });
      await refreshUserData();
    } else {
      setDeleteFeedback({
        type: 'error',
        message: res.error || 'Gagal menghapus catatan riwayat.',
      });
    }
  };

  return (
    <>
      <ConfirmDialog
        open={Boolean(pendingDeleteLogId)}
        title="Hapus Catatan Riwayat?"
        description="Apakah Anda yakin ingin menghapus catatan ini secara permanen dari riwayat dan analitik?"
        confirmLabel="Hapus Permanen"
        onConfirm={confirmDeleteLog}
        onCancel={() => setPendingDeleteLogId(null)}
      />

      {deleteFeedback && (
        <div
          className={`alert ${
            deleteFeedback.type === 'error' ? 'alert-error' : 'alert-success'
          }`}
          role="status"
        >
          <span>{deleteFeedback.message}</span>
        </div>
      )}

      <header className="page-header">
        <div>
          <h1 className="page-title">Riwayat &amp; Analitik</h1>
          <p className="page-subtitle">
            Pantau distribusi penggunaan waktu dan unduh laporan aktivitas Anda.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExportPdf}
            title="Buka pratinjau cetak dan simpan sebagai PDF resmi A4"
          >
            <FileText size={15} />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </header>

      {/* Filter Rentang Tanggal & Kategori */}
      <section className="card" style={{ padding: '1.15rem 1.5rem' }}>
        <div className="grid-3">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-start" className="form-label">
              Dari Tanggal
            </label>
            <input
              id="filter-start"
              type="date"
              className="form-input"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-end" className="form-label">
              Sampai Tanggal
            </label>
            <input
              id="filter-end"
              type="date"
              className="form-input"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-cat" className="form-label">
              <Filter
                size={13}
                color="var(--primary-blue)"
                style={{ display: 'inline', marginRight: '0.3rem' }}
              />
              Kategori Aktivitas
            </label>
            <select
              id="filter-cat"
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Semua Kategori</option>
              {Object.values(ACTIVITY_CATEGORIES).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Ringkasan Statistik Filter */}
      <section className="grid-3">
        <div className="card">
          <div className="stat-card-header">
            <span>Hari Aktif Tercatat</span>
          </div>
          <div
            className={`stat-card-value ${
              dataCompleteness.recordedDaysCount === 0 ? 'empty' : ''
            }`}
          >
            {dataCompleteness.recordedDaysCount === 0
              ? 'Belum ada catatan'
              : `${dataCompleteness.recordedDaysCount} dari ${dataCompleteness.totalDaysInRange} hari`}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Periode {startDateFilter} s/d {endDateFilter}
          </div>
        </div>

        <div className="card">
          <div className="stat-card-header">
            <span>Total Durasi</span>
          </div>
          <div
            className={`stat-card-value ${
              filteredLogs.length === 0 ? 'empty' : ''
            }`}
          >
            {filteredLogs.length === 0
              ? 'Belum ada data'
              : formatMinutesWithUnit(categoryBreakdown.grandTotal)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Dari {filteredLogs.length} catatan aktivitas
          </div>
        </div>

        <div className="card">
          <div className="stat-card-header">
            <span>Rata-rata Harian</span>
          </div>
          <div
            className={`stat-card-value ${
              dataCompleteness.recordedDaysCount === 0 ? 'empty' : ''
            }`}
          >
            {dataCompleteness.recordedDaysCount === 0
              ? 'Belum tersedia'
              : formatMinutesWithUnit(
                  Math.round(
                    categoryBreakdown.grandTotal / dataCompleteness.recordedDaysCount,
                  ),
                )}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Rata-rata per hari aktif yang tercatat
          </div>
        </div>
      </section>

      {/* Grafik Proporsi per Kategori */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Distribusi Waktu per Kategori</h2>
            <p className="card-description">
              Proporsi durasi penggunaan layar berdasarkan kategori pada rentang tanggal ini.
            </p>
          </div>
          <span className="icon-box-blue" aria-hidden="true">
            <BarChart3 size={18} />
          </span>
        </div>

        {categoryBreakdown.grandTotal === 0 ? (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Belum ada data aktivitas pada rentang tanggal yang dipilih.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {Object.values(ACTIVITY_CATEGORIES).map((cat) => {
              const mins = categoryBreakdown.totals[cat.id] || 0;
              const pct =
                categoryBreakdown.grandTotal > 0
                  ? Math.round((mins / categoryBreakdown.grandTotal) * 100)
                  : 0;
              return (
                <div key={cat.id}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      marginBottom: '0.3rem',
                    }}
                  >
                    <span>
                      <strong>{cat.label}</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                        ({cat.isProductive ? 'Produktif' : 'Non-Produktif'})
                      </span>
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {mins} menit ({pct}%)
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Tabel Lengkap dengan Konfirmasi Hapus */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              Riwayat Catatan Aktivitas ({filteredLogs.length})
            </h2>
            <p className="card-description">
              Daftar catatan penggunaan layar sesuai filter tanggal dan kategori.
            </p>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Tidak ada catatan aktivitas pada rentang tanggal ini.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Metode</th>
                  <th>Durasi</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l) => (
                  <tr key={l.id}>
                    <td>{l.activity_date}</td>
                    <td>{ACTIVITY_CATEGORIES[l.category]?.label}</td>
                    <td>
                      <span
                        className={`badge ${
                          l.source === 'system_timer' ? 'badge-blue' : 'badge-gray'
                        }`}
                      >
                        {l.source === 'system_timer' ? 'Timer Aktivitas' : 'Input Manual'}
                      </span>
                    </td>
                    <td>{l.duration_minutes} menit</td>
                    <td>{l.notes || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '0.32rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => setPendingDeleteLogId(l.id)}
                      >
                        <Trash2 size={13} />
                        <span>Hapus</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
};
