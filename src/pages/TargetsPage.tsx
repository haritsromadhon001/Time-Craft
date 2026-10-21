import React, { useState, useEffect } from 'react';
import { Target, BookOpen, Trash2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { repository } from '../services/repository';
import { formatDateInTimezone, formatMinutesWithUnit } from '../utils/time';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const TargetsPage: React.FC = () => {
  const { user, target, reflections, refreshUserData } = useApp();
  const timezone = user?.timezone || 'Asia/Jakarta';
  const todayStr = formatDateInTimezone(new Date(), timezone);

  const [maxScreenTime, setMaxScreenTime] = useState<string>(
    target?.max_daily_screentime_minutes ? String(target.max_daily_screentime_minutes) : '180',
  );
  const [minFocusTime, setMinFocusTime] = useState<string>(
    target?.min_daily_focus_minutes ? String(target.min_daily_focus_minutes) : '60',
  );
  const [scheduleNote, setScheduleNote] = useState<string>(
    target?.preferred_focus_schedule ?? 'Pukul 08:00 - 10:00 WIB & 19:30 - 21:00 WIB',
  );

  const [moodScore, setMoodScore] = useState<number>(4);
  const [winsNote, setWinsNote] = useState<string>('');
  const [improvementPlan, setImprovementPlan] = useState<string>('');

  const [msgSuccess, setMsgSuccess] = useState<string | null>(null);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);

  useEffect(() => {
    if (target) {
      setMaxScreenTime(
        target.max_daily_screentime_minutes ? String(target.max_daily_screentime_minutes) : '',
      );
      setMinFocusTime(
        target.min_daily_focus_minutes ? String(target.min_daily_focus_minutes) : '',
      );
      setScheduleNote(target.preferred_focus_schedule ?? '');
    }
  }, [target]);

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMsgError(null);
    setMsgSuccess(null);

    const parsedMax = maxScreenTime.trim() ? Number(maxScreenTime) : null;
    const parsedMin = minFocusTime.trim() ? Number(minFocusTime) : null;

    const res = await repository.saveUserTarget(user.id, {
      max_daily_screentime_minutes: parsedMax,
      min_daily_focus_minutes: parsedMin,
      preferred_focus_schedule: scheduleNote,
    });

    if (res.error) {
      setMsgError(res.error);
    } else {
      setMsgSuccess('Target harian dan jadwal fokus berhasil diperbarui.');
      await refreshUserData();
    }
  };

  const confirmDeleteTarget = async () => {
    if (!user) return;
    setConfirmDeleteOpen(false);

    const res = await repository.deleteUserTarget(user.id);
    if (res.ok) {
      setMaxScreenTime('');
      setMinFocusTime('');
      setScheduleNote('');
      setMsgSuccess('Target harian telah dihapus.');
      await refreshUserData();
    }
  };

  const handleAddReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMsgError(null);
    setMsgSuccess(null);

    const res = await repository.addWeeklyReflection(user.id, {
      reflection_date: todayStr,
      mood_score: moodScore,
      wins_note: winsNote,
      improvement_plan: improvementPlan,
    });

    if (res.error) {
      setMsgError(res.error);
    } else {
      setWinsNote('');
      setImprovementPlan('');
      setMsgSuccess('Jurnal refleksi berhasil disimpan.');
      await refreshUserData();
    }
  };

  return (
    <>
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Hapus Pengaturan Target Harian?"
        description="Batas maksimal screen time dan minimal durasi fokus harian Anda akan direset."
        confirmLabel="Hapus Target"
        onConfirm={confirmDeleteTarget}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      <header className="page-header">
        <div>
          <h1 className="page-title">Target &amp; Refleksi</h1>
          <p className="page-subtitle">
            Tetapkan batas screen time harian, target waktu fokus, dan catat evaluasi mingguan Anda.
          </p>
        </div>
      </header>

      {msgError && (
        <div className="alert alert-error" role="alert">
          <span>{msgError}</span>
        </div>
      )}

      {msgSuccess && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{msgSuccess}</span>
        </div>
      )}

      <div className="grid-2">
        {/* Form Target Harian */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Pengaturan Target Harian</h2>
              <p className="card-description">
                Anda dapat mengubah atau menghapus target milik Anda kapan saja.
              </p>
            </div>
            <span className="icon-box-blue" aria-hidden="true">
              <Target size={18} />
            </span>
          </div>

          <form onSubmit={handleSaveTarget}>
            <div className="form-group">
              <label htmlFor="target-max-st" className="form-label">
                Batas Maksimal Screen Time Harian (Menit)
              </label>
              <input
                id="target-max-st"
                type="number"
                className="form-input"
                min={15}
                max={1440}
                placeholder="Contoh: 180 (3 jam)"
                value={maxScreenTime}
                onChange={(e) => setMaxScreenTime(e.target.value)}
              />
              <span className="form-hint">
                Saat ini:{' '}
                {target?.max_daily_screentime_minutes
                  ? formatMinutesWithUnit(target.max_daily_screentime_minutes)
                  : 'Belum diatur'}
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="target-min-focus" className="form-label">
                Target Minimal Durasi Fokus Harian (Menit)
              </label>
              <input
                id="target-min-focus"
                type="number"
                className="form-input"
                min={10}
                max={720}
                placeholder="Contoh: 90 (1 jam 30 menit)"
                value={minFocusTime}
                onChange={(e) => setMinFocusTime(e.target.value)}
              />
              <span className="form-hint">
                Saat ini:{' '}
                {target?.min_daily_focus_minutes
                  ? formatMinutesWithUnit(target.min_daily_focus_minutes)
                  : 'Belum diatur'}
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="target-schedule" className="form-label">
                Jadwal Fokus Rutin Anda
              </label>
              <input
                id="target-schedule"
                type="text"
                className="form-input"
                placeholder="Contoh: Pagi 08:00-10:00 & Malam 20:00-21:00"
                value={scheduleNote}
                onChange={(e) => setScheduleNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Simpan Target
              </button>
              {target && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setConfirmDeleteOpen(true)}
                  title="Hapus target"
                >
                  <Trash2 size={15} />
                  <span>Hapus Target</span>
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Form Jurnal & Refleksi Mingguan */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Refleksi Mingguan &amp; Jurnal Singkat</h2>
              <p className="card-description">
                Evaluasi kebiasaan digital Anda secara sadar dan realistis.
              </p>
            </div>
            <span className="icon-box-blue" aria-hidden="true">
              <BookOpen size={18} />
            </span>
          </div>

          <form onSubmit={handleAddReflection}>
            <div className="form-group">
              <label htmlFor="refl-mood" className="form-label">
                Skor Kendali Diri Minggu Ini (1 = Sangat Terdistraksi, 5 = Sangat Terkendali)
              </label>
              <select
                id="refl-mood"
                className="form-select"
                value={moodScore}
                onChange={(e) => setMoodScore(Number(e.target.value))}
              >
                <option value={5}>5 — Sangat Terkendali &amp; Fokus</option>
                <option value={4}>4 — Cukup Terkendali</option>
                <option value={3}>3 — Netral / Kadang Terdistraksi</option>
                <option value={2}>2 — Sering Scrolling Tanpa Rencana</option>
                <option value={1}>1 — Sangat Terdistraksi</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="refl-wins" className="form-label">
                Hal Positif yang Berhasil Dicapai
              </label>
              <textarea
                id="refl-wins"
                className="form-textarea"
                placeholder="Contoh: Berhasil tidak membuka media sosial saat jam belajar pagi."
                value={winsNote}
                onChange={(e) => setWinsNote(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="refl-plan" className="form-label">
                Rencana Perbaikan Minggu Depan (Opsional)
              </label>
              <input
                id="refl-plan"
                type="text"
                className="form-input"
                placeholder="Contoh: Menaruh ponsel di luar meja kerja setelah pukul 22:00"
                value={improvementPlan}
                onChange={(e) => setImprovementPlan(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Simpan Catatan Refleksi
            </button>
          </form>
        </section>
      </div>

      {/* Daftar Riwayat Refleksi */}
      <section className="card">
        <h2 className="card-title" style={{ marginBottom: '0.75rem' }}>
          Riwayat Jurnal &amp; Refleksi Anda
        </h2>
        {reflections.length === 0 ? (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Belum ada catatan refleksi mingguan.
          </p>
        ) : (
          <div className="grid-2">
            {reflections.map((item) => (
              <div key={item.id} className="card-elevated">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span
                    className="mono"
                    style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                  >
                    {item.reflection_date}
                  </span>
                  <span className="badge badge-blue">Skor Kendali: {item.mood_score}/5</span>
                </div>
                <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.35rem' }}>
                  {item.wins_note}
                </p>
                {item.improvement_plan && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>Rencana:</strong> {item.improvement_plan}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
};
