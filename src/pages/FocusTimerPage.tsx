import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Coffee,
  Timer,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { repository } from '../services/repository';
import { formatDateInTimezone } from '../utils/time';

const FOCUS_STORAGE_KEY = 'timecraft_persisted_focus_state_v1';

type TimerPhase = 'focus' | 'break';

interface PersistedFocusState {
  userId: string;
  phase: TimerPhase;
  plannedFocusMinutes: number;
  plannedBreakMinutes: number;
  taskLabel: string;
  startedAtIso: string;
  accumulatedSecondsBeforeCurrentRun: number;
  currentRunStartedAtMs: number | null;
}

export const FocusTimerPage: React.FC = () => {
  const { user, focusSessions, refreshUserData } = useApp();
  const timezone = user?.timezone || 'Asia/Jakarta';

  const [plannedFocusMinutes, setPlannedFocusMinutes] = useState<number>(25);
  const [plannedBreakMinutes, setPlannedBreakMinutes] = useState<number>(5);
  const [taskLabel, setTaskLabel] = useState<string>('');

  const [persisted, setPersisted] = useState<PersistedFocusState | null>(() => {
    try {
      const raw = localStorage.getItem(FOCUS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PersistedFocusState;
      if (user && parsed.userId === user.id) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isFinalizingRef = useRef<boolean>(false);

  const savePersisted = useCallback((next: PersistedFocusState | null) => {
    setPersisted(next);
    if (next) {
      localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(FOCUS_STORAGE_KEY);
    }
  }, []);

  const computeCurrentElapsed = useCallback((state: PersistedFocusState | null): number => {
    if (!state) return 0;
    if (state.currentRunStartedAtMs === null) {
      return state.accumulatedSecondsBeforeCurrentRun;
    }
    const delta = Math.max(0, Math.floor((Date.now() - state.currentRunStartedAtMs) / 1000));
    return state.accumulatedSecondsBeforeCurrentRun + delta;
  }, []);

  const finalizeFocusSession = useCallback(
    async (state: PersistedFocusState, status: 'completed' | 'interrupted', actualSeconds: number) => {
      if (!user || isFinalizingRef.current) return;
      isFinalizingRef.current = true;
      setErrorMessage(null);

      try {
        const endedIso = new Date().toISOString();
        const sessionDate = formatDateInTimezone(new Date(state.startedAtIso), timezone);

        const res = await repository.addFocusSession(user.id, {
          planned_focus_minutes: state.plannedFocusMinutes,
          planned_break_minutes: state.plannedBreakMinutes,
          actual_focus_seconds: Math.max(1, actualSeconds),
          status,
          session_date: sessionDate,
          started_at: state.startedAtIso,
          ended_at: endedIso,
          task_label: state.taskLabel || undefined,
        });

        if (res.error) {
          setErrorMessage(res.error);
          return;
        }

        await refreshUserData();

        if (status === 'completed') {
          if (state.plannedBreakMinutes > 0) {
            savePersisted({
              ...state,
              phase: 'break',
              accumulatedSecondsBeforeCurrentRun: 0,
              currentRunStartedAtMs: Date.now(),
            });
            setStatusMessage(
              `Sesi fokus ${state.plannedFocusMinutes} menit selesai! Waktunya istirahat selama ${state.plannedBreakMinutes} menit.`,
            );
          } else {
            savePersisted(null);
            setStatusMessage(
              `Sesi fokus ${state.plannedFocusMinutes} menit telah selesai dan disimpan.`,
            );
          }
        } else {
          savePersisted(null);
          setStatusMessage(
            `Sesi dihentikan lebih awal dan dicatat (${Math.max(
              1,
              Math.round(actualSeconds / 60),
            )} menit berjalan).`,
          );
        }
      } finally {
        isFinalizingRef.current = false;
      }
    },
    [user, timezone, refreshUserData, savePersisted],
  );

  useEffect(() => {
    if (!persisted) {
      setElapsedSeconds(0);
      return;
    }

    const tick = () => {
      const currentSec = computeCurrentElapsed(persisted);
      setElapsedSeconds(currentSec);

      const targetSec =
        persisted.phase === 'focus'
          ? persisted.plannedFocusMinutes * 60
          : persisted.plannedBreakMinutes * 60;

      if (currentSec >= targetSec) {
        if (persisted.phase === 'focus') {
          void finalizeFocusSession(persisted, 'completed', targetSec);
        } else {
          savePersisted(null);
          setStatusMessage('Waktu istirahat selesai! Anda siap memulai sesi fokus berikutnya.');
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [persisted, computeCurrentElapsed, finalizeFocusSession, savePersisted]);

  const handleStart = () => {
    if (!user) return;
    setStatusMessage(null);
    setErrorMessage(null);

    const nextState: PersistedFocusState = {
      userId: user.id,
      phase: 'focus',
      plannedFocusMinutes,
      plannedBreakMinutes,
      taskLabel: taskLabel.trim(),
      startedAtIso: new Date().toISOString(),
      accumulatedSecondsBeforeCurrentRun: 0,
      currentRunStartedAtMs: Date.now(),
    };
    savePersisted(nextState);
  };

  const handlePause = () => {
    if (!persisted || persisted.currentRunStartedAtMs === null) return;
    const totalNow = computeCurrentElapsed(persisted);
    savePersisted({
      ...persisted,
      accumulatedSecondsBeforeCurrentRun: totalNow,
      currentRunStartedAtMs: null,
    });
  };

  const handleResume = () => {
    if (!persisted || persisted.currentRunStartedAtMs !== null) return;
    savePersisted({
      ...persisted,
      currentRunStartedAtMs: Date.now(),
    });
  };

  const handleStopIncomplete = async () => {
    if (!persisted) return;
    const currentSec = computeCurrentElapsed(persisted);

    if (persisted.phase === 'break') {
      savePersisted(null);
      setStatusMessage('Waktu istirahat diakhiri.');
      return;
    }

    if (currentSec < 15) {
      savePersisted(null);
      setStatusMessage('Sesi dibatalkan karena berjalan kurang dari 15 detik.');
      return;
    }

    await finalizeFocusSession(persisted, 'interrupted', currentSec);
  };

  const targetTotalSeconds = persisted
    ? (persisted.phase === 'focus'
        ? persisted.plannedFocusMinutes
        : persisted.plannedBreakMinutes) * 60
    : plannedFocusMinutes * 60;

  const remainingSeconds = Math.max(0, targetTotalSeconds - elapsedSeconds);
  const displayMinutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const displaySecs = String(remainingSeconds % 60).padStart(2, '0');

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Focus Timer</h1>
          <p className="page-subtitle">
            Kelola waktu belajar dan bekerja secara terfokus dengan jeda istirahat teratur.
          </p>
        </div>
      </header>

      {errorMessage && (
        <div className="alert alert-error" role="alert">
          <span>{errorMessage}</span>
        </div>
      )}

      {statusMessage && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid-2">
        {/* Panel Timer Aktif */}
        <section className="card">
          <div className="timer-display-box">
            <span className={`badge ${persisted?.phase === 'break' ? 'badge-info' : 'badge-teal'}`}>
              {persisted ? (
                persisted.phase === 'break' ? (
                  <>
                    <Coffee size={13} />
                    <span>Waktu Istirahat</span>
                  </>
                ) : persisted.currentRunStartedAtMs === null ? (
                  'Sesi Fokus Dijeda'
                ) : (
                  'Sedang Fokus'
                )
              ) : (
                'Siap Memulai Fokus'
              )}
            </span>

            <div className="timer-digits">
              {displayMinutes}:{displaySecs}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {persisted
                ? `Tugas: ${persisted.taskLabel || 'Fokus Umum'} (${Math.floor(
                    elapsedSeconds / 60,
                  )}m ${elapsedSeconds % 60}d berlalu)`
                : `Target: ${plannedFocusMinutes} menit fokus • ${plannedBreakMinutes} menit istirahat`}
            </div>

            {/* Tombol Kontrol */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {!persisted ? (
                <button type="button" className="btn btn-primary" onClick={handleStart}>
                  <Play size={16} />
                  <span>Mulai Sesi Fokus</span>
                </button>
              ) : (
                <>
                  {persisted.currentRunStartedAtMs !== null ? (
                    <button type="button" className="btn btn-secondary" onClick={handlePause}>
                      <Pause size={16} />
                      <span>Jeda</span>
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary" onClick={handleResume}>
                      <Play size={16} />
                      <span>Lanjutkan</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleStopIncomplete}
                    title="Akhiri sesi sebelum waktu habis"
                  >
                    <RotateCcw size={16} />
                    <span>
                      {persisted.phase === 'break'
                        ? 'Lewati Istirahat'
                        : 'Akhiri Sesi'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Pengaturan Durasi Fokus & Istirahat */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Pengaturan Sesi Fokus</h2>
              <p className="card-description">
                Sesuaikan durasi fokus dan waktu istirahat Anda.
              </p>
            </div>
            <span className="icon-box-blue" aria-hidden="true">
              <Timer size={18} />
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="focus-task" className="form-label">
              Nama Tugas / Fokus (Opsional)
            </label>
            <input
              id="focus-task"
              type="text"
              className="form-input"
              placeholder="Contoh: Membaca Bab 3 Struktur Data"
              value={taskLabel}
              disabled={Boolean(persisted)}
              onChange={(e) => setTaskLabel(e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="focus-mins" className="form-label">
                Durasi Fokus (Menit)
              </label>
              <input
                id="focus-mins"
                type="number"
                className="form-input"
                min={1}
                max={180}
                value={plannedFocusMinutes}
                disabled={Boolean(persisted)}
                onChange={(e) =>
                  setPlannedFocusMinutes(Math.max(1, Math.min(180, Number(e.target.value) || 25)))
                }
              />
              <span className="form-hint">Rekomendasi: 25 atau 50 menit per sesi.</span>
            </div>

            <div className="form-group">
              <label htmlFor="break-mins" className="form-label">
                Durasi Istirahat (Menit)
              </label>
              <input
                id="break-mins"
                type="number"
                className="form-input"
                min={0}
                max={60}
                value={plannedBreakMinutes}
                disabled={Boolean(persisted)}
                onChange={(e) =>
                  setPlannedBreakMinutes(Math.max(0, Math.min(60, Number(e.target.value) || 0)))
                }
              />
              <span className="form-hint">Rekomendasi: 5 atau 10 menit istirahat.</span>
            </div>
          </div>

          {/* Preset Cepat */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={Boolean(persisted)}
              onClick={() => {
                setPlannedFocusMinutes(25);
                setPlannedBreakMinutes(5);
              }}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
            >
              Pomodoro (25m / 5m)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={Boolean(persisted)}
              onClick={() => {
                setPlannedFocusMinutes(50);
                setPlannedBreakMinutes(10);
              }}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
            >
              Deep Work (50m / 10m)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={Boolean(persisted)}
              onClick={() => {
                setPlannedFocusMinutes(15);
                setPlannedBreakMinutes(3);
              }}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
            >
              Fokus Singkat (15m / 3m)
            </button>
          </div>
        </section>
      </div>

      {/* Tabel Riwayat Sesi Fokus */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Riwayat Sesi Fokus</h2>
            <p className="card-description">
              Daftar sesi fokus yang telah selesai maupun yang dihentikan lebih awal.
            </p>
          </div>
        </div>

        {focusSessions.length === 0 ? (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Belum ada riwayat sesi fokus yang tercatat.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Tugas / Fokus</th>
                  <th>Status</th>
                  <th>Target</th>
                  <th>Durasi Aktual</th>
                </tr>
              </thead>
              <tbody>
                {focusSessions.slice(0, 10).map((s) => (
                  <tr key={s.id}>
                    <td>{s.session_date}</td>
                    <td>{s.task_label || 'Fokus Umum'}</td>
                    <td>
                      <span
                        className={`badge ${
                          s.status === 'completed' ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {s.status === 'completed' ? 'Selesai' : 'Dihentikan'}
                      </span>
                    </td>
                    <td>{s.planned_focus_minutes} menit</td>
                    <td>
                      {Math.floor(s.actual_focus_seconds / 60)}m {s.actual_focus_seconds % 60}d
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
