import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Users,
  PlusCircle,
  Copy,
  Check,
  Trash2,
  LogOut,
  ArrowLeft,
  FileText,
  AlertTriangle,
  Clock,
  Timer,
  Info,
  X,
  Database,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { repository } from '../services/repository';
import { Classroom, StudentReportSummary } from '../types/domain';
import { formatMinutesWithUnit } from '../utils/time';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const ClassroomPage: React.FC = () => {
  const { user } = useApp();

  // Mode Tab: 'teacher' (Guru / Pemantau) atau 'student' (Siswa / Murid)
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');

  // State Guru
  const [teacherClasses, setTeacherClasses] = useState<Classroom[]>([]);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [studentsSummary, setStudentsSummary] = useState<StudentReportSummary[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Form Buat Kelas
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSqlGuideModal, setShowSqlGuideModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // State Siswa
  const [studentClasses, setStudentClasses] = useState<Array<Classroom & { memberId: string; joinedAt: string }>>([]);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joiningClass, setJoiningClass] = useState(false);

  // Modal Detail Siswa
  const [detailStudent, setDetailStudent] = useState<StudentReportSummary | null>(null);

  // Dialog Konfirmasi Hapus / Keluar
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Notifikasi Feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadTeacherData = useCallback(async () => {
    if (!user) return;
    try {
      await repository.syncLocalClassroomsToSupabase(user.id);
    } catch {}
    const classes = await repository.getClassroomsByTeacher(user.id);
    setTeacherClasses(classes);
  }, [user]);

  const loadStudentData = useCallback(async () => {
    if (!user) return;
    const classes = await repository.getClassroomsByStudent(user.id);
    setStudentClasses(classes);
  }, [user]);

  useEffect(() => {
    loadTeacherData();
    loadStudentData();
  }, [loadTeacherData, loadStudentData]);

  const handleSelectClass = async (cls: Classroom) => {
    setSelectedClass(cls);
    setLoadingSummary(true);
    try {
      const summary = await repository.getClassroomStudentsSummary(cls.id);
      setStudentsSummary(summary);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newClassName.trim()) return;

    setCreatingClass(true);
    setFeedbackMsg(null);
    try {
      const res = await repository.createClassroom({
        teacherId: user.id,
        className: newClassName,
        description: newClassDesc,
      });

      if (res.error) {
        setFeedbackMsg({ type: 'error', text: res.error });
      } else if (res.warning) {
        setFeedbackMsg({ type: 'warning', text: res.warning });
        setNewClassName('');
        setNewClassDesc('');
        setShowCreateModal(false);
        await loadTeacherData();
      } else {
        setFeedbackMsg({
          type: 'success',
          text: `Kelas "${newClassName}" berhasil dibuat di database cloud! Bagikan kode kelas kepada murid Anda.`,
        });
        setNewClassName('');
        setNewClassDesc('');
        setShowCreateModal(false);
        await loadTeacherData();
      }
    } finally {
      setCreatingClass(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCodeInput.replace(/\s+/g, '').toUpperCase();
    if (!user || !cleanCode) return;

    setJoiningClass(true);
    setFeedbackMsg(null);
    try {
      const res = await repository.joinClassroomByCode({
        studentId: user.id,
        classCode: cleanCode,
        studentName: user.display_name,
        studentEmail: user.email,
      });

      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: res.message });
        setJoinCodeInput('');
        await loadStudentData();
      } else {
        setFeedbackMsg({ type: 'error', text: res.message });
      }
    } finally {
      setJoiningClass(false);
    }
  };

  const SUPABASE_CLASSROOM_SQL = `-- ============================================================================
-- TIMECRAFT: MIGRATION KELAS MULTI-PERANGKAT (SUPABASE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_code TEXT NOT NULL UNIQUE CHECK (char_length(trim(class_code)) >= 4),
  class_name TEXT NOT NULL CHECK (char_length(trim(class_name)) >= 2),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classroom_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_student_per_class UNIQUE (classroom_id, student_id)
);

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Semua pengguna terotentikasi dapat melihat kelas" ON public.classrooms;
CREATE POLICY "Semua pengguna terotentikasi dapat melihat kelas"
  ON public.classrooms FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Guru dapat membuat kelas baru" ON public.classrooms;
CREATE POLICY "Guru dapat membuat kelas baru"
  ON public.classrooms FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Guru dapat mengubah kelas miliknya" ON public.classrooms;
CREATE POLICY "Guru dapat mengubah kelas miliknya"
  ON public.classrooms FOR UPDATE TO authenticated USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Guru dapat menghapus kelas miliknya" ON public.classrooms;
CREATE POLICY "Guru dapat menghapus kelas miliknya"
  ON public.classrooms FOR DELETE TO authenticated USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Siswa dan guru dapat melihat anggota kelas" ON public.classroom_members;
CREATE POLICY "Siswa dan guru dapat melihat anggota kelas"
  ON public.classroom_members FOR SELECT TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.classrooms c WHERE c.id = classroom_members.classroom_id AND c.teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "Siswa dapat bergabung ke kelas" ON public.classroom_members;
CREATE POLICY "Siswa dapat bergabung ke kelas"
  ON public.classroom_members FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Siswa atau guru dapat keluar/menghapus anggota kelas" ON public.classroom_members;
CREATE POLICY "Siswa atau guru dapat keluar/menghapus anggota kelas"
  ON public.classroom_members FOR DELETE TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.classrooms c WHERE c.id = classroom_members.classroom_id AND c.teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "screen_time_select_teacher" ON public.screen_time_logs;
CREATE POLICY "screen_time_select_teacher" ON public.screen_time_logs FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.classroom_members m
      JOIN public.classrooms c ON c.id = m.classroom_id
      WHERE m.student_id = screen_time_logs.user_id AND c.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "focus_sessions_select_teacher" ON public.focus_sessions;
CREATE POLICY "focus_sessions_select_teacher" ON public.focus_sessions FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.classroom_members m
      JOIN public.classrooms c ON c.id = m.classroom_id
      WHERE m.student_id = focus_sessions.user_id AND c.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "user_targets_select_teacher" ON public.user_targets;
CREATE POLICY "user_targets_select_teacher" ON public.user_targets FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.classroom_members m
      JOIN public.classrooms c ON c.id = m.classroom_id
      WHERE m.student_id = user_targets.user_id AND c.teacher_id = auth.uid()
    )
  );`;

  const handleCopySql = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(SUPABASE_CLASSROOM_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    }
  };

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  const confirmDeleteClass = (cls: Classroom) => {
    setConfirmDialog({
      open: true,
      title: `Hapus Kelas "${cls.class_name}"?`,
      description:
        'Seluruh siswa yang terdaftar akan terlepas dari kelas ini. Data aktivitas masing-masing siswa tidak akan hilang, namun rekap kelas ini akan dihapus permanen.',
      onConfirm: async () => {
        if (!user) return;
        await repository.deleteClassroom({ classroomId: cls.id, teacherId: user.id });
        setSelectedClass(null);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setFeedbackMsg({ type: 'success', text: `Kelas "${cls.class_name}" telah dihapus.` });
        await loadTeacherData();
      },
    });
  };

  const confirmLeaveClass = (cls: Classroom & { memberId: string }) => {
    setConfirmDialog({
      open: true,
      title: `Keluar dari Kelas "${cls.class_name}"?`,
      description:
        'Anda akan keluar dari kelas ini. Guru tidak lagi dapat melihat rekap screen time dan sesi fokus Anda dari kelas ini.',
      onConfirm: async () => {
        if (!user) return;
        await repository.leaveClassroom({
          classroomId: cls.id,
          studentId: user.id,
          memberId: cls.memberId,
        });
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setFeedbackMsg({ type: 'success', text: `Anda telah keluar dari kelas "${cls.class_name}".` });
        await loadStudentData();
      },
    });
  };

  const handlePrintClassReport = () => {
    if (!selectedClass) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const todayDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const rowsHtml = studentsSummary
      .map(
        (s, idx) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
            <strong>${s.displayName}</strong><br/>
            <span style="font-size: 11px; color: #64748b;">${s.email}</span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <strong>${s.todayScreenTimeMinutes !== null ? s.todayScreenTimeMinutes + 'm' : '—'}</strong>
            ${s.isExceedingLimit ? '<br/><span style="color: #ef4444; font-size: 10px; font-weight: bold;">Melewati Batas</span>' : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <strong>${s.todayFocusMinutes > 0 ? s.todayFocusMinutes + 'm' : '0m'}</strong>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            ${s.last7DaysAvgScreenTime}m / hari
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            ${s.last7DaysAvgFocusTime}m / hari
          </td>
        </tr>`,
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Rekap Kelas — ${selectedClass.class_name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; color: #0f172a; margin: 0; }
            h1 { font-size: 20px; margin: 0 0 4px 0; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th { background-color: #f1f5f9; padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: left; }
            .meta { font-size: 12px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TimeCraft — Rekapitulasi Pemantauan Siswa</h1>
            <div class="meta">
              <strong>Kelas:</strong> ${selectedClass.class_name} (Kode: ${selectedClass.class_code})<br/>
              <strong>Guru Pembina:</strong> ${user?.display_name || 'Guru'} (${user?.email || '-'})<br/>
              <strong>Tanggal Cetak:</strong> ${todayDate} • Total Siswa: ${studentsSummary.length}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 40px;">No</th>
                <th>Nama Siswa & Email</th>
                <th style="text-align: center;">Screen Time Hari Ini</th>
                <th style="text-align: center;">Waktu Fokus Hari Ini</th>
                <th style="text-align: center;">Rata-rata Screen Time (7 Hari)</th>
                <th style="text-align: center;">Rata-rata Fokus (7 Hari)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding: 20px;">Belum ada siswa terdaftar dalam kelas ini.</td></tr>'}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Perhitungan Ringkasan Metrik Kelas
  const totalStudents = studentsSummary.length;
  const activeTodayCount = studentsSummary.filter(
    (s) => s.todayScreenTimeMinutes !== null || s.todayFocusMinutes > 0,
  ).length;

  const validScreenTimes = studentsSummary
    .map((s) => s.todayScreenTimeMinutes)
    .filter((v): v is number => v !== null);

  const avgClassScreenTime =
    validScreenTimes.length > 0
      ? Math.round(validScreenTimes.reduce((a, b) => a + b, 0) / validScreenTimes.length)
      : 0;

  const avgClassFocusTime =
    totalStudents > 0
      ? Math.round(studentsSummary.reduce((a, s) => a + s.todayFocusMinutes, 0) / totalStudents)
      : 0;

  const exceedingLimitCount = studentsSummary.filter((s) => s.isExceedingLimit).length;

  return (
    <>
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel="Ya, Lanjutkan"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />

      {/* Modal Detail Siswa */}
      {detailStudent && (
        <div className="modal-backdrop" onClick={() => setDetailStudent(null)}>
          <div
            className="card"
            style={{ maxWidth: '580px', width: '100%', margin: '1rem', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <div>
                <h2 className="card-title" style={{ fontSize: '1.15rem' }}>
                  Laporan Belajar: {detailStudent.displayName}
                </h2>
                <p className="card-description" style={{ fontSize: '0.8rem' }}>
                  {detailStudent.email} • Bergabung sejak{' '}
                  {new Date(detailStudent.joinedAt).toLocaleDateString('id-ID')}
                </p>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setDetailStudent(null)}
                aria-label="Tutup Detail"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="card-elevated" style={{ padding: '0.85rem' }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Screen Time Hari Ini</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {formatMinutesWithUnit(detailStudent.todayScreenTimeMinutes)}
                </div>
                {detailStudent.maxDailyScreenTimeLimit && (
                  <div style={{ fontSize: '0.74rem', color: detailStudent.isExceedingLimit ? '#ef4444' : '#16a34a', marginTop: '0.25rem' }}>
                    {detailStudent.isExceedingLimit ? '⚠️ Melewati batas target' : '✓ Dalam batas wajar'} ({detailStudent.maxDailyScreenTimeLimit}m)
                  </div>
                )}
              </div>

              <div className="card-elevated" style={{ padding: '0.85rem' }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Waktu Fokus Hari Ini</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-blue)', marginTop: '0.2rem' }}>
                  {detailStudent.todayFocusMinutes} menit
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Rata-rata 7 hari: {detailStudent.last7DaysAvgFocusTime}m / hari
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Aktivitas Screen Time Terakhir
            </h3>
            {detailStudent.recentLogs.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {detailStudent.recentLogs.map((log) => (
                  <li
                    key={log.id}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-hover)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span>
                      <strong>{log.category.replace(/_/g, ' ')}</strong>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                        ({log.activity_date})
                      </span>
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {log.duration_minutes} menit
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Belum ada catatan aktivitas screen time tercatat.
              </p>
            )}

            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Sesi Fokus Terakhir
            </h3>
            {detailStudent.recentFocusSessions.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {detailStudent.recentFocusSessions.map((sess) => (
                  <li
                    key={sess.id}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-hover)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span>
                      <strong>{sess.task_label || 'Sesi Fokus Mandiri'}</strong>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                        ({sess.session_date})
                      </span>
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>
                      {Math.round(sess.actual_focus_seconds / 60)} menit
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Belum ada sesi timer fokus tercatat.
              </p>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
              onClick={() => setDetailStudent(null)}
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}

      {/* Modal Form Buat Kelas Baru */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div
            className="card"
            style={{ maxWidth: '480px', width: '100%', margin: '1rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <div>
                <h2 className="card-title">Buat Kelas Baru</h2>
                <p className="card-description">
                  Sistem akan membuatkan Kode Kelas unik untuk Anda bagikan ke siswa.
                </p>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowCreateModal(false)}
                aria-label="Tutup Form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClass}>
              <div className="form-group">
                <label htmlFor="cls-name" className="form-label">
                  Nama Kelas / Kelompok Bimbingan
                </label>
                <input
                  id="cls-name"
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Kelas 10 RPL 1 / Bimbingan Fokus A"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                  minLength={2}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cls-desc" className="form-label">
                  Deskripsi / Catatan Kelas (Opsional)
                </label>
                <textarea
                  id="cls-desc"
                  className="form-textarea"
                  rows={3}
                  placeholder="Contoh: Pemantauan screen time dan kebiasaan belajar semester ganjil."
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowCreateModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={creatingClass}
                >
                  {creatingClass ? 'Membuat...' : 'Buat Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Panduan Aktivasi Database Supabase (Multi-Perangkat) */}
      {showSqlGuideModal && (
        <div className="modal-overlay" onClick={() => setShowSqlGuideModal(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: '640px', width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="icon-box-blue"><Database size={18} /></span>
                <h3 className="modal-title">Aktivasi Sinkronisasi Multi-Perangkat (Supabase SQL)</h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowSqlGuideModal(false)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.75rem' }}>
                Agar kode kelas yang dibuat guru di laptop dapat langsung ditemukan dan diikuti murid di ponsel (HP), tabel database kelas perlu dibuat satu kali di Supabase Anda:
              </p>
              <ol style={{ paddingLeft: '1.25rem', margin: '0 0 1rem' }}>
                <li>Buka dashboard <strong>Supabase</strong> proyek Anda di peramban.</li>
                <li>Klik menu <strong>SQL Editor</strong> di bilah navigasi kiri.</li>
                <li>Klik tombol <strong>"New Query"</strong>, tempelkan (paste) kode SQL di bawah ini, lalu klik <strong>Run</strong>.</li>
              </ol>
            </div>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--surface-hover)',
                  padding: '0.45rem 0.75rem',
                  borderTopLeftRadius: 'var(--radius-sm)',
                  borderTopRightRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                <span>Script Migrasi SQL (Tabel Classrooms &amp; Anggota)</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCopySql}
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                >
                  {copiedSql ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                  <span>{copiedSql ? 'Tersalin ke Clipboard!' : 'Salin Kode SQL'}</span>
                </button>
              </div>
              <pre
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  margin: 0,
                  padding: '0.85rem',
                  backgroundColor: '#090d16',
                  color: '#e2e8f0',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  borderBottomLeftRadius: 'var(--radius-sm)',
                  borderBottomRightRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  whiteSpace: 'pre',
                }}
              >
                {SUPABASE_CLASSROOM_SQL}
              </pre>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCopySql}
              >
                {copiedSql ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedSql ? 'Berhasil Disalin!' : 'Salin Seluruh Kode SQL'}</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowSqlGuideModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Halaman Utama */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Portal Kelas &amp; Pemantauan Siswa</h1>
          <p className="page-subtitle">
            Pantau kedisiplinan screen time dan sesi fokus murid secara transparan untuk mendukung kebiasaan digital yang sehat.
          </p>
        </div>

        {activeTab === 'teacher' && !selectedClass && (
          <div className="page-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowSqlGuideModal(true)}
              title="Panduan sinkronisasi Supabase untuk akses Laptop & HP"
            >
              <Database size={16} color="var(--primary-blue)" />
              <span>Sinkronisasi Cloud (SQL)</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusCircle size={16} />
              <span>Buat Kelas Baru</span>
            </button>
          </div>
        )}
      </header>

      {/* Banner Feedback Pesan */}
      {feedbackMsg && (
        <div
          className={`alert ${
            feedbackMsg.type === 'success'
              ? 'alert-success'
              : feedbackMsg.type === 'warning'
                ? 'alert-warning'
                : 'alert-error'
          }`}
          role="status"
          style={{ marginBottom: '1.25rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.75rem' }}>
            <span>{feedbackMsg.text}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              {feedbackMsg.type === 'warning' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSqlGuideModal(true)}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                >
                  <Database size={13} />
                  <span>Buka Panduan SQL</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setFeedbackMsg(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                aria-label="Tutup notifikasi"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pemilih Tab Mode Guru vs Mode Siswa (Hanya tampil saat tidak sedang membuka detail kelas) */}
      {!selectedClass && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.35rem',
            backgroundColor: 'var(--surface-hover)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            maxWidth: '440px',
          }}
        >
          <button
            type="button"
            className={`btn ${activeTab === 'teacher' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveTab('teacher');
              setFeedbackMsg(null);
            }}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '0.55rem' }}
          >
            <GraduationCap size={16} />
            <span>Mode Guru (Pemantau)</span>
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'student' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveTab('student');
              setFeedbackMsg(null);
            }}
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '0.55rem' }}
          >
            <Users size={16} />
            <span>Mode Siswa (Kelas Saya)</span>
          </button>
        </div>
      )}

      {/* =====================================================================
       * KONTEN MODE GURU: DAFTAR KELAS ATAU DASBOR KELAS YANG DIPILIH
       * ===================================================================== */}
      {activeTab === 'teacher' && (
        <>
          {selectedClass ? (
            /* Tampilan Dasbor Kelas yang Sedang Dipantau */
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedClass(null)}
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                  >
                    <ArrowLeft size={15} />
                    <span>Kembali ke Daftar Kelas</span>
                  </button>

                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {selectedClass.class_name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <span className="badge badge-blue">
                        Kode Kelas: <strong>{selectedClass.class_code}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(selectedClass.class_code)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--primary-blue)',
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontWeight: 600,
                        }}
                      >
                        {copiedCode === selectedClass.class_code ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedCode === selectedClass.class_code ? 'Tersalin!' : 'Salin Kode'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handlePrintClassReport}
                    title="Cetak rekapitulasi kelas atau simpan ke PDF"
                  >
                    <FileText size={15} color="var(--primary-blue)" />
                    <span>Cetak Rekap Kelas (PDF)</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => confirmDeleteClass(selectedClass)}
                  >
                    <Trash2 size={15} />
                    <span>Hapus Kelas</span>
                  </button>
                </div>
              </div>

              {/* 4 Kartu Metrik Ringkasan Kelas */}
              <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
                <div className="card">
                  <div className="stat-card-header">
                    <span>Total Siswa Terdaftar</span>
                    <span className="icon-box-blue"><Users size={17} /></span>
                  </div>
                  <div className="stat-card-value">{totalStudents}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    {activeTodayCount} siswa aktif hari ini
                  </div>
                </div>

                <div className="card">
                  <div className="stat-card-header">
                    <span>Rata-rata Screen Time</span>
                    <span className="icon-box-blue"><Clock size={17} /></span>
                  </div>
                  <div className="stat-card-value">
                    {formatMinutesWithUnit(avgClassScreenTime)}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Rerata penggunaan hari ini
                  </div>
                </div>

                <div className="card">
                  <div className="stat-card-header">
                    <span>Rata-rata Waktu Fokus</span>
                    <span className="icon-box-blue"><Timer size={17} /></span>
                  </div>
                  <div className="stat-card-value" style={{ color: 'var(--primary-blue)' }}>
                    {avgClassFocusTime}m
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Rerata sesi belajar kelas
                  </div>
                </div>

                <div className="card">
                  <div className="stat-card-header">
                    <span>Melebihi Batas Layar</span>
                    <span className="icon-box-blue" style={{ color: exceedingLimitCount > 0 ? '#ef4444' : '#16a34a' }}>
                      <AlertTriangle size={17} />
                    </span>
                  </div>
                  <div
                    className="stat-card-value"
                    style={{ color: exceedingLimitCount > 0 ? '#ef4444' : 'var(--text-primary)' }}
                  >
                    {exceedingLimitCount} siswa
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    {exceedingLimitCount > 0 ? 'Perlu evaluasi pembimbing' : 'Semua siswa dalam batas'}
                  </div>
                </div>
              </div>

              {/* Tabel Pemantauan Siswa */}
              <section className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">Daftar Aktivitas Siswa ({totalStudents})</h3>
                    <p className="card-description">
                      Data screen time dan fokus belajar otomatis diperbarui saat siswa mencatat aktivitas di akun mereka.
                    </p>
                  </div>
                </div>

                {loadingSummary ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Mengambil data aktivitas siswa...
                  </div>
                ) : studentsSummary.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '0.75rem 0.65rem' }}>Siswa</th>
                          <th style={{ padding: '0.75rem 0.65rem' }}>Screen Time Hari Ini</th>
                          <th style={{ padding: '0.75rem 0.65rem' }}>Waktu Fokus Hari Ini</th>
                          <th style={{ padding: '0.75rem 0.65rem' }}>Rata-rata 7 Hari</th>
                          <th style={{ padding: '0.75rem 0.65rem', textAlign: 'right' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsSummary.map((s) => (
                          <tr
                            key={s.studentId}
                            style={{ borderBottom: '1px solid var(--border-subtle)' }}
                          >
                            <td style={{ padding: '0.85rem 0.65rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--surface-hover)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    color: 'var(--primary-blue)',
                                    fontSize: '0.85rem',
                                    flexShrink: 0,
                                  }}
                                >
                                  {s.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {s.displayName}
                                  </div>
                                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                    {s.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '0.85rem 0.65rem' }}>
                              {s.todayScreenTimeMinutes !== null ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <strong style={{ color: s.isExceedingLimit ? '#ef4444' : 'var(--text-primary)' }}>
                                    {s.todayScreenTimeMinutes}m
                                  </strong>
                                  {s.isExceedingLimit ? (
                                    <span
                                      style={{
                                        fontSize: '0.7rem',
                                        color: '#ef4444',
                                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        padding: '0.1rem 0.35rem',
                                        borderRadius: '4px',
                                        fontWeight: 600,
                                      }}
                                    >
                                      Melebihi Batas
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: '0.7rem',
                                        color: '#16a34a',
                                        backgroundColor: 'rgba(22, 163, 74, 0.1)',
                                        padding: '0.1rem 0.35rem',
                                        borderRadius: '4px',
                                        fontWeight: 600,
                                      }}
                                    >
                                      Aman
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                  Belum ada catatan
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '0.85rem 0.65rem' }}>
                              <strong style={{ color: 'var(--primary-blue)' }}>
                                {s.todayFocusMinutes > 0 ? `${s.todayFocusMinutes} menit` : '0m'}
                              </strong>
                            </td>

                            <td style={{ padding: '0.85rem 0.65rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                              Layar: {s.last7DaysAvgScreenTime}m • Fokus: {s.last7DaysAvgFocusTime}m
                            </td>

                            <td style={{ padding: '0.85rem 0.65rem', textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                onClick={() => setDetailStudent(s)}
                              >
                                Detail Laporan
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                    <Users size={36} color="var(--primary-blue)" style={{ margin: '0 auto 0.75rem', opacity: 0.7 }} />
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      Belum Ada Siswa yang Bergabung
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1rem' }}>
                      Bagikan Kode Kelas <strong>{selectedClass.class_code}</strong> kepada murid-murid Anda agar mereka dapat bergabung dan mengisi laporan harian.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleCopyCode(selectedClass.class_code)}
                    >
                      <Copy size={15} />
                      <span>{copiedCode === selectedClass.class_code ? 'Kode Berhasil Disalin!' : 'Salin Kode Kelas untuk Murid'}</span>
                    </button>
                  </div>
                )}
              </section>
            </div>
          ) : (
            /* Daftar Seluruh Kelas yang Diajar Guru */
            <div>
              {teacherClasses.length > 0 ? (
                <div className="grid-2">
                  {teacherClasses.map((cls) => (
                    <div key={cls.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.65rem' }}>
                          <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                              {cls.class_name}
                            </h3>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                              Dibuat: {new Date(cls.created_at).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                          <span className="icon-box-blue">
                            <GraduationCap size={18} />
                          </span>
                        </div>

                        {cls.description && (
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem', lineHeight: 1.45 }}>
                            {cls.description}
                          </p>
                        )}

                        {/* Kotak Kode Kelas yang Menarik */}
                        <div
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--surface-blue-light)',
                            border: '1px solid var(--border-blue-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '1rem',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                              KODE KELAS SISWA
                            </div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-blue)', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                              {cls.class_code}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleCopyCode(cls.class_code)}
                            style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
                          >
                            {copiedCode === cls.class_code ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copiedCode === cls.class_code ? 'Tersalin' : 'Salin Kode'}</span>
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => handleSelectClass(cls)}
                        >
                          <Users size={16} />
                          <span>Buka Dasbor Pantau Kelas</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => confirmDeleteClass(cls)}
                          title="Hapus Kelas"
                          aria-label="Hapus Kelas"
                          style={{ padding: '0.55rem' }}
                        >
                          <Trash2 size={16} color="var(--status-danger)" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state saat guru belum memiliki kelas */
                <section className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                  <GraduationCap size={44} color="var(--primary-blue)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>
                    Belum Ada Kelas yang Dibuat
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.25rem', lineHeight: 1.55 }}>
                    Sebagai guru atau pembimbing, Anda dapat membuat ruang kelas digital untuk memantau waktu layar dan konsistensi sesi fokus murid Anda secara transparan.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <PlusCircle size={16} />
                    <span>Buat Kelas Belajar Pertama</span>
                  </button>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {/* =====================================================================
       * KONTEN MODE SISWA: FORM GABUNG KELAS & KELAS YANG SEDANG DIIKUTI
       * ===================================================================== */}
      {activeTab === 'student' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Form Bergabung Menggunakan Kode Kelas */}
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Gabung ke Kelas Guru</h2>
                <p className="card-description">
                  Masukkan Kode Kelas yang dibagikan oleh guru atau pembimbing Anda untuk menghubungkan laporan aktivitas belajar Anda.
                </p>
              </div>
              <span className="icon-box-blue">
                <Users size={18} />
              </span>
            </div>

            <form onSubmit={handleJoinClass} style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 240px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masukkan Kode Kelas (contoh: TC-8XJR)"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.replace(/\s+/g, '').toUpperCase())}
                  required
                  style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={joiningClass}
                style={{ padding: '0.65rem 1.25rem' }}
              >
                {joiningClass ? 'Memproses...' : 'Gabung ke Kelas'}
              </button>
            </form>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
              }}
            >
              <Info size={15} color="var(--primary-blue)" style={{ flexShrink: 0 }} />
              <span>
                Dengan bergabung, guru kelas dapat melihat rekapan screen time dan durasi fokus Anda untuk membantu evaluasi belajar digital yang seimbang.
              </span>
            </div>
          </section>

          {/* Daftar Kelas yang Diikuti Siswa */}
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Kelas yang Saya Ikuti ({studentClasses.length})</h2>
                <p className="card-description">
                  Daftar kelas bimbingan yang saat ini memantau laporan aktivitas TimeCraft Anda.
                </p>
              </div>
            </div>

            {studentClasses.length > 0 ? (
              <div className="grid-2">
                {studentClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="card-elevated"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            {cls.class_name}
                          </h3>
                          <span className="badge badge-blue" style={{ marginTop: '0.35rem' }}>
                            Kode: {cls.class_code}
                          </span>
                        </div>
                        <span className="icon-box-blue"><GraduationCap size={16} /></span>
                      </div>

                      {cls.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.45rem', lineHeight: 1.4 }}>
                          {cls.description}
                        </p>
                      )}

                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        📅 Bergabung sejak: {new Date(cls.joinedAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px dashed var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                        ✓ Terhubung Aktif
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => confirmLeaveClass(cls)}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      >
                        <LogOut size={13} />
                        <span>Keluar Kelas</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '0.86rem', margin: 0 }}>
                  Anda belum bergabung ke kelas mana pun. Masukkan kode kelas dari guru Anda pada formulir di atas.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
};
