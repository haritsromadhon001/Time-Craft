import { describe, it, expect } from 'vitest';
import {
  formatMinutesWithUnit,
  validateTimeRange,
  formatDateInTimezone,
  buildIsoInTimezone,
} from '../utils/time';

describe('Utilitas Integritas Waktu & Durasi (TimeCraft)', () => {
  it('membedakan data kosong (null) dari angka 0 menit', () => {
    expect(formatMinutesWithUnit(null)).toBe('Belum ada data');
    expect(formatMinutesWithUnit(undefined)).toBe('Belum ada data');
    expect(formatMinutesWithUnit(0)).toBe('0 menit');
    expect(formatMinutesWithUnit(45)).toBe('45 menit');
    expect(formatMinutesWithUnit(125)).toBe('2 jam 5 menit');
  });

  it('menolak rentang waktu negatif atau waktu mulai melewati waktu selesai', () => {
    const start = '2026-10-19T14:00:00.000Z';
    const endBeforeStart = '2026-10-19T13:30:00.000Z';

    const result = validateTimeRange(start, endBeforeStart);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('menghitung durasi menit dengan benar untuk rentang waktu yang valid', () => {
    const start = '2026-10-19T10:00:00.000Z';
    const end = '2026-10-19T11:30:00.000Z';

    const result = validateTimeRange(start, end);
    expect(result.valid).toBe(true);
    expect(result.durationMinutes).toBe(90);
  });

  it('menjaga tanggal tetap akurat sesuai zona waktu lokal saat larut malam', () => {
    // Pukul 17:30 UTC tanggal 19 Oktober adalah pukul 00:30 WIB tanggal 20 Oktober di Asia/Jakarta
    const utcDate = new Date('2026-10-19T17:30:00.000Z');
    expect(formatDateInTimezone(utcDate, 'Asia/Jakarta')).toBe('2026-10-20');
    expect(formatDateInTimezone(utcDate, 'UTC')).toBe('2026-10-19');
  });

  it('mengonversi tanggal dan jam pada zona waktu profil pengguna ke ISO UTC secara presisi', () => {
    // Pukul 00:30 tanggal 2026-10-20 di Asia/Jakarta (UTC+7) harus sama dengan 2026-10-19T17:30:00.000Z
    const isoJakarta = buildIsoInTimezone('2026-10-20', '00:30', 'Asia/Jakarta');
    expect(isoJakarta).toBe('2026-10-19T17:30:00.000Z');

    // Dan jika diformat kembali ke tanggal di Asia/Jakarta, tetap 2026-10-20 (tidak bergeser hari)
    expect(formatDateInTimezone(new Date(isoJakarta), 'Asia/Jakarta')).toBe('2026-10-20');
  });
});
