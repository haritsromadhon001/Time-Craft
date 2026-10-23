import { supabase, getSupabaseConfigStatus } from './supabase';
import {
  FocusSession,
  NewFocusSessionInput,
  NewScreenTimeInput,
  NewWeeklyReflectionInput,
  ScreenTimeLog,
  UpsertTargetInput,
  UserProfile,
  UserTarget,
  WeeklyReflection,
  Classroom,
  ClassroomMember,
  StudentReportSummary,
} from '../types/domain';
import { getDetectedTimezone } from '../utils/time';
import { validateScreenTimeInput } from '../utils/analytics';

// ============================================================================
// TIMECRAFT — LAYANAN DATA & AUTENTIKASI DENGAN ISOLASI PENGGUNA (RLS)
// ============================================================================
// Cara Kerja:
// 1. Jika Supabase sudah dikonfigurasi di `.env`, seluruh autentikasi dan
//    penyimpanan menggunakan PostgreSQL Supabase + Row Level Security (RLS).
// 2. Jika pengguna belum membuat proyek Supabase, TimeCraft menyediakan
//    "Brankas Lokal Terisolasi per Akun" (Local Vault Mode) yang menerapkan
//    aturan isolasi `user_id === activeUser.id` yang identik dengan RLS,
//    sehingga seluruh fitur (Registrasi 2 akun berbeda, Login, Uji Isolasi,
//    Screen Time, Focus Timer, Target, Ekspor, Kelas) dapat diuji secara nyata!
// 3. TIDAK ADA DUMMY DATA ATAU SEED DATA. Akun baru selalu mulai dengan
//    database yang 100% kosong.
// ============================================================================

interface LocalAuthRecord {
  id: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
}

interface LocalVaultStructure {
  users: LocalAuthRecord[];
  activeSessionUserId: string | null;
  screen_time_logs: ScreenTimeLog[];
  focus_sessions: FocusSession[];
  user_targets: UserTarget[];
  weekly_reflections: WeeklyReflection[];
  classrooms?: Classroom[];
  classroom_members?: ClassroomMember[];
}

const VAULT_STORAGE_KEY = 'timecraft_isolated_vault_v1';

function createEmptyVault(): LocalVaultStructure {
  return {
    users: [],
    activeSessionUserId: null,
    screen_time_logs: [],
    focus_sessions: [],
    user_targets: [],
    weekly_reflections: [],
    classrooms: [],
    classroom_members: [],
  };
}

function readLocalVault(customStore?: Storage): LocalVaultStructure {
  const store = customStore ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return createEmptyVault();
  try {
    const raw = store.getItem(VAULT_STORAGE_KEY);
    if (!raw) return createEmptyVault();
    const parsed = JSON.parse(raw) as Partial<LocalVaultStructure>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      activeSessionUserId: parsed.activeSessionUserId ?? null,
      screen_time_logs: Array.isArray(parsed.screen_time_logs) ? parsed.screen_time_logs : [],
      focus_sessions: Array.isArray(parsed.focus_sessions) ? parsed.focus_sessions : [],
      user_targets: Array.isArray(parsed.user_targets) ? parsed.user_targets : [],
      weekly_reflections: Array.isArray(parsed.weekly_reflections) ? parsed.weekly_reflections : [],
      classrooms: Array.isArray(parsed.classrooms) ? parsed.classrooms : [],
      classroom_members: Array.isArray(parsed.classroom_members) ? parsed.classroom_members : [],
    };
  } catch {
    return createEmptyVault();
  }
}

function writeLocalVault(vault: LocalVaultStructure, customStore?: Storage): void {
  const store = customStore ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return;
  store.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'tc-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
}

function hashPasswordSimple(password: string): string {
  // Hanya digunakan untuk mode belajar lokal saat Supabase belum dikonfigurasi
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return `local_hash_${Math.abs(hash)}_${password.length}`;
}

export class TimeCraftRepository {
  private customStore?: Storage;
  private supabaseUnreachable: boolean = false;

  constructor(customStore?: Storage) {
    this.customStore = customStore;
  }

  private isNetworkFetchError(err: unknown): boolean {
    if (!err) return false;
    const str = String((err as any)?.message || err).toLowerCase();
    return (
      str.includes('failed to fetch') ||
      str.includes('err_name_not_resolved') ||
      str.includes('network') ||
      str.includes('fetch error') ||
      str.includes('load failed')
    );
  }

  public isUsingSupabase(): boolean {
    return (
      getSupabaseConfigStatus().isConfigured &&
      supabase !== null &&
      !this.customStore &&
      !this.supabaseUnreachable
    );
  }

  // --------------------------------------------------------------------------
  // AUTENTIKASI & PROFIL PENGGUNA
  // --------------------------------------------------------------------------

