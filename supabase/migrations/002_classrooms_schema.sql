-- ============================================================================
-- TIMECRAFT — MIGRATION 002: SISTEM KELAS & PEMANTAUAN SISWA OLEH GURU
-- ============================================================================
-- Fitur:
-- 1. Tabel classrooms (kelas yang dibuat oleh guru dengan class_code unik)
-- 2. Tabel classroom_members (siswa yang bergabung menggunakan class_code)
-- 3. Row Level Security (RLS) & Kebijakan Akses:
--    - Guru dapat mengelola kelas miliknya.
--    - Siswa dapat melihat kelas yang diikutinya & bergabung dengan kode kelas.
--    - Guru dapat melihat ringkasan screen time dan sesi fokus siswa di kelasnya.
-- ============================================================================

-- 1. TABEL KELAS (classrooms)
CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_code TEXT NOT NULL UNIQUE CHECK (char_length(trim(class_code)) >= 4),
  class_name TEXT NOT NULL CHECK (char_length(trim(class_name)) >= 2),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classrooms_teacher
  ON public.classrooms (teacher_id);

CREATE INDEX IF NOT EXISTS idx_classrooms_code
  ON public.classrooms (class_code);

COMMENT ON TABLE public.classrooms IS 'Kelas yang dibuat oleh guru untuk memantau siswa.';

-- 2. TABEL ANGGOTA KELAS / SISWA (classroom_members)
CREATE TABLE IF NOT EXISTS public.classroom_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_student_per_class UNIQUE (classroom_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_members_class
  ON public.classroom_members (classroom_id);

CREATE INDEX IF NOT EXISTS idx_members_student
  ON public.classroom_members (student_id);

COMMENT ON TABLE public.classroom_members IS 'Daftar siswa yang bergabung dalam kelas guru.';

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) & POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;

-- Guru dapat melihat dan mengelola kelas buatannya
CREATE POLICY "Guru dapat melihat kelas miliknya"
  ON public.classrooms FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Siswa dapat melihat kelas yang diikutinya"
  ON public.classrooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_members m
      WHERE m.classroom_id = classrooms.id AND m.student_id = auth.uid()
    )
  );

CREATE POLICY "Guru dapat membuat kelas baru"
  ON public.classrooms FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Guru dapat mengubah kelas miliknya"
  ON public.classrooms FOR UPDATE
  USING (teacher_id = auth.uid());

CREATE POLICY "Guru dapat menghapus kelas miliknya"
  ON public.classrooms FOR DELETE
  USING (teacher_id = auth.uid());

-- Kebijakan Anggota Kelas
CREATE POLICY "Siswa dan guru dapat melihat anggota kelas"
  ON public.classroom_members FOR SELECT
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = classroom_members.classroom_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Siswa dapat bergabung ke kelas"
  ON public.classroom_members FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Siswa atau guru dapat keluar/menghapus anggota kelas"
  ON public.classroom_members FOR DELETE
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = classroom_members.classroom_id AND c.teacher_id = auth.uid()
    )
  );
