// ============================================================================
// TIMECRAFT — UTILITAS ZONA WAKTU & INTEGRITAS TANGGAL
// ============================================================================
// Mencegah bug pergantian hari akibat perbedaan UTC vs Zona Waktu Lokal.
// ============================================================================

/**
 * Mengambil zona waktu lokal perangkat pengguna dari browser (misal: "Asia/Jakarta").
 */
export function getDetectedTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
  } catch {
    return 'Asia/Jakarta';
  }
}

/**
 * Mengubah objek Date menjadi string YYYY-MM-DD yang akurat pada zona waktu tertentu.
 * Ini menjaga agar aktivitas pukul 23:30 WIB tidak tercatat sebagai hari berikutnya (UTC).
 */
export function formatDateInTimezone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Mengonversi kombinasi tanggal (YYYY-MM-DD) dan jam-menit (HH:mm) pada zona waktu
 * pilihan pengguna menjadi ISO-8601 timestamp UTC yang akurat.
 * Mencegah pergeseran hari apabila zona waktu profil pengguna berbeda dari jam OS.
 */
export function buildIsoInTimezone(
  dateYmd: string,
  timeHm: string,
  timeZone: string,
): string {
  const [year, month, day] = dateYmd.split('-').map(Number);
  const [hour, minute] = timeHm.split(':').map(Number);

  // Gunakan tebakan awal sebagai UTC
  const utcGuessMs = Date.UTC(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, 0);
  const guessDate = new Date(utcGuessMs);

  // Hitung bagaimana utcGuessMs direpresentasikan di dalam timeZone target
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(guessDate);

  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      map[p.type] = Number(p.value);
    }
  }

  const representedAsUtcMs = Date.UTC(
    map.year,
    (map.month || 1) - 1,
    map.day || 1,
    map.hour || 0,
    map.minute || 0,
    map.second || 0,
  );

  const tzOffsetMs = representedAsUtcMs - utcGuessMs;
  return new Date(utcGuessMs - tzOffsetMs).toISOString();
}

/**
 * Memformat durasi menit menjadi teks bahasa Indonesia yang jelas dengan satuannya.
 * Penting untuk aturan integritas data:
 * - Jika nilai `null` (belum ada catatan), kembalikan "Belum ada data", BUKAN "0 menit".
 */
export function formatMinutesWithUnit(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) {
    return 'Belum ada data';
  }
  if (minutes < 0 || Number.isNaN(minutes)) {
    return 'Data tidak valid';
  }
  if (minutes === 0) {
    return '0 menit';
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours === 0) {
    return `${remainingMinutes} menit`;
  }
  if (remainingMinutes === 0) {
    return `${hours} jam`;
  }
  return `${hours} jam ${remainingMinutes} menit`;
}

/**
 * Memvalidasi rentang waktu mulai dan selesai agar tidak negatif atau terbalik.
 */
export function validateTimeRange(
  startIso: string,
  endIso: string,
): { valid: boolean; durationMinutes: number; error?: string } {
  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return {
      valid: false,
      durationMinutes: 0,
      error: 'Format waktu mulai atau waktu selesai tidak valid.',
    };
  }

  if (endMs <= startMs) {
    return {
      valid: false,
      durationMinutes: 0,
      error: 'Waktu selesai harus lebih besar daripada waktu mulai (durasi tidak boleh nol atau negatif).',
    };
  }

  const diffMinutes = Math.round((endMs - startMs) / 60000);
  if (diffMinutes > 1440) {
    return {
      valid: false,
      durationMinutes: 0,
      error: 'Durasi satu sesi catatan tidak boleh melebihi 24 jam (1440 menit).',
    };
  }

  return {
    valid: true,
    durationMinutes: Math.max(1, diffMinutes),
  };
}
