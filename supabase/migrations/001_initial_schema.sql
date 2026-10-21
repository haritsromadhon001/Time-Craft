-- ============================================================================
-- TIMECRAFT — MIGRATION 001: SKEMA AWAL & ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Cara menjalankan di Supabase:
-- 1. Buka dashboard proyek Supabase Anda (https://supabase.com/dashboard).
-- 2. Pilih menu "SQL Editor" di bilah kiri.
-- 3. Klik "New query", tempel seluruh isi file ini, lalu klik tombol "Run".
--
-- Prinsip Keamanan & Integritas Data:
-- - Seluruh tabel wajib memiliki Row Level Security (RLS) yang AKTIF.
-- - Setiap pengguna hanya boleh membaca, menambah, mengubah, dan menghapus
--   baris data yang memiliki user_id = auth.uid() (miliknya sendiri).
-- - Constraint database menolak durasi negatif atau waktu selesai <= waktu mulai.
-- ============================================================================

-- Aktifkan ekstensi UUID jika belum aktif
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABEL PROFIL PENGGUNA (profiles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL CHECK (char_length(trim(display_name)) >= 2),
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Profil pengguna TimeCraft beserta preferensi zona waktu.';

-- ----------------------------------------------------------------------------
-- 2. TABEL CATATAN SCREEN TIME (screen_time_logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.screen_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (
    category IN (
      'productive_study',
      'productive_work',
      'social_media',
      'entertainment',
      'gaming',
      'communication',
      'other'
    )
  ),
  source TEXT NOT NULL CHECK (source IN ('manual_input', 'system_timer')),
  activity_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_screen_time_user_date
  ON public.screen_time_logs (user_id, activity_date DESC);

COMMENT ON TABLE public.screen_time_logs IS 'Catatan screen time pengguna (membedakan manual_input dan system_timer).';

-- ----------------------------------------------------------------------------
-- 3. TABEL SESI FOKUS (focus_sessions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  planned_focus_minutes INTEGER NOT NULL CHECK (planned_focus_minutes >= 1 AND planned_focus_minutes <= 240),
  planned_break_minutes INTEGER NOT NULL CHECK (planned_break_minutes >= 0 AND planned_break_minutes <= 60),
  actual_focus_seconds INTEGER NOT NULL CHECK (actual_focus_seconds > 0),
  status TEXT NOT NULL CHECK (status IN ('completed', 'interrupted')),
  session_date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  task_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_focus_timestamps CHECK (ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_date
  ON public.focus_sessions (user_id, session_date DESC);

COMMENT ON TABLE public.focus_sessions IS 'Riwayat sesi Focus Timer (membedakan sesi completed dan interrupted).';

-- ----------------------------------------------------------------------------
-- 4. TABEL TARGET HARIAN PENGGUNA (user_targets)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  max_daily_screentime_minutes INTEGER CHECK (
    max_daily_screentime_minutes IS NULL OR (max_daily_screentime_minutes >= 15 AND max_daily_screentime_minutes <= 1440)
  ),
  min_daily_focus_minutes INTEGER CHECK (
    min_daily_focus_minutes IS NULL OR (min_daily_focus_minutes >= 10 AND min_daily_focus_minutes <= 720)
  ),
  preferred_focus_schedule TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_targets IS 'Target batas screen time harian dan target durasi fokus per pengguna.';

-- ----------------------------------------------------------------------------
-- 5. TABEL REFLEKSI MINGGUAN & JURNAL SINGKAT (weekly_reflections)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weekly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reflection_date DATE NOT NULL,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
  wins_note TEXT NOT NULL CHECK (char_length(trim(wins_note)) >= 3),
  improvement_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user_date
  ON public.weekly_reflections (user_id, reflection_date DESC);

-- ============================================================================
-- 6. TRIGGER OTOMATIS UPDATED_AT & PEMBUATAN PROFIL SAAT SIGN UP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_targets_updated_at ON public.user_targets;
CREATE TRIGGER trg_user_targets_updated_at
  BEFORE UPDATE ON public.user_targets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, 'Pengguna'), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Jakarta')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 7. AKTIVASI ROW LEVEL SECURITY (RLS) & KEBIJAKAN ISOLASI DATA
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screen_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reflections ENABLE ROW LEVEL SECURITY;

-- Policies untuk profiles
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Policies untuk screen_time_logs
CREATE POLICY "screen_time_select_own" ON public.screen_time_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "screen_time_insert_own" ON public.screen_time_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "screen_time_update_own" ON public.screen_time_logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "screen_time_delete_own" ON public.screen_time_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Policies untuk focus_sessions
CREATE POLICY "focus_sessions_select_own" ON public.focus_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "focus_sessions_insert_own" ON public.focus_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "focus_sessions_update_own" ON public.focus_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "focus_sessions_delete_own" ON public.focus_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Policies untuk user_targets
CREATE POLICY "user_targets_select_own" ON public.user_targets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_targets_insert_own" ON public.user_targets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_targets_update_own" ON public.user_targets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_targets_delete_own" ON public.user_targets
  FOR DELETE USING (auth.uid() = user_id);

-- Policies untuk weekly_reflections
CREATE POLICY "weekly_reflections_select_own" ON public.weekly_reflections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weekly_reflections_insert_own" ON public.weekly_reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weekly_reflections_update_own" ON public.weekly_reflections
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weekly_reflections_delete_own" ON public.weekly_reflections
  FOR DELETE USING (auth.uid() = user_id);
