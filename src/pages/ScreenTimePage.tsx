import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Square,
  PlusCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActivityCategory, ACTIVITY_CATEGORIES } from '../types/domain';
import { repository } from '../services/repository';
import {
  buildIsoInTimezone,
  formatDateInTimezone,
  formatMinutesWithUnit,
} from '../utils/time';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const ACTIVE_ACTIVITY_TIMER_KEY = 'timecraft_active_screentime_timer_v1';

interface PersistedActivityTimer {
  userId: string;
  category: ActivityCategory;
  startedAtIso: string;
  notes: string;
}

export const ScreenTimePage: React.FC = () => {
  const { user, logs, refreshUserData } = useApp();
  const timezone = user?.timezone || 'Asia/Jakarta';
  const todayStr = formatDateInTimezone(new Date(), timezone);

  // State Input Manual
  const [category, setCategory] = useState<ActivityCategory>('social_media');
  const [activityDate, setActivityDate] = useState<string>(todayStr);
  const [startTimeHm, setStartTimeHm] = useState<string>('09:00');
  const [endTimeHm, setEndTimeHm] = useState<string>('09:45');
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [pendingDeleteLogId, setPendingDeleteLogId] = useState<string | null>(null);

  // State Timer Aktivitas Langsung (system_timer)
  const [activeTimer, setActiveTimer] = useState<PersistedActivityTimer | null>(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_ACTIVITY_TIMER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PersistedActivityTimer;
      if (user && parsed.userId === user.id) return parsed;
      return null;
    } catch {
      return null;
    }
  });
  const [timerCategory, setTimerCategory] = useState<ActivityCategory>('productive_study');
  const [timerNotes, setTimerNotes] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!activeTimer) {
      setElapsedSeconds(0);
      return;
    }
    const updateElapsed = () => {
      const diffSec = Math.max(
        0,
        Math.floor((Date.now() - Date.parse(activeTimer.startedAtIso)) / 1000),
      );
      setElapsedSeconds(diffSec);
    };
    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [activeTimer]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const startIso = buildIsoInTimezone(activityDate, startTimeHm, timezone);
    const endIso = buildIsoInTimezone(activityDate, endTimeHm, timezone);

    setSubmitting(true);
    try {
      const res = await repository.addScreenTimeLog(user.id, {
        category,
        source: 'manual_input',
        activity_date: activityDate,
        start_time: startIso,
        end_time: endIso,
        notes,
      });

      if (res.error) {
        setFeedbackError(res.error);
      } else {
        setFeedbackSuccess(
          `Catatan berhasil disimpan (${res.data?.duration_minutes} menit).`,
        );
        setNotes('');
        await refreshUserData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartActivityTimer = () => {
    if (!user) return;
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const payload: PersistedActivityTimer = {
      userId: user.id,
      category: timerCategory,
      startedAtIso: new Date().toISOString(),
      notes: timerNotes,
    };
    localStorage.setItem(ACTIVE_ACTIVITY_TIMER_KEY, JSON.stringify(payload));
    setActiveTimer(payload);
  };

  const handleStopAndSaveActivityTimer = async () => {
    if (!user || !activeTimer) return;
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const endedAt = new Date();
    const startMs = Date.parse(activeTimer.startedAtIso);
    const diffSeconds = Math.floor((endedAt.getTime() - startMs) / 1000);

    if (diffSeconds < 30) {
      setFeedbackError(
        'Durasi timer belum mencapai minimal 30 detik. Lanjutkan timer atau batalkan jika tidak jadi mencatat.',
      );
      return;
    }

    const roundedMinutes = Math.max(1, Math.round(diffSeconds / 60));
    const effectiveEndIso = new Date(
      startMs + roundedMinutes * 60000,
    ).toISOString();

    const dateStr = formatDateInTimezone(new Date(startMs), timezone);

    const res = await repository.addScreenTimeLog(user.id, {
      category: activeTimer.category,
      source: 'system_timer',
      activity_date: dateStr,
      start_time: activeTimer.startedAtIso,
      end_time: effectiveEndIso,
      notes: activeTimer.notes || 'Diukur dengan Timer Aktivitas',
    });

    if (res.error) {
      setFeedbackError(res.error);
      return;
    }

    localStorage.removeItem(ACTIVE_ACTIVITY_TIMER_KEY);
    setActiveTimer(null);
    setTimerNotes('');
    setFeedbackSuccess(
      `Sesi aktivitas berhasil disimpan (${res.data?.duration_minutes} menit).`,
    );
    await refreshUserData();
  };

  const handleCancelActivityTimer = () => {
    localStorage.removeItem(ACTIVE_ACTIVITY_TIMER_KEY);
    setActiveTimer(null);
  };

  const confirmDeleteLog = async () => {
    if (!user || !pendingDeleteLogId) return;
    const logId = pendingDeleteLogId;
    setPendingDeleteLogId(null);

    const res = await repository.deleteScreenTimeLog(user.id, logId);
    if (!res.ok) {
      setFeedbackError(res.error || 'Gagal menghapus catatan.');
    } else {
      setFeedbackSuccess('Catatan berhasil dihapus.');
      await refreshUserData();
    }
  };

  const formatTimerClock = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
  };

  return (
    <>
      <ConfirmDialog
        open={Boolean(pendingDeleteLogId)}
        title="Hapus Catatan Screen Time?"
        description="Catatan aktivitas ini akan dihapus secara permanen dari riwayat dan grafik Anda."
        confirmLabel="Hapus Catatan"
        onConfirm={confirmDeleteLog}
        onCancel={() => setPendingDeleteLogId(null)}
      />

      <header className="page-header">
        <div>
          <h1 className="page-title">Pencatatan Screen Time</h1>
          <p className="page-subtitle">
            Catat durasi penggunaan layar secara manual atau hitung langsung menggunakan timer aktivitas.
          </p>
        </div>
      </header>

      {feedbackError && (
        <div className="alert alert-error" role="alert">
          <span>{feedbackError}</span>
        </div>
      )}

      {feedbackSuccess && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      <div className="grid-2">
        {/* Kolom Kiri: Input Manual */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Input Catatan Manual</h2>
              <p className="card-description">
                Masukkan rentang waktu penggunaan aplikasi atau perangkat Anda.
              </p>
            </div>
            <span className="icon-box-blue" aria-hidden="true">
              <PlusCircle size={18} />
            </span>
          </div>

          <form onSubmit={handleManualSubmit}>
            <div className="form-group">
              <label htmlFor="st-category" className="form-label">
                Kategori Aktivitas
              </label>
              <select
                id="st-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ActivityCategory)}
              >
                {Object.values(ACTIVITY_CATEGORIES).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} ({cat.isProductive ? 'Produktif' : 'Non-Produktif'})
                  </option>
                ))}
              </select>
              <span className="form-hint">
                {ACTIVITY_CATEGORIES[category].description}
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="st-date" className="form-label">
                Tanggal Aktivitas
              </label>
              <input
                id="st-date"
                type="date"
                className="form-input"
                value={activityDate}
                max={todayStr}
                onChange={(e) => setActivityDate(e.target.value)}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="st-start" className="form-label">
                  Waktu Mulai
                </label>
                <input
                  id="st-start"
                  type="time"
                  className="form-input"
                  value={startTimeHm}
                  onChange={(e) => setStartTimeHm(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="st-end" className="form-label">
                  Waktu Selesai
                </label>
                <input
                  id="st-end"
                  type="time"
                  className="form-input"
                  value={endTimeHm}
                  onChange={(e) => setEndTimeHm(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="st-notes" className="form-label">
                Keterangan / Aplikasi (Opsional)
              </label>
              <input
                id="st-notes"
                type="text"
                className="form-input"
                placeholder="Contoh: Menonton YouTube atau mengerjakan tugas kuliah"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={160}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Catatan'}
            </button>
          </form>
        </section>

        {/* Kolom Kanan: Timer Aktivitas Langsung */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Timer Aktivitas Langsung</h2>
              <p className="card-description">
                Hitung durasi penggunaan layar secara langsung saat beraktivitas.
              </p>
            </div>
            <span className="icon-box-blue" aria-hidden="true">
              <Clock size={18} />
            </span>
          </div>

          <div className="timer-display-box" style={{ marginBottom: '1.25rem' }}>
            <span className="badge badge-blue">
              {activeTimer ? 'Sedang Mengukur Aktivitas' : 'Timer Siap Dimulai'}
            </span>
            <div className="timer-digits">{formatTimerClock(elapsedSeconds)}</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {activeTimer
                ? `Kategori: ${ACTIVITY_CATEGORIES[activeTimer.category].label}`
                : 'Nyalakan timer sebelum Anda mulai membuka aplikasi.'}
            </p>
          </div>

          {!activeTimer ? (
            <>
              <div className="form-group">
                <label htmlFor="timer-cat" className="form-label">
                  Kategori Aktivitas
                </label>
                <select
                  id="timer-cat"
                  className="form-select"
                  value={timerCategory}
                  onChange={(e) => setTimerCategory(e.target.value as ActivityCategory)}
                >
                  {Object.values(ACTIVITY_CATEGORIES).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="timer-notes" className="form-label">
                  Catatan Sesi (Opsional)
                </label>
                <input
                  id="timer-notes"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Sesi riset artikel"
                  value={timerNotes}
                  onChange={(e) => setTimerNotes(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartActivityTimer}
                style={{ width: '100%' }}
              >
                <Play size={16} />
                <span>Mulai Timer Aktivitas</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStopAndSaveActivityTimer}
                style={{ flex: 1 }}
              >
                <Square size={16} />
                <span>Selesai &amp; Simpan</span>
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleCancelActivityTimer}
              >
                Batalkan
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Daftar Catatan Terbaru */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Catatan Screen Time Terbaru</h2>
            <p className="card-description">
              Menampilkan 8 catatan aktivitas terakhir Anda.
            </p>
          </div>
        </div>

        {logs.length === 0 ? (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Belum ada catatan screen time yang tersimpan.
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
                  <th>Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 8).map((log) => (
                  <tr key={log.id}>
                    <td>{log.activity_date}</td>
                    <td>{ACTIVITY_CATEGORIES[log.category]?.label || log.category}</td>
                    <td>
                      <span
                        className={`badge ${
                          log.source === 'system_timer' ? 'badge-blue' : 'badge-gray'
                        }`}
                      >
                        {log.source === 'system_timer'
                          ? 'Timer Aktivitas'
                          : 'Input Manual'}
                      </span>
                    </td>
                    <td>
                      {formatMinutesWithUnit(log.duration_minutes)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {log.notes || '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '0.32rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => setPendingDeleteLogId(log.id)}
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
