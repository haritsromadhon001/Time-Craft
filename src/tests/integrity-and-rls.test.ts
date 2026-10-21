import { describe, it, expect, beforeEach } from 'vitest';
import { TimeCraftRepository } from '../services/repository';
import { computeDashboardSummary } from '../utils/analytics';

describe('Integritas Data, Anti-Duplikasi, & Isolasi Antar Pengguna (RLS)', () => {
  let repo: TimeCraftRepository;

  beforeEach(() => {
    window.localStorage.clear();
    repo = new TimeCraftRepository(window.localStorage);
  });

  it('memastikan akun baru benar-benar kosong (tanpa dummy data) dan dashboard menampilkan null, bukan 0 palsu', async () => {
    const reg = await repo.registerAccount({
      email: 'fulan@example.com',
      password: 'password123',
      displayName: 'Fulan',
      timezone: 'Asia/Jakarta',
    });

    expect(reg.error).toBeUndefined();
    expect(reg.user).not.toBeNull();

    const logsRes = await repo.getScreenTimeLogs(reg.user!.id);
    const focusRes = await repo.getFocusSessions(reg.user!.id);
    const targetRes = await repo.getUserTarget(reg.user!.id);

    expect(logsRes.data).toHaveLength(0);
    expect(focusRes.data).toHaveLength(0);
    expect(targetRes.data).toBeNull();

    const summary = computeDashboardSummary({
      logs: logsRes.data,
      focusSessions: focusRes.data,
      target: targetRes.data,
      timezone: 'Asia/Jakarta',
    });

    // Aturan integritas #6: Jangan mengubah data kosong menjadi angka nol tanpa membedakan maknanya
    expect(summary.todayTotalMinutes).toBeNull();
    expect(summary.todayFocusMinutes).toBeNull();
    expect(summary.averageCompletedFocusMinutes).toBeNull();
    expect(summary.periodComparisonDeltaPercent).toBeNull();
  });

  it('mengisolasi data antara 2 akun berbeda (Uji Kebijakan RLS Akun A vs Akun B)', async () => {
    // 1. Buat Akun A dan catat aktivitas rahasia milik Akun A
    const userARes = await repo.registerAccount({
      email: 'akun_a@example.com',
      password: 'passwordA123',
      displayName: 'Pengguna A',
      timezone: 'Asia/Jakarta',
    });
    const userA = userARes.user!;

    const logARes = await repo.addScreenTimeLog(userA.id, {
      category: 'productive_study',
      source: 'manual_input',
      activity_date: '2026-10-19',
      start_time: '2026-10-19T08:00:00.000Z',
      end_time: '2026-10-19T09:30:00.000Z',
      notes: 'Belajar Algoritma Milik Akun A',
    });
    expect(logARes.data?.duration_minutes).toBe(90);

    // Logout Akun A
    await repo.logoutAccount();

    // 2. Buat Akun B
    const userBRes = await repo.registerAccount({
      email: 'akun_b@example.com',
      password: 'passwordB123',
      displayName: 'Pengguna B',
      timezone: 'Asia/Jakarta',
    });
    const userB = userBRes.user!;

    // 3. Pastikan daftar catatan Akun B benar-benar kosong (tidak bocor dari Akun A)
    const logsB = await repo.getScreenTimeLogs(userB.id);
    expect(logsB.data).toHaveLength(0);

    // 4. Pastikan Akun B ditolak jika mencoba membaca atau menghapus data milik Akun A
    const unauthorizedRead = await repo.getScreenTimeLogs(userA.id);
    expect(unauthorizedRead.data).toHaveLength(0);
    expect(unauthorizedRead.error).toContain('RLS');

    const unauthorizedDelete = await repo.deleteScreenTimeLog(
      userB.id,
      logARes.data!.id,
    );
    expect(unauthorizedDelete.ok).toBe(false);
  });

  it('mencegah penghitungan ganda (double counting) saat rentang waktu bertabrakan', async () => {
    const reg = await repo.registerAccount({
      email: 'overlap@example.com',
      password: 'password123',
      displayName: 'Tester Overlap',
    });
    const user = reg.user!;

    // Catatan pertama: 10:00 - 11:00 (Timer Sistem)
    const first = await repo.addScreenTimeLog(user.id, {
      category: 'productive_work',
      source: 'system_timer',
      activity_date: '2026-10-19',
      start_time: '2026-10-19T10:00:00.000Z',
      end_time: '2026-10-19T11:00:00.000Z',
    });
    expect(first.error).toBeUndefined();

    // Catatan kedua: 10:30 - 11:30 (Input Manual — bertabrakan 30 menit!)
    const overlapping = await repo.addScreenTimeLog(user.id, {
      category: 'social_media',
      source: 'manual_input',
      activity_date: '2026-10-19',
      start_time: '2026-10-19T10:30:00.000Z',
      end_time: '2026-10-19T11:30:00.000Z',
    });

    expect(overlapping.data).toBeNull();
    expect(overlapping.error).toContain('bertabrakan');
  });

  it('tidak menghitung sesi fokus yang terputus (interrupted) sebagai sesi selesai penuh (completed)', async () => {
    const reg = await repo.registerAccount({
      email: 'focus@example.com',
      password: 'password123',
      displayName: 'Focus Tester',
      timezone: 'UTC',
    });
    const user = reg.user!;

    // Simpan 1 sesi terputus (interrupted)
    await repo.addFocusSession(user.id, {
      planned_focus_minutes: 25,
      planned_break_minutes: 5,
      actual_focus_seconds: 300, // baru 5 menit
      status: 'interrupted',
      session_date: '2026-10-19',
      started_at: '2026-10-19T08:00:00.000Z',
      ended_at: '2026-10-19T08:05:00.000Z',
    });

    const focusList = await repo.getFocusSessions(user.id);
    const summary = computeDashboardSummary({
      logs: [],
      focusSessions: focusList.data,
      target: null,
      timezone: 'UTC',
      now: new Date('2026-10-19T12:00:00.000Z'),
    });

    expect(summary.todayCompletedFocusCount).toBe(0);
    expect(summary.todayInterruptedFocusCount).toBe(1);
    expect(summary.todayFocusMinutes).toBeNull();
    expect(summary.averageCompletedFocusMinutes).toBeNull();
  });

  it('menghitung persentase pencapaian target harian dan perbandingan periode 7 hari secara akurat', async () => {
    const reg = await repo.registerAccount({
      email: 'analytics@example.com',
      password: 'password123',
      displayName: 'Analytics Tester',
      timezone: 'UTC',
    });
    const user = reg.user!;

    // Setel target harian: maksimal 120 menit screen time, minimal 50 menit fokus
    await repo.saveUserTarget(user.id, {
      max_daily_screentime_minutes: 120,
      min_daily_focus_minutes: 50,
      preferred_focus_schedule: 'Pagi 08:00 - 10:00',
    });

    // Catatan pada periode 7 hari lalu (misal: 2026-10-10 = 100 menit)
    await repo.addScreenTimeLog(user.id, {
      category: 'entertainment',
      source: 'manual_input',
      activity_date: '2026-10-10',
      start_time: '2026-10-10T10:00:00.000Z',
      end_time: '2026-10-10T11:40:00.000Z',
    });

    // Catatan pada hari ini (2026-10-19): 60 menit manual + 30 menit timer = 90 menit
    await repo.addScreenTimeLog(user.id, {
      category: 'productive_study',
      source: 'manual_input',
      activity_date: '2026-10-19',
      start_time: '2026-10-19T08:00:00.000Z',
      end_time: '2026-10-19T09:00:00.000Z',
    });
    await repo.addScreenTimeLog(user.id, {
      category: 'social_media',
      source: 'system_timer',
      activity_date: '2026-10-19',
      start_time: '2026-10-19T10:00:00.000Z',
      end_time: '2026-10-19T10:30:00.000Z',
    });

    // Sesi fokus selesai hari ini: 25 menit (1500 detik)
    await repo.addFocusSession(user.id, {
      planned_focus_minutes: 25,
      planned_break_minutes: 5,
      actual_focus_seconds: 1500,
      status: 'completed',
      session_date: '2026-10-19',
      started_at: '2026-10-19T07:00:00.000Z',
      ended_at: '2026-10-19T07:25:00.000Z',
      task_label: 'Belajar TypeScript',
    });

    const [logsRes, focusRes, targetRes] = await Promise.all([
      repo.getScreenTimeLogs(user.id),
      repo.getFocusSessions(user.id),
      repo.getUserTarget(user.id),
    ]);

    const summary = computeDashboardSummary({
      logs: logsRes.data,
      focusSessions: focusRes.data,
      target: targetRes.data,
      timezone: 'UTC',
      now: new Date('2026-10-19T15:00:00.000Z'),
    });

    expect(summary.todayTotalMinutes).toBe(90);
    expect(summary.todayManualMinutes).toBe(60);
    expect(summary.todayTimerMinutes).toBe(30);
    expect(summary.todayProductiveMinutes).toBe(60);
    expect(summary.screenTimeTargetPercentage).toBe(75); // 90 / 120 = 75%
    expect(summary.todayFocusMinutes).toBe(25);
    expect(summary.focusTargetPercentage).toBe(50); // 25 / 50 = 50%
    expect(summary.periodComparisonDeltaPercent).toBe(-10); // (90 - 100) / 100 = -10%
  });

  it('mendukung penyimpanan refleksi mingguan dan penghapusan bersih seluruh data milik pengguna', async () => {
    const reg = await repo.registerAccount({
      email: 'cleanup@example.com',
      password: 'password123',
      displayName: 'Cleanup Tester',
    });
    const user = reg.user!;

    const refl = await repo.addWeeklyReflection(user.id, {
      reflection_date: '2026-10-19',
      mood_score: 5,
      wins_note: 'Berhasil menjaga fokus belajar tanpa terdistraksi notifikasi.',
      improvement_plan: 'Pertahankan jadwal tidur pukul 22:00.',
    });
    expect(refl.error).toBeUndefined();

    const beforeDelete = await repo.getWeeklyReflections(user.id);
    expect(beforeDelete.data).toHaveLength(1);

    const delRes = await repo.deleteAllMyData(user.id);
    expect(delRes.ok).toBe(true);

    const afterDelete = await repo.getWeeklyReflections(user.id);
    expect(afterDelete.data).toHaveLength(0);
  });

  it('mendukung pengubahan gambar profil (avatar) dan menghapusnya kembali', async () => {
    const reg = await repo.registerAccount({
      email: 'avatar_test@example.com',
      password: 'password123',
      displayName: 'Avatar Tester',
      timezone: 'Asia/Jakarta',
    });
    const user = reg.user!;
    expect(user.avatar_url).toBeNull();

    // 1. Perbarui foto profil dengan base64 image data url
    const dummyAvatarData = 'data:image/jpeg;base64,dGVzdGF2YXRhcmRhdGE=';
    const updateRes = await repo.updateProfile({
      userId: user.id,
      displayName: 'Avatar Tester Updated',
      timezone: 'Asia/Jakarta',
      avatarUrl: dummyAvatarData,
    });

    expect(updateRes.error).toBeUndefined();
    expect(updateRes.profile?.avatar_url).toBe(dummyAvatarData);
    expect(updateRes.profile?.display_name).toBe('Avatar Tester Updated');

    // 2. Verifikasi saat user diambil kembali dari sesi aktif
    const currentUser = await repo.getCurrentUser();
    expect(currentUser?.avatar_url).toBe(dummyAvatarData);

    // 3. Hapus foto profil kembali menjadi null
    const removeRes = await repo.updateProfile({
      userId: user.id,
      displayName: 'Avatar Tester Updated',
      timezone: 'Asia/Jakarta',
      avatarUrl: null,
    });

    expect(removeRes.error).toBeUndefined();
    expect(removeRes.profile?.avatar_url).toBeNull();

    const currentAfterRemove = await repo.getCurrentUser();
    expect(currentAfterRemove?.avatar_url).toBeNull();
  });
});

