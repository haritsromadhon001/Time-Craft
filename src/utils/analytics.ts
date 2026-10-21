import {
  ActivityCategory,
  ACTIVITY_CATEGORIES,
  FocusSession,
  ScreenTimeLog,
  UserTarget,
} from '../types/domain';
import { formatDateInTimezone, validateTimeRange } from './time';

// ============================================================================
// TIMECRAFT — LOGIKA BISNIS, VALIDASI ANTI-DUPLIKASI, & ANALITIK MURNI
// ============================================================================
// Mematuhi Aturan Integritas Data (#6):
// - Tidak pernah menghasilkan angka palsu.
// - Jika tidak ada catatan, metrik rata-rata atau perbandingan bernilai `null`.
// - Mendeteksi tumpang tindih waktu (overlap) antara input manual dan timer
//   agar tidak terjadi penghitungan ganda (double counting).
// ============================================================================

export interface OverlapCheckResult {
  hasOverlap: boolean;
  conflictingLog?: ScreenTimeLog;
  message?: string;
}

/**
 * Memeriksa apakah catatan baru bertabrakan (tumpang tindih waktu) dengan catatan
 * pengguna yang sudah ada di tanggal yang sama, guna mencegah penghitungan ganda.
 */
export function checkScreenTimeOverlap(
  existingLogs: ScreenTimeLog[],
  newStartIso: string,
  newEndIso: string,
): OverlapCheckResult {
  const newStart = Date.parse(newStartIso);
  const newEnd = Date.parse(newEndIso);

  if (Number.isNaN(newStart) || Number.isNaN(newEnd)) {
    return { hasOverlap: false };
  }

  for (const log of existingLogs) {
    const existingStart = Date.parse(log.start_time);
    const existingEnd = Date.parse(log.end_time);
    if (Number.isNaN(existingStart) || Number.isNaN(existingEnd)) continue;

    // Dua interval [A, B] dan [C, D] bertabrakan jika A < D dan C < B
    if (newStart < existingEnd && existingStart < newEnd) {
      const catLabel = ACTIVITY_CATEGORIES[log.category]?.label || log.category;
      const sourceLabel =
        log.source === 'system_timer' ? 'Timer Aktivitas' : 'Input Manual';
      return {
        hasOverlap: true,
        conflictingLog: log,
        message: `Rentang waktu ini bertabrakan dengan catatan "${catLabel}" (${sourceLabel}) yang sudah tercatat. Hindari pencatatan ganda pada jam yang sama.`,
      };
    }
  }

  return { hasOverlap: false };
}

/**
 * Memvalidasi input catatan screen time secara menyeluruh sebelum disimpan.
 */
export function validateScreenTimeInput(params: {
  category: ActivityCategory;
  startIso: string;
  endIso: string;
  existingLogs: ScreenTimeLog[];
}): { valid: boolean; durationMinutes: number; error?: string } {
  if (!ACTIVITY_CATEGORIES[params.category]) {
    return {
      valid: false,
      durationMinutes: 0,
      error: 'Kategori aktivitas tidak valid.',
    };
  }

  const timeValidation = validateTimeRange(params.startIso, params.endIso);
  if (!timeValidation.valid) {
    return timeValidation;
  }

  const overlap = checkScreenTimeOverlap(
    params.existingLogs,
    params.startIso,
    params.endIso,
  );
  if (overlap.hasOverlap) {
    return {
      valid: false,
      durationMinutes: 0,
      error: overlap.message,
    };
  }

  return {
    valid: true,
    durationMinutes: timeValidation.durationMinutes,
  };
}

export interface DailySeriesPoint {
  date: string; // YYYY-MM-DD
  shortLabel: string; // misal: "Sen, 19 Okt"
  totalMinutes: number | null; // null jika belum ada catatan sama sekali pada hari itu
  manualMinutes: number;
  timerMinutes: number;
  productiveMinutes: number;
  nonProductiveMinutes: number;
  logCount: number;
  focusCompletedCount: number;
  focusCompletedMinutes: number;
}

