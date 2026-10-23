-- ============================================================================
-- TIMECRAFT — MIGRATION 003: SISTEM KELUARGA & PEMANTAUAN ANAK OLEH ORANG TUA
-- ============================================================================
-- Fitur:
-- 1. Tabel family_groups (ruang keluarga dibuat oleh orang tua dengan family_code unik)
-- 2. Tabel family_members (anak yang bergabung menggunakan family_code orang tua)
-- 3. Row Level Security (RLS) & Kebijakan Akses:
--    - Pengguna terotentikasi dapat mencari kode keluarga untuk menghubungkan akun.
--    - Orang tua dapat mengelola ruang keluarga miliknya.
--    - Anak dapat melihat keluarga yang diikutinya & bergabung dengan kode keluarga.
--    - Orang tua dapat melihat laporan screen time dan sesi fokus anak di rumah.
-- ============================================================================

-- 1. TABEL RUANG KELUARGA (family_groups)
CREATE TABLE IF NOT EXISTS public.family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_code TEXT NOT NULL UNIQUE CHECK (char_length(trim(family_code)) >= 4),
  family_name TEXT NOT NULL CHECK (char_length(trim(family_name)) >= 2),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_groups_parent
  ON public.family_groups (parent_id);

CREATE INDEX IF NOT EXISTS idx_family_groups_code
  ON public.family_groups (family_code);

COMMENT ON TABLE public.family_groups IS 'Ruang keluarga yang dibuat orang tua untuk memantau anak di rumah.';

-- 2. TABEL ANGGOTA KELUARGA / ANAK (family_members)
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  child_email TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_child_per_family UNIQUE (family_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_family_members_family
  ON public.family_members (family_id);

CREATE INDEX IF NOT EXISTS idx_family_members_child
  ON public.family_members (child_id);

COMMENT ON TABLE public.family_members IS 'Daftar anak yang terhubung dalam ruang keluarga orang tua.';

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) & POLICIES KELUARGA
-- ----------------------------------------------------------------------------
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Family Groups: Membaca keluarga
DROP POLICY IF EXISTS "Semua pengguna terotentikasi dapat melihat keluarga" ON public.family_groups;
CREATE POLICY "Semua pengguna terotentikasi dapat melihat keluarga"
  ON public.family_groups FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Orang tua dapat membuat ruang keluarga" ON public.family_groups;
CREATE POLICY "Orang tua dapat membuat ruang keluarga"
  ON public.family_groups FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Orang tua dapat mengubah ruang keluarga miliknya" ON public.family_groups;
CREATE POLICY "Orang tua dapat mengubah ruang keluarga miliknya"
  ON public.family_groups FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Orang tua dapat menghapus ruang keluarga miliknya" ON public.family_groups;
CREATE POLICY "Orang tua dapat menghapus ruang keluarga miliknya"
  ON public.family_groups FOR DELETE
  TO authenticated
  USING (parent_id = auth.uid());

-- Family Members: Keanggotaan keluarga
DROP POLICY IF EXISTS "Anak dan orang tua dapat melihat anggota keluarga" ON public.family_members;
CREATE POLICY "Anak dan orang tua dapat melihat anggota keluarga"
  ON public.family_members FOR SELECT
  TO authenticated
  USING (
    child_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.family_groups f
      WHERE f.id = family_members.family_id AND f.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anak dapat bergabung ke ruang keluarga" ON public.family_members;
CREATE POLICY "Anak dapat bergabung ke ruang keluarga"
  ON public.family_members FOR INSERT
  TO authenticated
  WITH CHECK (child_id = auth.uid());

DROP POLICY IF EXISTS "Anak atau orang tua dapat memutuskan hubungan keluarga" ON public.family_members;
CREATE POLICY "Anak atau orang tua dapat memutuskan hubungan keluarga"
  ON public.family_members FOR DELETE
  TO authenticated
  USING (
    child_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.family_groups f
      WHERE f.id = family_members.family_id AND f.parent_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 4. IZIN ORANG TUA MELIHAT AKTIVITAS ANAK DI RUMAH
-- ----------------------------------------------------------------------------

-- Izinkan orang tua melihat log screen time anak di keluarganya
DROP POLICY IF EXISTS "screen_time_select_parent" ON public.screen_time_logs;
CREATE POLICY "screen_time_select_parent"
  ON public.screen_time_logs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.family_members fm
      JOIN public.family_groups fg ON fg.id = fm.family_id
      WHERE fm.child_id = screen_time_logs.user_id AND fg.parent_id = auth.uid()
    )
  );

-- Izinkan orang tua melihat sesi fokus belajar anak di keluarganya
DROP POLICY IF EXISTS "focus_sessions_select_parent" ON public.focus_sessions;
CREATE POLICY "focus_sessions_select_parent"
  ON public.focus_sessions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.family_members fm
      JOIN public.family_groups fg ON fg.id = fm.family_id
      WHERE fm.child_id = focus_sessions.user_id AND fg.parent_id = auth.uid()
    )
  );

-- Izinkan orang tua melihat target anak di keluarganya
DROP POLICY IF EXISTS "user_targets_select_parent" ON public.user_targets;
CREATE POLICY "user_targets_select_parent"
  ON public.user_targets FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.family_members fm
      JOIN public.family_groups fg ON fg.id = fm.family_id
      WHERE fm.child_id = user_targets.user_id AND fg.parent_id = auth.uid()
    )
  );