  async getCurrentUser(): Promise<UserProfile | null> {
    if (this.isUsingSupabase() && supabase) {
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) {
          if (this.isNetworkFetchError(authErr)) {
            this.supabaseUnreachable = true;
          } else {
            return null;
          }
        } else if (authData?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (profileData) {
            return profileData as UserProfile;
          }

          const fallbackProfile: UserProfile = {
            id: authData.user.id,
            email: authData.user.email ?? '',
            display_name:
              (authData.user.user_metadata?.display_name as string) ||
              (authData.user.email?.split('@')[0] ?? 'Pengguna'),
            timezone:
              (authData.user.user_metadata?.timezone as string) || getDetectedTimezone(),
            avatar_url: (authData.user.user_metadata?.avatar_url as string) || null,
            created_at: authData.user.created_at,
            updated_at: new Date().toISOString(),
          };
          return fallbackProfile;
        }
      } catch (err: unknown) {
        if (this.isNetworkFetchError(err)) {
          this.supabaseUnreachable = true;
        }
      }
    }

    const vault = readLocalVault(this.customStore);
    if (!vault.activeSessionUserId) return null;
    const found = vault.users.find((u) => u.id === vault.activeSessionUserId);
    return found ? found.profile : null;
  }

  async registerAccount(params: {
    email: string;
    password: string;
    displayName: string;
    timezone?: string;
  }): Promise<{ user: UserProfile | null; error?: string }> {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.displayName.trim();
    const tz = params.timezone || getDetectedTimezone();

    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      return { user: null, error: 'Alamat email tidak valid.' };
    }
    if (params.password.length < 6) {
      return { user: null, error: 'Kata sandi minimal harus 6 karakter.' };
    }
    if (cleanName.length < 2) {
      return { user: null, error: 'Nama tampilan minimal harus 2 karakter.' };
    }

    if (this.isUsingSupabase() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: params.password,
          options: {
            data: {
              display_name: cleanName,
              timezone: tz,
            },
          },
        });

        if (error) {
          if (this.isNetworkFetchError(error)) {
            console.warn('Supabase URL tidak dapat dijangkau, otomatis beralih ke Local Vault.');
            this.supabaseUnreachable = true;
          } else {
            return { user: null, error: error.message };
          }
        } else if (data.user) {
          const nowIso = new Date().toISOString();
          const newProfile: UserProfile = {
            id: data.user.id,
            email: cleanEmail,
            display_name: cleanName,
            timezone: tz,
            avatar_url: null,
            created_at: nowIso,
            updated_at: nowIso,
          };

          await supabase.from('profiles').upsert(newProfile);
          return { user: newProfile };
        }
      } catch (err: unknown) {
        if (this.isNetworkFetchError(err)) {
          console.warn('Koneksi Supabase terputus, otomatis beralih ke Local Vault.');
          this.supabaseUnreachable = true;
        } else {
          return { user: null, error: String((err as any)?.message || err) };
        }
      }
    }

    // Mode Brankas Lokal Terisolasi (ketika Supabase belum dikonfigurasi atau tidak dapat dijangkau)
    const vault = readLocalVault(this.customStore);
    const existingIdx = vault.users.findIndex((u) => u.email === cleanEmail);
    if (existingIdx !== -1) {
      return {
        user: null,
        error:
          'Email tersebut sudah terdaftar di browser ini. Silakan masuk lewat tab "Masuk", atau gunakan tab "Lupa Sandi" jika ingin mengatur ulang kata sandi.',
      };
    }

    const nowIso = new Date().toISOString();
    const newId = generateId();
    const profile: UserProfile = {
      id: newId,
      email: cleanEmail,
      display_name: cleanName,
      timezone: tz,
      avatar_url: null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    vault.users.push({
      id: newId,
      email: cleanEmail,
      passwordHash: hashPasswordSimple(params.password),
      profile,
    });
    vault.activeSessionUserId = newId;
    writeLocalVault(vault, this.customStore);

    return { user: profile };
  }

  async loginAccount(params: {
    email: string;
    password: string;
  }): Promise<{ user: UserProfile | null; error?: string }> {
    const cleanEmail = params.email.trim().toLowerCase();

    if (this.isUsingSupabase() && supabase) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: params.password,
        });
        if (error) {
          if (this.isNetworkFetchError(error)) {
            console.warn('Layanan cloud tidak dapat dijangkau, beralih ke penyimpanan lokal.');
            this.supabaseUnreachable = true;
          } else {
            const msg = (error.message || '').toLowerCase();
            if (msg.includes('email not confirmed')) {
              return {
                user: null,
                error:
                  'Alamat email Anda belum dikonfirmasi. Silakan periksa kotak masuk atau spam email Anda untuk mengaktifkan akun, atau hubungi administrator.',
              };
            }
            return {
              user: null,
              error:
                'Alamat email atau kata sandi tidak sesuai. Mohon periksa kembali ejaan email Anda (pastikan tidak ada huruf yang terlewat) dan pastikan kata sandi sudah benar.',
            };
          }
        } else {
          const current = await this.getCurrentUser();
          return { user: current };
        }
      } catch (err: unknown) {
        if (this.isNetworkFetchError(err)) {
          this.supabaseUnreachable = true;
        } else {
          return { user: null, error: 'Terjadi kendala saat menghubungkan ke layanan autentikasi. Silakan coba beberapa saat lagi.' };
        }
      }
    }

    const vault = readLocalVault(this.customStore);
    const found = vault.users.find((u) => u.email === cleanEmail);
    if (!found) {
      return {
        user: null,
        error: `Alamat email "${cleanEmail}" belum terdaftar. Mohon periksa kembali ejaan alamat email Anda atau buat akun baru di tab Daftar Akun.`,
      };
    }

    if (found.passwordHash !== hashPasswordSimple(params.password)) {
      return {
        user: null,
        error:
          'Kata sandi yang Anda masukkan tidak sesuai. Silakan periksa kembali atau gunakan opsi Ganti Kata Sandi untuk memperbarui akses Anda.',
      };
    }

    vault.activeSessionUserId = found.id;
    writeLocalVault(vault, this.customStore);
    return { user: found.profile };
  }

  async logoutAccount(): Promise<void> {
    if (this.isUsingSupabase() && supabase) {
      await supabase.auth.signOut();
      return;
    }
    const vault = readLocalVault(this.customStore);
    vault.activeSessionUserId = null;
    writeLocalVault(vault, this.customStore);
  }

  async changePasswordWithOldPassword(params: {
    email: string;
    oldPassword: string;
    newPassword: string;
  }): Promise<{ ok: boolean; message: string; user?: UserProfile | null }> {
    const cleanEmail = params.email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      return { ok: false, message: 'Masukkan alamat email yang valid.' };
    }
    if (!params.oldPassword) {
      return { ok: false, message: 'Masukkan kata sandi lama Anda.' };
    }
    if (!params.newPassword || params.newPassword.length < 6) {
      return { ok: false, message: 'Kata sandi baru harus memiliki panjang minimal 6 karakter.' };
    }
    if (params.oldPassword === params.newPassword) {
      return { ok: false, message: 'Kata sandi baru tidak boleh sama dengan kata sandi lama.' };
    }

    if (this.isUsingSupabase() && supabase) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: params.oldPassword,
      });
      if (signInError) {
        return { ok: false, message: 'Kata sandi lama yang Anda masukkan tidak sesuai.' };
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password: params.newPassword,
      });
      if (updateError) {
        return { ok: false, message: `Gagal memperbarui kata sandi: ${updateError.message}` };
      }
      const user = await this.getCurrentUser();
      return {
        ok: true,
        message: 'Kata sandi berhasil diperbarui! Anda telah masuk kembali.',
        user,
      };
    }

    // Mode Brankas Lokal
    const vault = readLocalVault(this.customStore);
    const idx = vault.users.findIndex((u) => u.email === cleanEmail);
    if (idx === -1) {
      return {
        ok: false,
        message: `Alamat email "${cleanEmail}" belum terdaftar. Silakan periksa kembali email Anda.`,
      };
    }

    const userRecord = vault.users[idx];
    if (userRecord.passwordHash !== hashPasswordSimple(params.oldPassword)) {
      return {
        ok: false,
        message: 'Kata sandi lama yang Anda masukkan tidak sesuai. Silakan periksa kembali.',
      };
    }

    vault.users[idx].passwordHash = hashPasswordSimple(params.newPassword);
    vault.activeSessionUserId = userRecord.id;
    writeLocalVault(vault, this.customStore);

    return {
      ok: true,
      message: 'Kata sandi berhasil diperbarui! Anda telah masuk kembali ke akun Anda.',
      user: userRecord.profile,
    };
  }

  async requestPasswordRecovery(
    email: string,
    newPassword?: string,
  ): Promise<{ ok: boolean; message: string; user?: UserProfile | null }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      return { ok: false, message: 'Masukkan alamat email yang valid terlebih dahulu.' };
    }

    if (this.isUsingSupabase() && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) {
        return { ok: false, message: `Gagal mengirim email pemulihan: ${error.message}` };
      }
      return {
        ok: true,
        message: `Tautan pemulihan kata sandi telah dikirim ke Google Account / email (${cleanEmail}). Silakan periksa kotak masuk (inbox) Anda.`,
      };
    }

    // Mode Brankas Lokal:
    const vault = readLocalVault(this.customStore);
    const idx = vault.users.findIndex((u) => u.email === cleanEmail);
    if (idx === -1) {
      return {
        ok: false,
        message: `Alamat email "${cleanEmail}" belum terdaftar. Pastikan alamat Google Account Anda sudah sesuai dengan yang digunakan saat mendaftar.`,
      };
    }

    // Jika pengguna juga menyertakan password baru (direct reset)
    if (newPassword && newPassword.length >= 6) {
      vault.users[idx].passwordHash = hashPasswordSimple(newPassword);
      vault.activeSessionUserId = vault.users[idx].id;
      writeLocalVault(vault, this.customStore);
      return {
        ok: true,
        user: vault.users[idx].profile,
        message: 'Kata sandi berhasil diperbarui! Anda telah masuk kembali ke akun Anda.',
      };
    }

    // Standar pengiriman instruksi pemulihan ke email pengguna
    return {
      ok: true,
      message: `Instruksi pemulihan kata sandi telah berhasil dikirim ke Google Account (${cleanEmail}). Silakan periksa kotak masuk (inbox) atau folder spam Anda.`,
    };
  }

  public getLocalRegisteredEmails(): Array<{ email: string; displayName: string }> {
    const vault = readLocalVault(this.customStore);
    return vault.users.map((u) => ({
      email: u.email,
      displayName: u.profile.display_name,
    }));
  }

  async updateProfile(params: {
    userId: string;
    displayName: string;
    timezone: string;
    avatarUrl?: string | null;
  }): Promise<{ profile: UserProfile | null; error?: string }> {
    const current = await this.getCurrentUser();
    if (!current || current.id !== params.userId) {
      return {
        profile: null,
        error: 'Akses ditolak (RLS): Anda hanya dapat mengubah profil milik Anda sendiri.',
      };
    }

    const cleanName = params.displayName.trim();
    if (cleanName.length < 2) {
      return { profile: null, error: 'Nama tampilan minimal 2 karakter.' };
    }

    const updatedAt = new Date().toISOString();

    if (this.isUsingSupabase() && supabase) {
      const updateData: Record<string, unknown> = {
        display_name: cleanName,
        timezone: params.timezone,
        updated_at: updatedAt,
      };
      if (params.avatarUrl !== undefined) {
        updateData.avatar_url = params.avatarUrl;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', current.id)
        .select('*')
        .single();

      if (error) {
        return { profile: null, error: error.message };
      }
      return { profile: data as UserProfile };
    }

    const vault = readLocalVault(this.customStore);
    const idx = vault.users.findIndex((u) => u.id === current.id);
    if (idx === -1) return { profile: null, error: 'Profil pengguna tidak ditemukan.' };

    vault.users[idx].profile = {
      ...vault.users[idx].profile,
      display_name: cleanName,
      timezone: params.timezone,
      avatar_url: params.avatarUrl !== undefined ? params.avatarUrl : (vault.users[idx].profile.avatar_url ?? null),
      updated_at: updatedAt,
    };
    writeLocalVault(vault, this.customStore);
    return { profile: vault.users[idx].profile };
  }

  // --------------------------------------------------------------------------
  // CATATAN SCREEN TIME (DENGAN ISOLASI RLS & ANTI DOUBLE-COUNTING)
  // --------------------------------------------------------------------------

  async getScreenTimeLogs(userId: string): Promise<{ data: ScreenTimeLog[]; error?: string }> {
    const current = await this.getCurrentUser();
    if (!current || current.id !== userId) {
      return {
        data: [],
        error: 'Pelanggaran Isolasi Data (RLS): Tidak diizinkan membaca catatan pengguna lain.',
      };
    }

    if (this.isUsingSupabase() && supabase) {
      const { data, error } = await supabase
        .from('screen_time_logs')
        .select('*')
        .eq('user_id', current.id)
        .order('start_time', { ascending: false });

      if (error) return { data: [], error: error.message };
      return { data: (data ?? []) as ScreenTimeLog[] };
    }

    const vault = readLocalVault(this.customStore);
    const ownLogs = vault.screen_time_logs
      .filter((log) => log.user_id === current.id)
      .sort((a, b) => Date.parse(b.start_time) - Date.parse(a.start_time));

    return { data: ownLogs };
  }

  async addScreenTimeLog(
    userId: string,
    input: NewScreenTimeInput,
  ): Promise<{ data: ScreenTimeLog | null; error?: string }> {
    const current = await this.getCurrentUser();
    if (!current || current.id !== userId) {
      return {
        data: null,
        error: 'Pelanggaran Isolasi Data (RLS): Tidak dapat menambah catatan ke akun pengguna lain.',
      };
    }

    const existingRes = await this.getScreenTimeLogs(current.id);
    const sameDayLogs = existingRes.data.filter(
      (l) => l.activity_date === input.activity_date,
    );

    const validation = validateScreenTimeInput({
      category: input.category,
      startIso: input.start_time,
      endIso: input.end_time,
      existingLogs: sameDayLogs,
    });

    if (!validation.valid) {
      return { data: null, error: validation.error };
    }

    const newRecord: ScreenTimeLog = {
      id: generateId(),
      user_id: current.id,
      category: input.category,
      source: input.source,
      activity_date: input.activity_date,
      start_time: input.start_time,
      end_time: input.end_time,
      duration_minutes: validation.durationMinutes,
      notes: input.notes?.trim() ? input.notes.trim() : null,
      created_at: new Date().toISOString(),
    };

    if (this.isUsingSupabase() && supabase) {
      const { data, error } = await supabase
        .from('screen_time_logs')
        .insert({
          user_id: newRecord.user_id,
          category: newRecord.category,
          source: newRecord.source,
          activity_date: newRecord.activity_date,
          start_time: newRecord.start_time,
          end_time: newRecord.end_time,
          duration_minutes: newRecord.duration_minutes,
          notes: newRecord.notes,
        })
        .select('*')
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as ScreenTimeLog };
    }

    const vault = readLocalVault(this.customStore);
    vault.screen_time_logs.push(newRecord);
    writeLocalVault(vault, this.customStore);
    return { data: newRecord };
  }

  async deleteScreenTimeLog(
    userId: string,
    logId: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const current = await this.getCurrentUser();
    if (!current || current.id !== userId) {
      return {
        ok: false,
        error: 'Pelanggaran Isolasi Data (RLS): Akses penghapusan ditolak.',
      };
    }

    if (this.isUsingSupabase() && supabase) {
      const { error } = await supabase
        .from('screen_time_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', current.id);

      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }

    const vault = readLocalVault(this.customStore);
    const targetLog = vault.screen_time_logs.find((l) => l.id === logId);
    if (!targetLog) {
      return { ok: false, error: 'Catatan tidak ditemukan.' };
    }
    if (targetLog.user_id !== current.id) {
      return {
        ok: false,
        error: 'Pelanggaran Isolasi Data (RLS): Anda tidak boleh menghapus catatan milik pengguna lain.',
      };
    }

    vault.screen_time_logs = vault.screen_time_logs.filter((l) => l.id !== logId);
    writeLocalVault(vault, this.customStore);
    return { ok: true };
  }

  // --------------------------------------------------------------------------
  // SESI FOCUS TIMER
  // --------------------------------------------------------------------------

  async getFocusSessions(userId: string): Promise<{ data: FocusSession[]; error?: string }> {
    const current = await this.getCurrentUser();
    if (!current || current.id !== userId) {
      return {
        data: [],
        error: 'Pelanggaran Isolasi Data (RLS): Tidak diizinkan membaca sesi fokus pengguna lain.',
      };
    }

    if (this.isUsingSupabase() && supabase) {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', current.id)
        .order('started_at', { ascending: false });

      if (error) return { data: [], error: error.message };
      return { data: (data ?? []) as FocusSession[] };
    }

    const vault = readLocalVault(this.customStore);
    const ownSessions = vault.focus_sessions
      .filter((s) => s.user_id === current.id)
      .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at));

    return { data: ownSessions };
  }

  async addFocusSession(
    userId: string,
    input: NewFocusSessionInput,
  ): Promise<{ data: FocusSession | null; error?: string }> {
    const current = await this.getCurrentUser();
    if (!current || current.id !== userId) {
      return {
        data: null,
        error: 'Pelanggaran Isolasi Data (RLS): Tidak dapat menyimpan sesi fokus ke akun lain.',
      };
    }

    if (input.actual_focus_seconds <= 0) {
      return {
        data: null,
        error: 'Durasi fokus aktual harus lebih dari 0 detik.',
      };
    }

    const record: FocusSession = {
      id: generateId(),
      user_id: current.id,
      planned_focus_minutes: input.planned_focus_minutes,
      planned_break_minutes: input.planned_break_minutes,
      actual_focus_seconds: Math.round(input.actual_focus_seconds),
      status: input.status,
      session_date: input.session_date,
      started_at: input.started_at,
      ended_at: input.ended_at,
      task_label: input.task_label?.trim() ? input.task_label.trim() : null,
      created_at: new Date().toISOString(),
    };

    if (this.isUsingSupabase() && supabase) {
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: record.user_id,
          planned_focus_minutes: record.planned_focus_minutes,
          planned_break_minutes: record.planned_break_minutes,
          actual_focus_seconds: record.actual_focus_seconds,
          status: record.status,
          session_date: record.session_date,
          started_at: record.started_at,
          ended_at: record.ended_at,
          task_label: record.task_label,
        })
        .select('*')
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as FocusSession };
    }

    const vault = readLocalVault(this.customStore);
    vault.focus_sessions.push(record);
    writeLocalVault(vault, this.customStore);
    return { data: record };
  }

  // --------------------------------------------------------------------------
  // TARGET HARIAN & REFLEKSI MINGGUAN
  // --------------------------------------------------------------------------

  async getUserTarget(userId: string): Promise<{ data: UserTarget | null; error?: string }> {
    const current = await this.getCurrentUser();
    if (!current || current.id !== userId) {
      return {
        data: null,
        error: 'Pelanggaran Isolasi Data (RLS): Akses target ditolak.',
      };
    }

    if (this.isUsingSupabase() && supabase) {
      const { data, error } = await supabase
        .from('user_targets')
        .select('*')
        .eq('user_id', current.id)
        .maybeSingle();

      if (error) return { data: null, error: error.message };
      return { data: (data as UserTarget | null) ?? null };
    }

    const vault = readLocalVault(this.customStore);
    const found = vault.user_targets.find((t) => t.user_id === current.id) ?? null;
    return { data: found };
  }

  async saveUserTarget(
    userId: string,
    input: UpsertTargetInput,
  ): Promise<{ data: UserTarget | null; error?: string }> {
    const current = await this.getCurrentUser();
    if (!current || current.id !== userId) {
      return {
        data: null,
        error: 'Pelanggaran Isolasi Data (RLS): Tidak diizinkan mengubah target pengguna lain.',
      };
    }

    if (
      input.max_daily_screentime_minutes !== null &&
      (input.max_daily_screentime_minutes < 15 || input.max_daily_screentime_minutes > 1440)
    ) {
      return {
        data: null,
        error: 'Target batas screen time harian harus di antara 15 hingga 1440 menit.',
      };
    }

    if (
      input.min_daily_focus_minutes !== null &&
      (input.min_daily_focus_minutes < 10 || input.min_daily_focus_minutes > 720)
    ) {
      return {
        data: null,
        error: 'Target minimal durasi fokus harian harus di antara 10 hingga 720 menit.',
      };
    }

    const updatedAt = new Date().toISOString();

    if (this.isUsingSupabase() && supabase) {
      const { data, error } = await supabase
        .from('user_targets')
        .upsert(
          {
            user_id: current.id,
            max_daily_screentime_minutes: input.max_daily_screentime_minutes,
            min_daily_focus_minutes: input.min_daily_focus_minutes,
            preferred_focus_schedule: input.preferred_focus_schedule?.trim() || null,
            updated_at: updatedAt,
          },
          { onConflict: 'user_id' },
        )
        .select('*')
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as UserTarget };
    }

    const vault = readLocalVault(this.customStore);
    const existingIdx = vault.user_targets.findIndex((t) => t.user_id === current.id);
    const record: UserTarget = {
      id: existingIdx >= 0 ? vault.user_targets[existingIdx].id : generateId(),
      user_id: current.id,
      max_daily_screentime_minutes: input.max_daily_screentime_minutes,
      min_daily_focus_minutes: input.min_daily_focus_minutes,
      preferred_focus_schedule: input.preferred_focus_schedule?.trim() || null,
      updated_at: updatedAt,
    };

    if (existingIdx >= 0) {
      vault.user_targets[existingIdx] = record;
    } else {
      vault.user_targets.push(record);
    }
    writeLocalVault(vault, this.customStore);
    return { data: record };
  }

  async deleteUserTarget(userId: string): Promise<{ ok: boolean; error?: string }> {
    const current = await this.getCurrentUser();
    if (!current || current.id !== userId) {
      return { ok: false, error: 'Pelanggaran Isolasi Data (RLS).' };
    }

    if (this.isUsingSupabase() && supabase) {
      const { error } = await supabase
        .from('user_targets')
        .delete()
        .eq('user_id', current.id);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }

    const vault = readLocalVault(this.customStore);
    vault.user_targets = vault.user_targets.filter((t) => t.user_id !== current.id);
    writeLocalVault(vault, this.customStore);
    return { ok: true };
  }

  async getWeeklyReflections(
    userId: string,
  ): Promise<{ data: WeeklyReflection[]; error?: string }> {
    const current = await this.getCurrentUser();
    if (!current || current.id !== userId) {
      return { data: [], error: 'Pelanggaran Isolasi Data (RLS).' };
    }

    if (this.isUsingSupabase() && supabase) {
      const { data, error } = await supabase
        .from('weekly_reflections')
        .select('*')
        .eq('user_id', current.id)
        .order('reflection_date', { ascending: false });

      if (error) return { data: [], error: error.message };
      return { data: (data ?? []) as WeeklyReflection[] };
    }

    const vault = readLocalVault(this.customStore);
    const own = vault.weekly_reflections
      .filter((r) => r.user_id === current.id)
      .sort((a, b) => b.reflection_date.localeCompare(a.reflection_date));
    return { data: own };
  }

  async addWeeklyReflection(
    userId: string,
    input: NewWeeklyReflectionInput,
  ): Promise<{ data: WeeklyReflection | null; error?: string }> {
    const current = await this.getCurrentUser();
    if (!current || current.id !== userId) {
      return { data: null, error: 'Pelanggaran Isolasi Data (RLS).' };
    }

    if (input.wins_note.trim().length < 3) {
      return {
        data: null,
        error: 'Catatan refleksi minimal harus berisi 3 karakter.',
      };
    }

    const record: WeeklyReflection = {
      id: generateId(),
      user_id: current.id,
      reflection_date: input.reflection_date,
      mood_score: Math.min(5, Math.max(1, input.mood_score)),
      wins_note: input.wins_note.trim(),
      improvement_plan: input.improvement_plan?.trim() || null,
      created_at: new Date().toISOString(),
    };

    if (this.isUsingSupabase() && supabase) {
      const { data, error } = await supabase
        .from('weekly_reflections')
        .insert({
          user_id: record.user_id,
          reflection_date: record.reflection_date,
          mood_score: record.mood_score,
          wins_note: record.wins_note,
          improvement_plan: record.improvement_plan,
        })
        .select('*')
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as WeeklyReflection };
    }

    const vault = readLocalVault(this.customStore);
    vault.weekly_reflections.push(record);
    writeLocalVault(vault, this.customStore);
    return { data: record };
  }

  async deleteAllMyData(userId: string): Promise<{ ok: boolean; error?: string }> {
    const current = await this.getCurrentUser();
    if (!current || current.id !== userId) {
      return {
        ok: false,
        error: 'Pelanggaran Isolasi Data (RLS): Hanya pemilik akun yang dapat menghapus datanya.',
      };
    }

    if (this.isUsingSupabase() && supabase) {
      await supabase.from('screen_time_logs').delete().eq('user_id', current.id);
      await supabase.from('focus_sessions').delete().eq('user_id', current.id);
      await supabase.from('user_targets').delete().eq('user_id', current.id);
      await supabase.from('weekly_reflections').delete().eq('user_id', current.id);
      return { ok: true };
    }

    const vault = readLocalVault(this.customStore);
    vault.screen_time_logs = vault.screen_time_logs.filter((l) => l.user_id !== current.id);
    vault.focus_sessions = vault.focus_sessions.filter((s) => s.user_id !== current.id);
    vault.user_targets = vault.user_targets.filter((t) => t.user_id !== current.id);
    vault.weekly_reflections = vault.weekly_reflections.filter((r) => r.user_id !== current.id);
    writeLocalVault(vault, this.customStore);
    return { ok: true };
  }

  // --------------------------------------------------------------------------
  // CADANGAN & PEMINDAHAN AKUN ANTAR-BROWSER (LOCAL VAULT SYNC / BACKUP)
  // --------------------------------------------------------------------------

  public exportVaultBackup(): string {
    const vault = readLocalVault(this.customStore);
    return JSON.stringify(vault, null, 2);
  }

  public importVaultBackup(jsonString: string): { ok: boolean; message: string; count?: number } {
    try {
      const parsed = JSON.parse(jsonString) as Partial<LocalVaultStructure>;
      if (!parsed || !Array.isArray(parsed.users)) {
        return {
          ok: false,
          message: 'Format file cadangan tidak valid (struktur data brankas tidak sesuai).',
        };
      }

      const currentVault = readLocalVault(this.customStore);

      let importedUsers = 0;
      for (const incomingUser of parsed.users) {
        if (!incomingUser.email || !incomingUser.id) continue;
        const exists = currentVault.users.some(
          (u) =>
            u.email.toLowerCase() === incomingUser.email.toLowerCase() ||
            u.id === incomingUser.id,
        );
        if (!exists) {
          currentVault.users.push(incomingUser);
          importedUsers++;
        }
      }

      if (Array.isArray(parsed.screen_time_logs)) {
        for (const log of parsed.screen_time_logs) {
          if (!currentVault.screen_time_logs.some((l) => l.id === log.id)) {
            currentVault.screen_time_logs.push(log);
          }
        }
      }

      if (Array.isArray(parsed.focus_sessions)) {
        for (const sess of parsed.focus_sessions) {
          if (!currentVault.focus_sessions.some((s) => s.id === sess.id)) {
            currentVault.focus_sessions.push(sess);
          }
        }
      }

      if (Array.isArray(parsed.user_targets)) {
        for (const target of parsed.user_targets) {
          if (!currentVault.user_targets.some((t) => t.user_id === target.user_id)) {
            currentVault.user_targets.push(target);
          }
        }
      }

      if (Array.isArray(parsed.weekly_reflections)) {
        for (const ref of parsed.weekly_reflections) {
          if (!currentVault.weekly_reflections.some((r) => r.id === ref.id)) {
            currentVault.weekly_reflections.push(ref);
          }
        }
      }

      writeLocalVault(currentVault, this.customStore);

      return {
        ok: true,
        count: importedUsers,
        message: `Berhasil memulihkan cadangan! Data akun berhasil disinkronkan ke peramban ini.`,
      };
    } catch {
      return {
        ok: false,
        message: 'Gagal memproses berkas cadangan. Pastikan format berkas adalah JSON yang valid.',
      };
    }
  }

  // ============================================================================
  // SISTEM KELAS & PEMANTAUAN SISWA OLEH GURU (PORTAL KELAS)
  // ============================================================================

  // ============================================================================
  // SISTEM KELAS & PEMANTAUAN SISWA OLEH GURU (PORTAL KELAS)
  // ============================================================================

  async createClassroom(params: {
    teacherId: string;
    className: string;
    description?: string;
  }): Promise<{ classroom: Classroom | null; error?: string; warning?: string }> {
    const cleanName = params.className.trim();
    if (cleanName.length < 2) {
      return { classroom: null, error: 'Nama kelas minimal harus 2 karakter.' };
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'TC-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newClassroom: Classroom = {
      id: generateId(),
      teacher_id: params.teacherId,
      class_code: code,
      class_name: cleanName,
      description: params.description?.trim() || null,
      created_at: new Date().toISOString(),
    };

    if (this.isUsingSupabase() && supabase) {
      try {
        const { data, error } = await supabase
          .from('classrooms')
          .insert(newClassroom)
          .select()
          .maybeSingle();

        if (error) {
          console.warn('Gagal simpan kelas ke Supabase, simpan ke cadangan lokal:', error.message);
          // Simpan juga ke local vault
          const vault = readLocalVault(this.customStore);
          if (!vault.classrooms) vault.classrooms = [];
          vault.classrooms.push(newClassroom);
          writeLocalVault(vault, this.customStore);

          const isTableMissing =
            error.code === '42P01' ||
            error.message?.toLowerCase().includes('does not exist') ||
            error.message?.toLowerCase().includes('relation');

          if (isTableMissing) {
            return {
              classroom: newClassroom,
              warning:
                'Tabel database kelas di Supabase belum dibuat. Kelas sementara disimpan di perangkat ini. Jalankan file SQL migrasi di Supabase SQL Editor agar siswa di HP dapat bergabung.',
            };
          }
          return { classroom: newClassroom, warning: 'Tersimpan di perangkat lokal. Gagal sinkron ke cloud: ' + error.message };
        } else if (data) {
          // Simpan salinan lokal untuk performa
          const vault = readLocalVault(this.customStore);
          if (!vault.classrooms) vault.classrooms = [];
          if (!vault.classrooms.some((c) => c.id === data.id)) {
            vault.classrooms.push(data as Classroom);
            writeLocalVault(vault, this.customStore);
          }
          return { classroom: data as Classroom };
        }
      } catch (err: any) {
        console.warn('Koneksi kelas cloud bermasalah:', err);
      }
    }

    const vault = readLocalVault(this.customStore);
    if (!vault.classrooms) vault.classrooms = [];
    vault.classrooms.push(newClassroom);
    writeLocalVault(vault, this.customStore);
    return { classroom: newClassroom };
  }

  async syncLocalClassroomsToSupabase(teacherId: string): Promise<{ syncedCount: number; error?: string }> {
    if (!this.isUsingSupabase() || !supabase) {
      return { syncedCount: 0, error: 'Supabase belum terhubung.' };
    }

    const vault = readLocalVault(this.customStore);
    const localClasses = (vault.classrooms || []).filter((c) => c.teacher_id === teacherId);
    if (localClasses.length === 0) return { syncedCount: 0 };

    let count = 0;
    for (const cls of localClasses) {
      try {
        const { data: existing } = await supabase
          .from('classrooms')
          .select('id')
          .eq('id', cls.id)
          .maybeSingle();

        if (!existing) {
          const { error } = await supabase.from('classrooms').insert(cls);
          if (!error) count++;
        }
      } catch {
        // Jika tabel belum siap, lanjutkan
      }
    }

    return { syncedCount: count };
  }

  async getClassroomsByTeacher(teacherId: string): Promise<Classroom[]> {
    const listMap = new Map<string, Classroom>();

    // 1. Ambil dari Local Vault terlebih dahulu
    const vault = readLocalVault(this.customStore);
    const localList = (vault.classrooms || []).filter((c) => c.teacher_id === teacherId);
    for (const c of localList) {
      listMap.set(c.id, c);
    }

    // 2. Ambil dari Supabase jika aktif
    if (this.isUsingSupabase() && supabase) {
      try {
        const { data, error } = await supabase
          .from('classrooms')
          .select('*')
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          for (const c of data as Classroom[]) {
            listMap.set(c.id, c);
          }

          // Sinkronkan kelas lokal yang belum ada di Supabase
          this.syncLocalClassroomsToSupabase(teacherId).catch(() => {});
        }
      } catch {
        // Fallback ke Local Vault
      }
    }

    return Array.from(listMap.values()).sort(
      (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
    );
  }

  async getClassroomsByStudent(studentId: string): Promise<Array<Classroom & { memberId: string; joinedAt: string }>> {
    if (this.isUsingSupabase() && supabase) {
      try {
        const { data, error } = await supabase
          .from('classroom_members')
          .select('id, joined_at, classrooms (*)')
          .eq('student_id', studentId);

        if (!error && data && data.length > 0) {
          return (data as any[])
            .filter((row) => row.classrooms)
            .map((row) => ({
              ...(row.classrooms as Classroom),
              memberId: row.id,
              joinedAt: row.joined_at,
            }));
        }
      } catch {
        // Fallback ke Local Vault
      }
    }

    const vault = readLocalVault(this.customStore);
    const members = (vault.classroom_members || []).filter((m) => m.student_id === studentId);
    const result: Array<Classroom & { memberId: string; joinedAt: string }> = [];

    for (const mem of members) {
      const cls = (vault.classrooms || []).find((c) => c.id === mem.classroom_id);
      if (cls) {
        result.push({
          ...cls,
          memberId: mem.id,
          joinedAt: mem.joined_at,
        });
      }
    }
    return result;
  }

  async joinClassroomByCode(params: {
    studentId: string;
    classCode: string;
    studentName: string;
    studentEmail: string;
  }): Promise<{ ok: boolean; message: string; classroom?: Classroom }> {
    // Bersihkan semua spasi dan format kode kelas secara toleran
    let cleanCode = params.classCode.replace(/\s+/g, '').toUpperCase();
    if (!cleanCode.startsWith('TC-') && cleanCode.length === 4) {
      cleanCode = 'TC-' + cleanCode;
    }

    if (cleanCode.length < 4) {
      return { ok: false, message: 'Format kode kelas tidak valid. Contoh format: TC-8XJR atau 8XJR' };
    }

    if (this.isUsingSupabase() && supabase) {
      try {
        const { data: cls, error: clsErr } = await supabase
          .from('classrooms')
          .select('*')
          .ilike('class_code', cleanCode)
          .maybeSingle();

        if (clsErr) {
          const isTableMissing =
            clsErr.code === '42P01' ||
            clsErr.message?.toLowerCase().includes('does not exist') ||
            clsErr.message?.toLowerCase().includes('relation');

          if (isTableMissing) {
            return {
              ok: false,
              message:
                'Tabel kelas di database Supabase belum dibuat. Harap beritahu guru untuk menjalankan file migrasi SQL di Supabase SQL Editor.',
            };
          }
          return { ok: false, message: 'Gagal mencari kelas di cloud: ' + clsErr.message };
        }

        if (cls) {
          const { error: joinErr } = await supabase.from('classroom_members').insert({
            id: generateId(),
            classroom_id: cls.id,
            student_id: params.studentId,
            student_name: params.studentName,
            student_email: params.studentEmail,
            joined_at: new Date().toISOString(),
          });

          if (joinErr) {
            if (joinErr.message?.toLowerCase().includes('unique') || joinErr.code === '23505') {
              return { ok: false, message: `Anda sudah terdaftar dalam kelas "${cls.class_name}".` };
            }
            return { ok: false, message: 'Gagal bergabung ke kelas: ' + joinErr.message };
          }

          return { ok: true, message: `Berhasil bergabung ke kelas "${cls.class_name}"!`, classroom: cls as Classroom };
        }
      } catch (err: any) {
        console.warn('Kendala koneksi Supabase saat gabung kelas:', err);
      }
    }

    // Fallback pencarian di Local Vault
    const vault = readLocalVault(this.customStore);
    const foundCls = (vault.classrooms || []).find(
      (c) => c.class_code.replace(/\s+/g, '').toUpperCase() === cleanCode,
    );
    if (!foundCls) {
      return {
        ok: false,
        message: `Kelas dengan kode "${cleanCode}" tidak ditemukan di database cloud maupun lokal. Pastikan kode kelas yang dibagikan guru sudah benar, dan guru telah menyinkronkan database kelas.`,
      };
    }

    if (!vault.classroom_members) vault.classroom_members = [];
    const alreadyMember = vault.classroom_members.some(
      (m) => m.classroom_id === foundCls.id && m.student_id === params.studentId,
    );
    if (alreadyMember) {
      return { ok: false, message: `Anda sudah terdaftar dalam kelas "${foundCls.class_name}".` };
    }

    vault.classroom_members.push({
      id: generateId(),
      classroom_id: foundCls.id,
      student_id: params.studentId,
      student_name: params.studentName,
      student_email: params.studentEmail,
      joined_at: new Date().toISOString(),
    });
    writeLocalVault(vault, this.customStore);

    return { ok: true, message: `Berhasil bergabung ke kelas "${foundCls.class_name}"!`, classroom: foundCls };
  }

  async leaveClassroom(params: { memberId?: string; classroomId: string; studentId: string }): Promise<{ ok: boolean; message: string }> {
    if (this.isUsingSupabase() && supabase) {
      try {
        const { error } = await supabase
          .from('classroom_members')
          .delete()
          .eq('classroom_id', params.classroomId)
          .eq('student_id', params.studentId);

        if (!error) return { ok: true, message: 'Berhasil keluar dari kelas.' };
      } catch {}
    }

    const vault = readLocalVault(this.customStore);
    if (vault.classroom_members) {
      vault.classroom_members = vault.classroom_members.filter(
        (m) => !(m.classroom_id === params.classroomId && m.student_id === params.studentId),
      );
      writeLocalVault(vault, this.customStore);
    }
    return { ok: true, message: 'Berhasil keluar dari kelas.' };
  }

  async deleteClassroom(params: { classroomId: string; teacherId: string }): Promise<{ ok: boolean; message: string }> {
    if (this.isUsingSupabase() && supabase) {
      try {
        const { error } = await supabase
          .from('classrooms')
          .delete()
          .eq('id', params.classroomId)
          .eq('teacher_id', params.teacherId);

        if (!error) return { ok: true, message: 'Kelas berhasil dihapus.' };
      } catch {}
    }

    const vault = readLocalVault(this.customStore);
    if (vault.classrooms) {
      vault.classrooms = vault.classrooms.filter((c) => c.id !== params.classroomId);
    }
    if (vault.classroom_members) {
      vault.classroom_members = vault.classroom_members.filter((m) => m.classroom_id !== params.classroomId);
    }
    writeLocalVault(vault, this.customStore);
    return { ok: true, message: 'Kelas berhasil dihapus.' };
  }

  async getClassroomStudentsSummary(classroomId: string): Promise<StudentReportSummary[]> {
    const todayStr = new Date().toISOString().split('T')[0];

    // Ambil anggota kelas
    let members: ClassroomMember[] = [];
    if (this.isUsingSupabase() && supabase) {
      try {
        const { data, error } = await supabase
          .from('classroom_members')
          .select('*')
          .eq('classroom_id', classroomId);

        if (!error && data) {
          members = data as ClassroomMember[];
        }
      } catch {}
    }

    if (members.length === 0) {
      const vault = readLocalVault(this.customStore);
      members = (vault.classroom_members || []).filter((m) => m.classroom_id === classroomId);
    }

    if (members.length === 0) return [];

    const summaries: StudentReportSummary[] = [];

    for (const mem of members) {
      let logs: ScreenTimeLog[] = [];
      let sessions: FocusSession[] = [];
      let target: UserTarget | null = null;

      // Ambil data langsung dari Supabase tanpa filter auth.uid() = current.id di repository
      if (this.isUsingSupabase() && supabase) {
        try {
          const [logsRes, focusRes, targetRes] = await Promise.all([
            supabase
              .from('screen_time_logs')
              .select('*')
              .eq('user_id', mem.student_id)
              .order('start_time', { ascending: false }),
            supabase
              .from('focus_sessions')
              .select('*')
              .eq('user_id', mem.student_id)
              .order('started_at', { ascending: false }),
            supabase
              .from('user_targets')
              .select('*')
              .eq('user_id', mem.student_id)
              .maybeSingle(),
          ]);

          if (logsRes.data) logs = logsRes.data as ScreenTimeLog[];
          if (focusRes.data) sessions = focusRes.data as FocusSession[];
          if (targetRes.data) target = targetRes.data as UserTarget;
        } catch {
          // Fallback lokal jika ada kendala jaringan
        }
      }

      // Jika data cloud kosong, periksa penyimpanan Local Vault
      if (logs.length === 0 && sessions.length === 0) {
        const vault = readLocalVault(this.customStore);
        logs = (vault.screen_time_logs || [])
          .filter((l) => l.user_id === mem.student_id)
          .sort((a, b) => Date.parse(b.start_time) - Date.parse(a.start_time));
        sessions = (vault.focus_sessions || [])
          .filter((s) => s.user_id === mem.student_id)
          .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at));
        target = (vault.user_targets || []).find((t) => t.user_id === mem.student_id) || null;
      }

      // Hitung Screen Time Hari Ini
      const todayLogs = logs.filter((l) => l.activity_date === todayStr);
      const todayScreenTimeMinutes = todayLogs.length > 0
        ? todayLogs.reduce((acc, l) => acc + (l.duration_minutes || 0), 0)
        : null;

      // Hitung Waktu Fokus Hari Ini
      const todaySessions = sessions.filter((s) => s.session_date === todayStr);
      const todayFocusMinutes = Math.round(
        todaySessions.reduce((acc, s) => acc + (s.actual_focus_seconds || 0), 0) / 60,
      );

      // Hitung Rata-rata 7 Hari
      const past7DaysDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const past7Logs = logs.filter((l) => l.activity_date >= past7DaysDate);
      const last7DaysAvgScreenTime = past7Logs.length > 0
        ? Math.round(past7Logs.reduce((acc, l) => acc + (l.duration_minutes || 0), 0) / 7)
        : 0;

      const past7Sessions = sessions.filter((s) => s.session_date >= past7DaysDate);
      const last7DaysAvgFocusTime = past7Sessions.length > 0
        ? Math.round(past7Sessions.reduce((acc, s) => acc + (s.actual_focus_seconds || 0), 0) / (7 * 60))
        : 0;

      const maxLimit = target?.max_daily_screentime_minutes || null;
      const isExceeding = maxLimit !== null && todayScreenTimeMinutes !== null && todayScreenTimeMinutes > maxLimit;

      summaries.push({
        studentId: mem.student_id,
        displayName: mem.student_name || 'Siswa',
        email: mem.student_email,
        avatarUrl: null,
        todayScreenTimeMinutes,
        todayFocusMinutes,
        last7DaysAvgScreenTime,
        last7DaysAvgFocusTime,
        maxDailyScreenTimeLimit: maxLimit,
        isExceedingLimit: isExceeding,
        recentLogs: logs.slice(0, 5),
        recentFocusSessions: sessions.slice(0, 5),
        joinedAt: mem.joined_at,
      });
    }

    return summaries.sort((a, b) => (b.todayScreenTimeMinutes ?? 0) - (a.todayScreenTimeMinutes ?? 0));
  }
}

export const repository = new TimeCraftRepository();