export interface DashboardSummary {
  todayDate: string;
  timezone: string;
  // Screen Time Hari Ini
  todayTotalMinutes: number | null; // null jika belum ada catatan hari ini
  todayManualMinutes: number;
  todayTimerMinutes: number;
  todayProductiveMinutes: number;
  todayLogCount: number;
  // Fokus Hari Ini
  todayCompletedFocusCount: number;
  todayInterruptedFocusCount: number;
  todayFocusMinutes: number | null; // null jika belum ada sesi fokus hari ini
  averageCompletedFocusMinutes: number | null; // null jika belum ada sesi selesai
  // Target & Persentase Pencapaian
  screenTimeTargetMinutes: number | null;
  screenTimeTargetPercentage: number | null; // null jika target belum diatur atau belum ada data
  focusTargetMinutes: number | null;
  focusTargetPercentage: number | null;
  // Perbandingan Periode 7 Hari Terakhir vs 7 Hari Sebelumnya
  current7DaysTotalMinutes: number | null;
  previous7DaysTotalMinutes: number | null;
  periodComparisonDeltaPercent: number | null; // Hanya dihitung jika KEDUA periode memiliki data
  // Deret Harian 7 Hari Terakhir untuk Grafik
  last7DaysSeries: DailySeriesPoint[];
}

/**
 * Menghitung daftar tanggal YYYY-MM-DD mundur sejumlah `days` dari hari referensi.
 */
export function getRecentDatesInTimezone(
  referenceDate: Date,
  timezone: string,
  days: number,
): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(referenceDate.getTime() - i * 86400000);
    result.push(formatDateInTimezone(d, timezone));
  }
  return result;
}

/**
 * Menghitung seluruh metrik Dashboard secara jujur dari daftar catatan nyata.
 */
