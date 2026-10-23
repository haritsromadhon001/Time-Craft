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
  Home,
  Heart,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { repository } from '../services/repository';
import {
  Classroom,
  StudentReportSummary,
  FamilyGroup,
  ChildReportSummary,
} from '../types/domain';
import { formatMinutesWithUnit } from '../utils/time';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const ClassroomPage: React.FC = () => {
  const { user } = useApp();

  // Kategori Utama: 'school' (Sekolah: Guru & Siswa) atau 'family' (Keluarga: Orang Tua & Anak)
  const [mainCategory, setMainCategory] = useState<'school' | 'family'>('school');

  // ============================================================================
  // STATE SEKOLAH (GURU & SISWA)
  // ============================================================================
  const [schoolTab, setSchoolTab] = useState<'teacher' | 'student'>('teacher');
  const [teacherClasses, setTeacherClasses] = useState<Classroom[]>([]);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [studentsSummary, setStudentsSummary] = useState<StudentReportSummary[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [studentClasses, setStudentClasses] = useState<
    Array<Classroom & { memberId: string; joinedAt: string }>
  >([]);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joiningClass, setJoiningClass] = useState(false);
  const [detailStudent, setDetailStudent] = useState<StudentReportSummary | null>(null);

  // ============================================================================
  // STATE KELUARGA (ORANG TUA & ANAK)
  // ============================================================================
  const [familyTab, setFamilyTab] = useState<'parent' | 'child'>('parent');
  const [parentFamilies, setParentFamilies] = useState<FamilyGroup[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<FamilyGroup | null>(null);
  const [childrenSummary, setChildrenSummary] = useState<ChildReportSummary[]>([]);
  const [loadingChildrenSummary, setLoadingChildrenSummary] = useState(false);

  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyDesc, setNewFamilyDesc] = useState('');
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [showCreateFamilyModal, setShowCreateFamilyModal] = useState(false);

  const [childFamilies, setChildFamilies] = useState<
    Array<FamilyGroup & { memberId: string; joinedAt: string }>
  >([]);
  const [joinFamilyCodeInput, setJoinFamilyCodeInput] = useState('');
  const [joiningFamily, setJoiningFamily] = useState(false);
  const [detailChild, setDetailChild] = useState<ChildReportSummary | null>(null);

  // ============================================================================
  // DIALOG & NOTIFIKASI
  // ============================================================================
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

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load Data Sekolah
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

  // Load Data Keluarga
  const loadParentFamilyData = useCallback(async () => {
    if (!user) return;
    try {
      await repository.syncLocalFamiliesToSupabase(user.id);
    } catch {}
    const families = await repository.getFamilyGroupsByParent(user.id);
    setParentFamilies(families);
  }, [user]);

  const loadChildFamilyData = useCallback(async () => {
    if (!user) return;
    const families = await repository.getFamilyGroupsByChild(user.id);
    setChildFamilies(families);
  }, [user]);

  useEffect(() => {
    loadTeacherData();
    loadStudentData();
    loadParentFamilyData();
    loadChildFamilyData();
  }, [loadTeacherData, loadStudentData, loadParentFamilyData, loadChildFamilyData]);

  // Handler Kelas Sekolah
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
      } else {
        setFeedbackMsg({
          type: 'success',
          text: `Kelas "${newClassName}" berhasil dibuat! Bagikan kode kelas kepada murid Anda.`,
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

  // Handler Ruang Keluarga
  const handleSelectFamily = async (fam: FamilyGroup) => {
    setSelectedFamily(fam);
    setLoadingChildrenSummary(true);
    try {
      const summary = await repository.getFamilyChildrenSummary(fam.id);
      setChildrenSummary(summary);
    } finally {
      setLoadingChildrenSummary(false);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFamilyName.trim()) return;

    setCreatingFamily(true);
    setFeedbackMsg(null);
    try {
      const res = await repository.createFamilyGroup({
        parentId: user.id,
        familyName: newFamilyName,
        description: newFamilyDesc,
      });

      if (res.error) {
        setFeedbackMsg({ type: 'error', text: res.error });
      } else {
        setFeedbackMsg({
          type: 'success',
          text: `Ruang keluarga "${newFamilyName}" berhasil dibuat! Bagikan kode keluarga kepada anak Anda.`,
        });
        setNewFamilyName('');
        setNewFamilyDesc('');
        setShowCreateFamilyModal(false);
        await loadParentFamilyData();
      }
    } finally {
      setCreatingFamily(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinFamilyCodeInput.replace(/\s+/g, '').toUpperCase();
    if (!user || !cleanCode) return;

    setJoiningFamily(true);
    setFeedbackMsg(null);
    try {
      const res = await repository.joinFamilyByCode({
        childId: user.id,
        familyCode: cleanCode,
        childName: user.display_name,
        childEmail: user.email,
      });

      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: res.message });
        setJoinFamilyCodeInput('');
        await loadChildFamilyData();
      } else {
        setFeedbackMsg({ type: 'error', text: res.message });
      }
    } finally {
      setJoiningFamily(false);
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
        // Optimistic UI: langsung singkirkan kelas dari antarmuka seketika
        setTeacherClasses((prev) =>
          prev.filter((c) => c.id !== cls.id && c.class_code !== cls.class_code)
        );
        if (selectedClass?.id === cls.id || selectedClass?.class_code === cls.class_code) {
          setSelectedClass(null);
        }
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          await repository.deleteClassroom({
            classroomId: cls.id,
            teacherId: user.id,
            classCode: cls.class_code,
          });
          setFeedbackMsg({ type: 'success', text: `Kelas "${cls.class_name}" telah dihapus.` });
        } catch {
          setFeedbackMsg({ type: 'error', text: `Gagal menghapus kelas "${cls.class_name}".` });
        }
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
        setStudentClasses((prev) =>
          prev.filter((c) => c.id !== cls.id && c.class_code !== cls.class_code)
        );
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          await repository.leaveClassroom({
            classroomId: cls.id,
            studentId: user.id,
            memberId: cls.memberId,
          });
          setFeedbackMsg({ type: 'success', text: `Anda telah keluar dari kelas "${cls.class_name}".` });
        } catch {
          setFeedbackMsg({ type: 'error', text: `Gagal keluar dari kelas "${cls.class_name}".` });
        }
        await loadStudentData();
      },
    });
  };

  const confirmDeleteFamily = (fam: FamilyGroup) => {
    setConfirmDialog({
      open: true,
      title: `Hapus Ruang Keluarga "${fam.family_name}"?`,
      description:
        'Seluruh anggota keluarga yang terhubung akan terlepas. Data aktivitas anak tidak akan hilang, namun ruang pemantauan ini akan dihapus permanen.',
      onConfirm: async () => {
        if (!user) return;
        setParentFamilies((prev) =>
          prev.filter((f) => f.id !== fam.id && f.family_code !== fam.family_code)
        );
        if (selectedFamily?.id === fam.id || selectedFamily?.family_code === fam.family_code) {
          setSelectedFamily(null);
        }
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          await repository.deleteFamilyGroup({
            familyId: fam.id,
            parentId: user.id,
            familyCode: fam.family_code,
          });
          setFeedbackMsg({ type: 'success', text: `Ruang keluarga "${fam.family_name}" telah dihapus.` });
        } catch {
          setFeedbackMsg({ type: 'error', text: `Gagal menghapus ruang keluarga "${fam.family_name}".` });
        }
        await loadParentFamilyData();
      },
    });
  };

  const confirmLeaveFamily = (fam: FamilyGroup & { memberId: string }) => {
    setConfirmDialog({
      open: true,
      title: `Putuskan Hubungan dari "${fam.family_name}"?`,
      description:
        'Anda akan keluar dari ruang keluarga ini. Orang tua tidak lagi dapat memantau laporan waktu layar Anda dari ruang ini.',
      onConfirm: async () => {
        if (!user) return;
        setChildFamilies((prev) => prev.filter((f) => f.id !== fam.id));
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          await repository.leaveFamilyGroup({
            familyId: fam.id,
            childId: user.id,
          });
          setFeedbackMsg({ type: 'success', text: `Anda telah keluar dari ruang keluarga "${fam.family_name}".` });
        } catch {
          setFeedbackMsg({ type: 'error', text: `Gagal memutuskan hubungan dari ruang keluarga.` });
        }
        await loadChildFamilyData();
      },
    });
  };

  // Cetak Rekap Kelas PDF
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
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #2563eb;">
            <strong>${s.todayFocusMinutes > 0 ? s.todayFocusMinutes + 'm' : '0m'}</strong>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px;">
            Layar: ${s.last7DaysAvgScreenTime}m<br/>Fokus: ${s.last7DaysAvgFocusTime}m
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 11px;">
            ${new Date(s.joinedAt).toLocaleDateString('id-ID')}
          </td>
        </tr>`,
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rekapitulasi Kelas — ${selectedClass.class_name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #0f172a; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            .meta { font-size: 12px; color: #64748b; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th { background: #f8fafc; padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
          </style>
        </head>
        <body>
          <h1>Laporan Pemantauan Kelas: ${selectedClass.class_name}</h1>
          <div class="meta">
            Kode Kelas: <strong>${selectedClass.class_code}</strong> | Tanggal Laporan: ${todayDate} | Dicetak oleh: ${user?.display_name || user?.email}
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th>Nama Siswa</th>
                <th style="text-align: center;">Waktu Layar Hari Ini</th>
                <th style="text-align: center;">Fokus Belajar Hari Ini</th>
                <th style="text-align: center;">Rerata 7 Hari</th>
                <th style="text-align: center;">Tanggal Terhubung</th>
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

  // Cetak Rekap Keluarga PDF
  const handlePrintFamilyReport = () => {
    if (!selectedFamily) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const todayDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const rowsHtml = childrenSummary
      .map(
        (c, idx) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
            <strong>${c.displayName}</strong><br/>
            <span style="font-size: 11px; color: #64748b;">${c.email}</span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <strong>${c.todayScreenTimeMinutes !== null ? c.todayScreenTimeMinutes + 'm' : '—'}</strong>
            ${c.isExceedingLimit ? '<br/><span style="color: #ef4444; font-size: 10px; font-weight: bold;">Melewati Batas Rumah</span>' : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #2563eb;">
            <strong>${c.todayFocusMinutes > 0 ? c.todayFocusMinutes + 'm' : '0m'}</strong>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px;">
            Layar: ${c.last7DaysAvgScreenTime}m<br/>Fokus: ${c.last7DaysAvgFocusTime}m
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 11px;">
            ${new Date(c.joinedAt).toLocaleDateString('id-ID')}
          </td>
        </tr>`,
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rekapitulasi Layar Keluarga — ${selectedFamily.family_name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #0f172a; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            .meta { font-size: 12px; color: #64748b; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th { background: #f8fafc; padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
          </style>
        </head>
        <body>
          <h1>Laporan Screen Time Keluarga: ${selectedFamily.family_name}</h1>
          <div class="meta">
            Kode Keluarga: <strong>${selectedFamily.family_code}</strong> | Tanggal: ${todayDate} | Dipantau oleh: ${user?.display_name || user?.email}
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th>Nama Anak</th>
                <th style="text-align: center;">Screen Time Hari Ini</th>
                <th style="text-align: center;">Fokus Belajar Hari Ini</th>
                <th style="text-align: center;">Rerata 7 Hari</th>
                <th style="text-align: center;">Terhubung Sejak</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding: 20px;">Belum ada anak terhubung dalam ruang keluarga ini.</td></tr>'}
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

  // Metrik Kelas
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

  // Metrik Keluarga
  const totalChildren = childrenSummary.length;
  const activeChildrenCount = childrenSummary.filter(
    (c) => c.todayScreenTimeMinutes !== null || c.todayFocusMinutes > 0,
  ).length;
  const validChildScreenTimes = childrenSummary
    .map((c) => c.todayScreenTimeMinutes)
    .filter((v): v is number => v !== null);
  const avgFamilyScreenTime =
    validChildScreenTimes.length > 0
      ? Math.round(validChildScreenTimes.reduce((a, b) => a + b, 0) / validChildScreenTimes.length)
      : 0;
  const avgFamilyFocusTime =
    totalChildren > 0
      ? Math.round(childrenSummary.reduce((a, c) => a + c.todayFocusMinutes, 0) / totalChildren)
      : 0;
  const exceedingFamilyLimitCount = childrenSummary.filter((c) => c.isExceedingLimit).length;

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

      {/* Modal Detail Siswa (Sekolah) */}
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
                <p className="card-description" style={{ fontSize: '0.8rem' }}>{detailStudent.email}</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem' }}
                onClick={() => setDetailStudent(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-hover)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Screen Time Hari Ini</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.2rem', color: detailStudent.isExceedingLimit ? '#ef4444' : 'var(--text-primary)' }}>
                  {detailStudent.todayScreenTimeMinutes !== null ? `${detailStudent.todayScreenTimeMinutes}m` : '0m'}
                </div>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-hover)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Fokus Belajar Hari Ini</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--primary-blue)' }}>
                  {detailStudent.todayFocusMinutes}m
                </div>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-hover)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Rerata 7 Hari Layar</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.2rem' }}>
                  {detailStudent.last7DaysAvgScreenTime}m
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem' }}>Catatan Screen Time Terbaru</h4>
            {detailStudent.recentLogs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                {detailStudent.recentLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                    <span>{log.category} ({log.duration_minutes}m)</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{log.activity_date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Belum ada log screen time tercatat.</p>
            )}

            <button type="button" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setDetailStudent(null)}>
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal Detail Anak (Keluarga) */}
      {detailChild && (
        <div className="modal-backdrop" onClick={() => setDetailChild(null)}>
          <div
            className="card"
            style={{ maxWidth: '580px', width: '100%', margin: '1rem', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <div>
                <h2 className="card-title" style={{ fontSize: '1.15rem' }}>
                  Aktivitas di Rumah: {detailChild.displayName}
                </h2>
                <p className="card-description" style={{ fontSize: '0.8rem' }}>{detailChild.email}</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem' }}
                onClick={() => setDetailChild(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-hover)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Screen Time Hari Ini</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.2rem', color: detailChild.isExceedingLimit ? '#ef4444' : 'var(--text-primary)' }}>
                  {detailChild.todayScreenTimeMinutes !== null ? `${detailChild.todayScreenTimeMinutes}m` : '0m'}
                </div>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-hover)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Fokus Belajar Hari Ini</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--primary-blue)' }}>
                  {detailChild.todayFocusMinutes}m
                </div>
              </div>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-hover)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Rerata 7 Hari</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.2rem' }}>
                  {detailChild.last7DaysAvgScreenTime}m
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem' }}>Log Penggunaan Layar Anak</h4>
            {detailChild.recentLogs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                {detailChild.recentLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                    <span>{log.category} ({log.duration_minutes}m)</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{log.activity_date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Belum ada log screen time tercatat di rumah.</p>
            )}

            <button type="button" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setDetailChild(null)}>
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal Buat Kelas Sekolah */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', margin: '1rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <h2 className="card-title" style={{ fontSize: '1.15rem' }}>Buat Kelas Baru</h2>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => setShowCreateModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateClass}>
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Nama Kelas</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: TRKJ-C atau Kelas 10 IPA 1"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Deskripsi (Opsional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Keterangan singkat kelas..."
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCreateModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={creatingClass}>
                  {creatingClass ? 'Membuat...' : 'Buat Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Buat Ruang Keluarga */}
      {showCreateFamilyModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateFamilyModal(false)}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', margin: '1rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <h2 className="card-title" style={{ fontSize: '1.15rem' }}>Buat Ruang Keluarga</h2>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => setShowCreateFamilyModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateFamily}>
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Nama Ruang Keluarga</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Keluarga Harits atau Rumah Kami"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Catatan Pemantauan Rumah (Opsional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Target kebiasaan digital anak di rumah..."
                  value={newFamilyDesc}
                  onChange={(e) => setNewFamilyDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCreateFamilyModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={creatingFamily}>
                  {creatingFamily ? 'Membuat...' : 'Buat Ruang Keluarga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Utama Halaman */}
      <header className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.55rem)', fontWeight: 800 }}>
            {mainCategory === 'school' ? 'Portal Kelas & Pemantauan Siswa' : 'Portal Keluarga & Pemantauan Anak'}
          </h1>
          <p className="page-subtitle" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
            {mainCategory === 'school'
              ? 'Pantau kedisiplinan screen time dan sesi fokus murid secara transparan untuk mendukung kebiasaan digital yang sehat.'
              : 'Pantau penggunaan layar anak di rumah secara bijak dan dampingi waktu belajar digital yang seimbang.'}
          </p>
        </div>

        <div className="page-actions">
          {mainCategory === 'school' && schoolTab === 'teacher' && !selectedClass && (
            <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <PlusCircle size={16} />
              <span>Buat Kelas Baru</span>
            </button>
          )}
          {mainCategory === 'family' && familyTab === 'parent' && !selectedFamily && (
            <button type="button" className="btn btn-primary" onClick={() => setShowCreateFamilyModal(true)}>
              <PlusCircle size={16} />
              <span>Buat Ruang Keluarga</span>
            </button>
          )}
        </div>
      </header>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className={`alert ${feedbackMsg.type === 'success' ? 'alert-success' : 'alert-error'}`} role="status" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.75rem' }}>
            <span>{feedbackMsg.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* SEGMENTED SWITCHER UTAMA: SEKOLAH VS KELUARGA */}
      {(!selectedClass && !selectedFamily) && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.65rem',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMainCategory('school');
              setFeedbackMsg(null);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: mainCategory === 'school' ? 'var(--primary-blue)' : 'var(--surface-hover)',
              color: mainCategory === 'school' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <GraduationCap size={16} />
            <span>Sekolah (Guru &amp; Siswa)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMainCategory('family');
              setFeedbackMsg(null);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: mainCategory === 'family' ? 'var(--primary-blue)' : 'var(--surface-hover)',
              color: mainCategory === 'family' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <Home size={16} />
            <span>Keluarga (Orang Tua &amp; Anak)</span>
          </button>
        </div>
      )}

      {/* =====================================================================
       * BAGIAN 1: SEKOLAH (GURU & SISWA)
       * ===================================================================== */}
      {mainCategory === 'school' && (
        <>
          {/* Sub-tab Peran Sekolah */}
          {!selectedClass && (
            <div
              style={{
                display: 'flex',
                width: '100%',
                maxWidth: '440px',
                backgroundColor: 'var(--surface-hover)',
                borderRadius: 'var(--radius-md)',
                padding: '0.3rem',
                marginBottom: '1.25rem',
                gap: '0.35rem',
              }}
            >
              <button
                type="button"
                className={`btn ${schoolTab === 'teacher' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setSchoolTab('teacher');
                  setFeedbackMsg(null);
                }}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.55rem 0.5rem', whiteSpace: 'nowrap' }}
              >
                <GraduationCap size={15} />
                <span>Mode Guru</span>
              </button>
              <button
                type="button"
                className={`btn ${schoolTab === 'student' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setSchoolTab('student');
                  setFeedbackMsg(null);
                }}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.55rem 0.5rem', whiteSpace: 'nowrap' }}
              >
                <Users size={15} />
                <span>Mode Siswa</span>
              </button>
            </div>
          )}

          {/* Mode Guru */}
          {schoolTab === 'teacher' && (
            <>
              {selectedClass ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setSelectedClass(null)} style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}>
                        <ArrowLeft size={15} />
                        <span>Kembali ke Daftar Kelas</span>
                      </button>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {selectedClass.class_name}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                          <span className="badge badge-blue">Kode: <strong>{selectedClass.class_code}</strong></span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(selectedClass.class_code)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-blue)', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                          >
                            {copiedCode === selectedClass.class_code ? <Check size={13} /> : <Copy size={13} />}
                            <span>{copiedCode === selectedClass.class_code ? 'Tersalin!' : 'Salin Kode'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-secondary" onClick={handlePrintClassReport}>
                        <FileText size={15} color="var(--primary-blue)" />
                        <span>Cetak Rekap Kelas (PDF)</span>
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => confirmDeleteClass(selectedClass)}>
                        <Trash2 size={15} />
                        <span>Hapus Kelas</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Kartu Metrik Kelas */}
                  <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
                    <div className="card">
                      <div className="stat-card-header">
                        <span>Total Siswa Terdaftar</span>
                        <span className="icon-box-blue"><Users size={17} /></span>
                      </div>
                      <div className="stat-card-value">{totalStudents}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{activeTodayCount} siswa aktif hari ini</div>
                    </div>
                    <div className="card">
                      <div className="stat-card-header">
                        <span>Rata-rata Screen Time</span>
                        <span className="icon-box-blue"><Clock size={17} /></span>
                      </div>
                      <div className="stat-card-value">{formatMinutesWithUnit(avgClassScreenTime)}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Rerata penggunaan hari ini</div>
                    </div>
                    <div className="card">
                      <div className="stat-card-header">
                        <span>Rata-rata Waktu Fokus</span>
                        <span className="icon-box-blue"><Timer size={17} /></span>
                      </div>
                      <div className="stat-card-value" style={{ color: 'var(--primary-blue)' }}>{avgClassFocusTime}m</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Rerata sesi belajar kelas</div>
                    </div>
                    <div className="card">
                      <div className="stat-card-header">
                        <span>Melebihi Batas Layar</span>
                        <span className="icon-box-blue" style={{ color: exceedingLimitCount > 0 ? '#ef4444' : '#16a34a' }}>
                          <AlertTriangle size={17} />
                        </span>
                      </div>
                      <div className="stat-card-value" style={{ color: exceedingLimitCount > 0 ? '#ef4444' : 'var(--text-primary)' }}>
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
                        <h3 className="card-title">Daftar Aktivitas Siswa ({studentsSummary.length})</h3>
                        <p className="card-description">Laporan screen time dan fokus belajar siswa diperbarui otomatis.</p>
                      </div>
                    </div>

                    {loadingSummary ? (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>Memuat data siswa...</div>
                    ) : studentsSummary.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                              <th style={{ padding: '0.65rem' }}>SISWA</th>
                              <th style={{ padding: '0.65rem' }}>SCREEN TIME HARI INI</th>
                              <th style={{ padding: '0.65rem' }}>WAKTU FOKUS</th>
                              <th style={{ padding: '0.65rem' }}>RATA-RATA 7 HARI</th>
                              <th style={{ padding: '0.65rem', textAlign: 'right' }}>AKSI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentsSummary.map((s) => (
                              <tr key={s.studentId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <td style={{ padding: '0.75rem 0.65rem' }}>
                                  <strong>{s.displayName}</strong>
                                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{s.email}</div>
                                </td>
                                <td style={{ padding: '0.75rem 0.65rem' }}>
                                  <strong>{s.todayScreenTimeMinutes !== null ? `${s.todayScreenTimeMinutes}m` : '—'}</strong>
                                  {s.isExceedingLimit && (
                                    <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>Melebihi Batas</span>
                                  )}
                                </td>
                                <td style={{ padding: '0.75rem 0.65rem', color: 'var(--primary-blue)', fontWeight: 600 }}>
                                  {s.todayFocusMinutes}m
                                </td>
                                <td style={{ padding: '0.75rem 0.65rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                  Layar: {s.last7DaysAvgScreenTime}m • Fokus: {s.last7DaysAvgFocusTime}m
                                </td>
                                <td style={{ padding: '0.75rem 0.65rem', textAlign: 'right' }}>
                                  <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setDetailStudent(s)}>
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
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>Belum Ada Siswa yang Bergabung</h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1rem' }}>
                          Bagikan Kode Kelas <strong>{selectedClass.class_code}</strong> kepada murid Anda.
                        </p>
                        <button type="button" className="btn btn-primary" onClick={() => handleCopyCode(selectedClass.class_code)}>
                          <Copy size={15} />
                          <span>{copiedCode === selectedClass.class_code ? 'Kode Disalin!' : 'Salin Kode Kelas'}</span>
                        </button>
                      </div>
                    )}
                  </section>
                </div>
              ) : (
                /* Daftar Kelas Guru */
                <div>
                  {teacherClasses.length > 0 ? (
                    <div className="grid-2">
                      {teacherClasses.map((cls) => (
                        <div key={cls.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.65rem' }}>
                              <div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{cls.class_name}</h3>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                  Dibuat: {new Date(cls.created_at).toLocaleDateString('id-ID')}
                                </div>
                              </div>
                              <span className="icon-box-blue"><GraduationCap size={18} /></span>
                            </div>

                            {cls.description && (
                              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>{cls.description}</p>
                            )}

                            <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>KODE KELAS SISWA</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-blue)', fontFamily: 'var(--font-mono)' }}>
                                  {cls.class_code}
                                </div>
                              </div>
                              <button type="button" className="btn btn-secondary" onClick={() => handleCopyCode(cls.class_code)} style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}>
                                {copiedCode === cls.class_code ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copiedCode === cls.class_code ? 'Tersalin' : 'Salin'}</span>
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleSelectClass(cls)}>
                              <Users size={16} />
                              <span>Buka Dasbor Pantau Kelas</span>
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => confirmDeleteClass(cls)} title="Hapus Kelas" style={{ padding: '0.55rem' }}>
                              <Trash2 size={16} color="var(--status-danger)" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <section className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                      <GraduationCap size={44} color="var(--primary-blue)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.45rem' }}>Belum Ada Kelas yang Dibuat</h3>
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.25rem', lineHeight: 1.55 }}>
                        Buat ruang kelas digital untuk memantau waktu layar dan konsistensi fokus belajar murid Anda.
                      </p>
                      <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <PlusCircle size={16} />
                        <span>Buat Kelas Belajar Pertama</span>
                      </button>
                    </section>
                  )}
                </div>
              )}
            </>
          )}

          {/* Mode Siswa */}
          {schoolTab === 'student' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <section className="card" style={{ padding: '1.25rem' }}>
                <div className="card-header" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 className="card-title" style={{ fontSize: '1.1rem', margin: 0 }}>Gabung ke Kelas Guru</h2>
                    <p className="card-description" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
                      Masukkan Kode Kelas yang dibagikan guru untuk menghubungkan laporan aktivitas belajar Anda.
                    </p>
                  </div>
                  <span className="icon-box-blue" style={{ flexShrink: 0 }}><Users size={18} /></span>
                </div>

                <form onSubmit={handleJoinClass} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      KODE KELAS
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: TC-8XJR"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.replace(/\s+/g, '').toUpperCase())}
                      required
                      maxLength={12}
                      style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', fontSize: '1rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 'var(--radius-md)' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={joiningClass || !joinCodeInput.trim()} style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1.25rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Users size={16} />
                    <span>{joiningClass ? 'Menghubungkan...' : 'Gabung ke Kelas'}</span>
                  </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginTop: '1rem', padding: '0.75rem 0.85rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-hover)', borderLeft: '3px solid var(--primary-blue)', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <Info size={15} color="var(--primary-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Dengan bergabung, guru kelas dapat melihat rekapan screen time dan durasi fokus Anda untuk membantu evaluasi belajar digital yang seimbang.</span>
                </div>
              </section>

              {/* Kelas yang Diikuti Siswa */}
              <section className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Kelas yang Saya Ikuti ({studentClasses.length})</h2>
                    <p className="card-description">Daftar kelas bimbingan yang saat ini memantau laporan aktivitas TimeCraft Anda.</p>
                  </div>
                </div>

                {studentClasses.length > 0 ? (
                  <div className="grid-2">
                    {studentClasses.map((cls) => (
                      <div key={cls.id} className="card-elevated" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <div>
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>{cls.class_name}</h3>
                              <span className="badge badge-blue" style={{ marginTop: '0.35rem' }}>Kode: {cls.class_code}</span>
                            </div>
                            <span className="icon-box-blue"><GraduationCap size={16} /></span>
                          </div>
                          {cls.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.45rem' }}>{cls.description}</p>}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px dashed var(--border-subtle)' }}>
                          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>✓ Terhubung Aktif</span>
                          <button type="button" className="btn btn-secondary" onClick={() => confirmLeaveClass(cls)} style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
                            <LogOut size={13} />
                            <span>Keluar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '0.86rem', margin: 0 }}>Anda belum bergabung ke kelas mana pun.</p>
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}

      {/* =====================================================================
       * BAGIAN 2: KELUARGA (ORANG TUA & ANAK)
       * ===================================================================== */}
      {mainCategory === 'family' && (
        <>
          {/* Sub-tab Peran Keluarga */}
          {!selectedFamily && (
            <div
              style={{
                display: 'flex',
                width: '100%',
                maxWidth: '440px',
                backgroundColor: 'var(--surface-hover)',
                borderRadius: 'var(--radius-md)',
                padding: '0.3rem',
                marginBottom: '1.25rem',
                gap: '0.35rem',
              }}
            >
              <button
                type="button"
                className={`btn ${familyTab === 'parent' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setFamilyTab('parent');
                  setFeedbackMsg(null);
                }}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.55rem 0.5rem', whiteSpace: 'nowrap' }}
              >
                <Heart size={15} />
                <span>Mode Orang Tua</span>
              </button>
              <button
                type="button"
                className={`btn ${familyTab === 'child' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setFamilyTab('child');
                  setFeedbackMsg(null);
                }}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '0.55rem 0.5rem', whiteSpace: 'nowrap' }}
              >
                <ShieldCheck size={15} />
                <span>Mode Anak</span>
              </button>
            </div>
          )}

          {/* Mode Orang Tua */}
          {familyTab === 'parent' && (
            <>
              {selectedFamily ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setSelectedFamily(null)} style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}>
                        <ArrowLeft size={15} />
                        <span>Kembali ke Daftar Keluarga</span>
                      </button>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {selectedFamily.family_name}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                          <span className="badge badge-blue">Kode Keluarga: <strong>{selectedFamily.family_code}</strong></span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(selectedFamily.family_code)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-blue)', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                          >
                            {copiedCode === selectedFamily.family_code ? <Check size={13} /> : <Copy size={13} />}
                            <span>{copiedCode === selectedFamily.family_code ? 'Tersalin!' : 'Salin Kode'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-secondary" onClick={handlePrintFamilyReport}>
                        <FileText size={15} color="var(--primary-blue)" />
                        <span>Cetak Rekap Keluarga (PDF)</span>
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => confirmDeleteFamily(selectedFamily)}>
                        <Trash2 size={15} />
                        <span>Hapus Ruang</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Kartu Metrik Pemantauan Keluarga */}
                  <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
                    <div className="card">
                      <div className="stat-card-header">
                        <span>Anak Terhubung</span>
                        <span className="icon-box-blue"><Heart size={17} /></span>
                      </div>
                      <div className="stat-card-value">{totalChildren}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{activeChildrenCount} anak aktif hari ini</div>
                    </div>
                    <div className="card">
                      <div className="stat-card-header">
                        <span>Rata-rata Screen Time</span>
                        <span className="icon-box-blue"><Clock size={17} /></span>
                      </div>
                      <div className="stat-card-value">{formatMinutesWithUnit(avgFamilyScreenTime)}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Penggunaan anak di rumah hari ini</div>
                    </div>
                    <div className="card">
                      <div className="stat-card-header">
                        <span>Waktu Fokus Belajar</span>
                        <span className="icon-box-blue"><Timer size={17} /></span>
                      </div>
                      <div className="stat-card-value" style={{ color: 'var(--primary-blue)' }}>{avgFamilyFocusTime}m</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Rerata fokus anak di rumah</div>
                    </div>
                    <div className="card">
                      <div className="stat-card-header">
                        <span>Batas Layar Rumah</span>
                        <span className="icon-box-blue" style={{ color: exceedingFamilyLimitCount > 0 ? '#ef4444' : '#16a34a' }}>
                          <AlertTriangle size={17} />
                        </span>
                      </div>
                      <div className="stat-card-value" style={{ color: exceedingFamilyLimitCount > 0 ? '#ef4444' : 'var(--text-primary)' }}>
                        {exceedingFamilyLimitCount} anak
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {exceedingFamilyLimitCount > 0 ? 'Melewati batas waktu santai' : 'Penggunaan layar anak aman'}
                      </div>
                    </div>
                  </div>

                  {/* Tabel Pemantauan Aktivitas Anak */}
                  <section className="card">
                    <div className="card-header">
                      <div>
                        <h3 className="card-title">Aktivitas Layar Anak ({childrenSummary.length})</h3>
                        <p className="card-description">Laporan harian anak otomatis disinkronkan saat anak mencatat aktivitasnya.</p>
                      </div>
                    </div>

                    {loadingChildrenSummary ? (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>Memuat data anak...</div>
                    ) : childrenSummary.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                              <th style={{ padding: '0.65rem' }}>NAMA ANAK</th>
                              <th style={{ padding: '0.65rem' }}>SCREEN TIME HARI INI</th>
                              <th style={{ padding: '0.65rem' }}>WAKTU FOKUS</th>
                              <th style={{ padding: '0.65rem' }}>RATA-RATA 7 HARI</th>
                              <th style={{ padding: '0.65rem', textAlign: 'right' }}>AKSI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {childrenSummary.map((c) => (
                              <tr key={c.childId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <td style={{ padding: '0.75rem 0.65rem' }}>
                                  <strong>{c.displayName}</strong>
                                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{c.email}</div>
                                </td>
                                <td style={{ padding: '0.75rem 0.65rem' }}>
                                  <strong>{c.todayScreenTimeMinutes !== null ? `${c.todayScreenTimeMinutes}m` : '—'}</strong>
                                  {c.isExceedingLimit && (
                                    <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>Melewati Batas</span>
                                  )}
                                </td>
                                <td style={{ padding: '0.75rem 0.65rem', color: 'var(--primary-blue)', fontWeight: 600 }}>
                                  {c.todayFocusMinutes}m
                                </td>
                                <td style={{ padding: '0.75rem 0.65rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                  Layar: {c.last7DaysAvgScreenTime}m • Fokus: {c.last7DaysAvgFocusTime}m
                                </td>
                                <td style={{ padding: '0.75rem 0.65rem', textAlign: 'right' }}>
                                  <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setDetailChild(c)}>
                                    Lihat Detail
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                        <Heart size={36} color="var(--primary-blue)" style={{ margin: '0 auto 0.75rem', opacity: 0.7 }} />
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>Belum Ada Anak yang Terhubung</h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1rem' }}>
                          Berikan Kode Keluarga <strong>{selectedFamily.family_code}</strong> kepada anak Anda agar mereka dapat menghubungkan akun TimeCraft-nya dari HP atau tablet mereka.
                        </p>
                        <button type="button" className="btn btn-primary" onClick={() => handleCopyCode(selectedFamily.family_code)}>
                          <Copy size={15} />
                          <span>{copiedCode === selectedFamily.family_code ? 'Kode Disalin!' : 'Salin Kode Keluarga'}</span>
                        </button>
                      </div>
                    )}
                  </section>
                </div>
              ) : (
                /* Daftar Ruang Keluarga yang Dibuat Orang Tua */
                <div>
                  {parentFamilies.length > 0 ? (
                    <div className="grid-2">
                      {parentFamilies.map((fam) => (
                        <div key={fam.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.65rem' }}>
                              <div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{fam.family_name}</h3>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                  Dibuat: {new Date(fam.created_at).toLocaleDateString('id-ID')}
                                </div>
                              </div>
                              <span className="icon-box-blue"><Home size={18} /></span>
                            </div>

                            {fam.description && (
                              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>{fam.description}</p>
                            )}

                            <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>KODE KELUARGA UNTUK ANAK</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-blue)', fontFamily: 'var(--font-mono)' }}>
                                  {fam.family_code}
                                </div>
                              </div>
                              <button type="button" className="btn btn-secondary" onClick={() => handleCopyCode(fam.family_code)} style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}>
                                {copiedCode === fam.family_code ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copiedCode === fam.family_code ? 'Tersalin' : 'Salin'}</span>
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleSelectFamily(fam)}>
                              <Heart size={16} />
                              <span>Buka Pantau Anak</span>
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => confirmDeleteFamily(fam)} title="Hapus Ruang Keluarga" style={{ padding: '0.55rem' }}>
                              <Trash2 size={16} color="var(--status-danger)" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <section className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                      <Home size={44} color="var(--primary-blue)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.45rem' }}>Belum Ada Ruang Keluarga</h3>
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.25rem', lineHeight: 1.55 }}>
                        Sebagai orang tua, buat ruang keluarga untuk memantau waktu bermain layar anak di rumah dan mendorong kebiasaan belajar yang sehat.
                      </p>
                      <button type="button" className="btn btn-primary" onClick={() => setShowCreateFamilyModal(true)}>
                        <PlusCircle size={16} />
                        <span>Buat Ruang Keluarga Pertama</span>
                      </button>
                    </section>
                  )}
                </div>
              )}
            </>
          )}

          {/* Mode Anak */}
          {familyTab === 'child' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <section className="card" style={{ padding: '1.25rem' }}>
                <div className="card-header" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 className="card-title" style={{ fontSize: '1.1rem', margin: 0 }}>Hubungkan ke Orang Tua</h2>
                    <p className="card-description" style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
                      Masukkan Kode Keluarga yang dibagikan ayah atau ibu Anda untuk menghubungkan laporan kebiasaan digital Anda di rumah.
                    </p>
                  </div>
                  <span className="icon-box-blue" style={{ flexShrink: 0 }}><Home size={18} /></span>
                </div>

                <form onSubmit={handleJoinFamily} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      KODE KELUARGA
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: FAM-8X2K"
                      value={joinFamilyCodeInput}
                      onChange={(e) => setJoinFamilyCodeInput(e.target.value.replace(/\s+/g, '').toUpperCase())}
                      required
                      maxLength={12}
                      style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', fontSize: '1rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 'var(--radius-md)' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={joiningFamily || !joinFamilyCodeInput.trim()} style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1.25rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Heart size={16} />
                    <span>{joiningFamily ? 'Menghubungkan...' : 'Hubungkan Akun'}</span>
                  </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginTop: '1rem', padding: '0.75rem 0.85rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--surface-hover)', borderLeft: '3px solid var(--primary-blue)', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <Info size={15} color="var(--primary-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Dengan menghubungkan akun, orang tua dapat memantau kedisiplinan screen time dan sesi fokus Anda di rumah demi keseimbangan waktu digital yang sehat.</span>
                </div>
              </section>

              {/* Ruang Keluarga yang Diikuti Anak */}
              <section className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Ruang Keluarga Saya ({childFamilies.length})</h2>
                    <p className="card-description">Daftar pemantauan keluarga yang saat ini mendampingi aktivitas TimeCraft Anda.</p>
                  </div>
                </div>

                {childFamilies.length > 0 ? (
                  <div className="grid-2">
                    {childFamilies.map((fam) => (
                      <div key={fam.id} className="card-elevated" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <div>
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>{fam.family_name}</h3>
                              <span className="badge badge-blue" style={{ marginTop: '0.35rem' }}>Kode: {fam.family_code}</span>
                            </div>
                            <span className="icon-box-blue"><Home size={16} /></span>
                          </div>
                          {fam.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.45rem' }}>{fam.description}</p>}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px dashed var(--border-subtle)' }}>
                          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>✓ Terhubung dengan Orang Tua</span>
                          <button type="button" className="btn btn-secondary" onClick={() => confirmLeaveFamily(fam)} style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
                            <LogOut size={13} />
                            <span>Putuskan Hubungan</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '0.86rem', margin: 0 }}>Anda belum terhubung ke ruang keluarga mana pun.</p>
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </>
  );
};
