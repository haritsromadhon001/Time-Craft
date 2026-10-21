// ============================================================================
// TIMECRAFT — TIPE DATA DOMAIN UTAMA
// ============================================================================
// Memisahkan data yang dilaporkan manual oleh pengguna vs diukur timer sistem,
// serta membedakan kondisi "belum ada data" (null) dari angka 0.
// ============================================================================

export type DataSourceType = 'manual_input' | 'system_timer';

export type ActivityCategory =
  | 'productive_study'
  | 'productive_work'
  | 'social_media'
  | 'entertainment'
  | 'gaming'
  | 'communication'
  | 'other';

export interface CategoryMeta {
  id: ActivityCategory;
  label: string;
  isProductive: boolean;
  description: string;
}

export const ACTIVITY_CATEGORIES: Record<ActivityCategory, CategoryMeta> = {
  productive_study: {
    id: 'productive_study',
    label: 'Belajar & Kuliah',
    isProductive: true,
    description: 'Membaca materi, mengerjakan tugas, atau kursus online',
  },
  productive_work: {
    id: 'productive_work',
    label: 'Pekerjaan & Proyek',
    isProductive: true,
    description: 'Menulis kode, desain, riset, atau administrasi produktif',
  },
  social_media: {
    id: 'social_media',
    label: 'Media Sosial',
    isProductive: false,
    description: 'Scrolling feed, menonton video pendek, atau forum sosial',
  },
  entertainment: {
    id: 'entertainment',
    label: 'Hiburan & Streaming',
    isProductive: false,
    description: 'Menonton film, video hiburan, atau mendengarkan media',
  },
  gaming: {
    id: 'gaming',
    label: 'Bermain Game',
    isProductive: false,
    description: 'Game di ponsel, konsol, atau komputer',
  },
  communication: {
    id: 'communication',
    label: 'Komunikasi & Pesan',
    isProductive: false,
    description: 'Chatting, panggilan video, atau koordinasi pesan',
  },
  other: {
    id: 'other',
    label: 'Lainnya',
    isProductive: false,
    description: 'Penggunaan layar lain di luar kategori utama',
  },
};

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  timezone: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScreenTimeLog {
  id: string;
  user_id: string;
  category: ActivityCategory;
  source: DataSourceType;
  activity_date: string; // Format YYYY-MM-DD sesuai zona waktu pengguna
  start_time: string; // ISO-8601 timestamp
  end_time: string; // ISO-8601 timestamp
  duration_minutes: number; // Selalu > 0, dihitung dari selisih waktu atau timer
  notes: string | null;
  created_at: string;
}

export interface NewScreenTimeInput {
  category: ActivityCategory;
  source: DataSourceType;
  activity_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export type FocusSessionStatus = 'completed' | 'interrupted';

export interface FocusSession {
  id: string;
  user_id: string;
  planned_focus_minutes: number;
  planned_break_minutes: number;
  actual_focus_seconds: number;
  status: FocusSessionStatus;
  session_date: string; // Format YYYY-MM-DD sesuai zona waktu pengguna
  started_at: string;
  ended_at: string;
  task_label: string | null;
  created_at: string;
}

export interface NewFocusSessionInput {
  planned_focus_minutes: number;
  planned_break_minutes: number;
  actual_focus_seconds: number;
  status: FocusSessionStatus;
  session_date: string;
  started_at: string;
  ended_at: string;
  task_label?: string;
}

export interface UserTarget {
  id: string;
  user_id: string;
  max_daily_screentime_minutes: number | null;
  min_daily_focus_minutes: number | null;
  preferred_focus_schedule: string | null;
  updated_at: string;
}

export interface UpsertTargetInput {
  max_daily_screentime_minutes: number | null;
  min_daily_focus_minutes: number | null;
  preferred_focus_schedule: string | null;
}

export interface WeeklyReflection {
  id: string;
  user_id: string;
  reflection_date: string;
  mood_score: number; // 1 s/d 5
  wins_note: string;
  improvement_plan: string | null;
  created_at: string;
}

export interface NewWeeklyReflectionInput {
  reflection_date: string;
  mood_score: number;
  wins_note: string;
  improvement_plan?: string;
}