export function computeDashboardSummary(params: {
  logs: ScreenTimeLog[];
  focusSessions: FocusSession[];
  target: UserTarget | null;
  timezone: string;
  now?: Date;
}): DashboardSummary {
  const now = params.now ?? new Date();
  const todayDate = formatDateInTimezone(now, params.timezone);

  const todayLogs = params.logs.filter((l) => l.activity_date === todayDate);
  const todayLogCount = todayLogs.length;

  let todayManualMinutes = 0;
  let todayTimerMinutes = 0;
  let todayProductiveMinutes = 0;

  for (const log of todayLogs) {
    if (log.source === 'manual_input') {
      todayManualMinutes += log.duration_minutes;
    } else {
      todayTimerMinutes += log.duration_minutes;
    }
    if (ACTIVITY_CATEGORIES[log.category]?.isProductive) {
      todayProductiveMinutes += log.duration_minutes;
    }
  }

  const todayTotalMinutes =
    todayLogCount > 0 ? todayManualMinutes + todayTimerMinutes : null;

  // Sesi Fokus Hari Ini & Rata-rata Sesi Selesai
  const todayFocus = params.focusSessions.filter(
    (s) => s.session_date === todayDate,
  );
  const todayCompletedFocus = todayFocus.filter(
    (s) => s.status === 'completed',
  );
  const todayInterruptedFocus = todayFocus.filter(
    (s) => s.status === 'interrupted',
  );

  const todayFocusMinutes =
    todayCompletedFocus.length > 0
      ? Math.round(
          todayCompletedFocus.reduce(
            (acc, s) => acc + s.actual_focus_seconds,
            0,
          ) / 60,
        )
      : null;

  const allCompletedFocus = params.focusSessions.filter(
    (s) => s.status === 'completed',
  );
  const averageCompletedFocusMinutes =
    allCompletedFocus.length > 0
      ? Math.round(
          allCompletedFocus.reduce(
            (acc, s) => acc + s.actual_focus_seconds / 60,
            0,
          ) / allCompletedFocus.length,
        )
      : null;

  // Target & Persentase
  const screenTimeTargetMinutes =
    params.target?.max_daily_screentime_minutes ?? null;
  const screenTimeTargetPercentage =
    screenTimeTargetMinutes !== null &&
    screenTimeTargetMinutes > 0 &&
    todayTotalMinutes !== null
      ? Math.round((todayTotalMinutes / screenTimeTargetMinutes) * 100)
      : null;

  const focusTargetMinutes = params.target?.min_daily_focus_minutes ?? null;
  const focusTargetPercentage =
    focusTargetMinutes !== null &&
    focusTargetMinutes > 0 &&
    todayFocusMinutes !== null
      ? Math.round((todayFocusMinutes / focusTargetMinutes) * 100)
      : null;

  // Deret 14 hari terakhir untuk perbandingan periode (7 hari berjalan vs 7 hari sebelumnya)
  const last14Dates = getRecentDatesInTimezone(now, params.timezone, 14);
  const previous7Dates = new Set(last14Dates.slice(0, 7));
  const current7Dates = last14Dates.slice(7, 14);

  const prev7Logs = params.logs.filter((l) =>
    previous7Dates.has(l.activity_date),
  );
  const curr7Logs = params.logs.filter((l) =>
    current7Dates.includes(l.activity_date),
  );

  const previous7DaysTotalMinutes =
    prev7Logs.length > 0
      ? prev7Logs.reduce((acc, l) => acc + l.duration_minutes, 0)
      : null;

  const current7DaysTotalMinutes =
    curr7Logs.length > 0
      ? curr7Logs.reduce((acc, l) => acc + l.duration_minutes, 0)
      : null;

  const periodComparisonDeltaPercent =
    previous7DaysTotalMinutes !== null &&
    previous7DaysTotalMinutes > 0 &&
    current7DaysTotalMinutes !== null
      ? Math.round(
          ((current7DaysTotalMinutes - previous7DaysTotalMinutes) /
            previous7DaysTotalMinutes) *
            100,
        )
      : null;

  // Bangun deret 7 hari terakhir untuk grafik
  const last7DaysSeries: DailySeriesPoint[] = current7Dates.map((dateStr) => {
    const dayLogs = params.logs.filter((l) => l.activity_date === dateStr);
    const dayCompletedFocus = params.focusSessions.filter(
      (s) => s.session_date === dateStr && s.status === 'completed',
    );

    let manual = 0;
    let timer = 0;
    let prod = 0;
    let nonProd = 0;

    for (const l of dayLogs) {
      if (l.source === 'manual_input') manual += l.duration_minutes;
      else timer += l.duration_minutes;

      if (ACTIVITY_CATEGORIES[l.category]?.isProductive) {
        prod += l.duration_minutes;
      } else {
        nonProd += l.duration_minutes;
      }
    }

    const [yyyy, mm, dd] = dateStr.split('-').map(Number);
    const labelDate = new Date(Date.UTC(yyyy, mm - 1, dd, 12, 0, 0));
    const shortLabel = new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(labelDate);

    return {
      date: dateStr,
      shortLabel,
      totalMinutes: dayLogs.length > 0 ? manual + timer : null,
      manualMinutes: manual,
      timerMinutes: timer,
      productiveMinutes: prod,
      nonProductiveMinutes: nonProd,
      logCount: dayLogs.length,
      focusCompletedCount: dayCompletedFocus.length,
      focusCompletedMinutes: Math.round(
        dayCompletedFocus.reduce((acc, s) => acc + s.actual_focus_seconds, 0) /
          60,
      ),
    };
  });

  return {
    todayDate,
    timezone: params.timezone,
    todayTotalMinutes,
    todayManualMinutes,
    todayTimerMinutes,
    todayProductiveMinutes,
    todayLogCount,
    todayCompletedFocusCount: todayCompletedFocus.length,
    todayInterruptedFocusCount: todayInterruptedFocus.length,
    todayFocusMinutes,
    averageCompletedFocusMinutes,
    screenTimeTargetMinutes,
    screenTimeTargetPercentage,
    focusTargetMinutes,
    focusTargetPercentage,
    current7DaysTotalMinutes,
    previous7DaysTotalMinutes,
    periodComparisonDeltaPercent,
    last7DaysSeries,
  };
}
