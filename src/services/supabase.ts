import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TIMECRAFT — SUPABASE CLIENT & PEMERIKSA KONFIGURASI JUJUR
// ============================================================================
// Aturan Integritas:
// Jangan pernah berpura-pura database sudah terhubung jika variabel .env
// belum diisi atau masih bernilai placeholder.
// ============================================================================

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  reason: string;
  projectUrl: string | null;
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  if (!rawUrl || !rawAnonKey) {
    return {
      isConfigured: false,
      reason:
        'File .env belum ditemukan atau variabel VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY masih kosong.',
      projectUrl: null,
    };
  }

  if (
    rawUrl.includes('nama-proyek-anda.supabase.co') ||
    rawAnonKey.includes('isi-dengan-anon-public-key') ||
    rawUrl.includes('ocuclsbgvgwjujncst')
  ) {
    return {
      isConfigured: false,
      reason:
        'Kredensial Supabase belum terhubung ke database aktif. Menggunakan mode Brankas Lokal (Local Vault).',
      projectUrl: null,
    };
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
      return {
        isConfigured: false,
        reason: 'VITE_SUPABASE_URL harus menggunakan protokol https:// yang valid.',
        projectUrl: null,
      };
    }
  } catch {
    return {
      isConfigured: false,
      reason: 'Format URL pada VITE_SUPABASE_URL tidak valid.',
      projectUrl: null,
    };
  }

  return {
    isConfigured: true,
    reason: 'Kredensial publik Supabase tersedia di environment lokal.',
    projectUrl: rawUrl,
  };
}

const configStatus = getSupabaseConfigStatus();

export const supabase: SupabaseClient | null = configStatus.isConfigured
  ? createClient(rawUrl!, rawAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
