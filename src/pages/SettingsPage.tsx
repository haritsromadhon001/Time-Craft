import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Sparkles,
  RefreshCw,
  Trash2,
  LogOut,
  CheckCircle2,
  Camera,
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { repository } from '../services/repository';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DeveloperContactCard } from '../components/ui/DeveloperContactCard';

const TIMEZONES = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'UTC',
];

const MOTIVATIONAL_QUOTES = [
  {
    quote:
      'Fokus bukan sekadar mengatakan ya pada hal yang penting, melainkan berani berkata tidak pada ratusan distraksi lainnya.',
    author: 'Prinsip Deep Work',
  },
  {
    quote:
      'Cara Anda menghabiskan setiap jam hari ini adalah cara Anda membentuk masa depan Anda.',
    author: 'Kesadaran Waktu',
  },
  {
    quote:
      'Disiplin kecil yang dilakukan secara konsisten setiap hari jauh lebih kuat daripada usaha besar yang hanya sesekali.',
    author: 'Kebiasaan Produktif',
  },
  {
    quote:
      'Teknologi adalah alat yang hebat ketika Anda yang memegang kendali, bukan ketika layar yang mengendalikan waktu Anda.',
    author: 'Keseimbangan Digital',
  },
];

export const SettingsPage: React.FC = () => {
  const { user, refreshUserData } = useApp();

  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [timezone, setTimezone] = useState(user?.timezone ?? 'Asia/Jakarta');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url ?? null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [msgSuccess, setMsgSuccess] = useState<string | null>(null);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name);
      setTimezone(user.timezone);
      setAvatarUrl(user.avatar_url ?? null);
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMsgError('Format file harus berupa gambar (JPG, PNG, atau WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMsgError('Ukuran file foto maksimal 5 MB.');
      return;
    }

    setIsProcessingImage(true);
    setMsgError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const minEdge = Math.min(img.width, img.height);
          const startX = (img.width - minEdge) / 2;
          const startY = (img.height - minEdge) / 2;

          const targetSize = Math.min(256, minEdge);
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, startX, startY, minEdge, minEdge, 0, 0, targetSize, targetSize);
            const compressed = canvas.toDataURL('image/jpeg', 0.88);
            setAvatarUrl(compressed);
          } else {
            setAvatarUrl(event.target?.result as string);
          }
        } catch {
          setAvatarUrl(event.target?.result as string);
        } finally {
          setIsProcessingImage(false);
        }
      };
      img.onerror = () => {
        setMsgError('Gagal memproses gambar yang dipilih.');
        setIsProcessingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setMsgError('Gagal membaca berkas gambar.');
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMsgError(null);
    setMsgSuccess(null);

    const res = await repository.updateProfile({
      userId: user.id,
      displayName,
      timezone,
      avatarUrl,
    });

    if (res.error) {
      setMsgError(res.error);
    } else {
      setMsgSuccess('Profil dan foto berhasil diperbarui.');
      await refreshUserData();
    }
  };

  const confirmDeleteAllData = async () => {
    if (!user) return;
    setConfirmClearOpen(false);

    const res = await repository.deleteAllMyData(user.id);
    if (res.ok) {
      setMsgSuccess('Seluruh catatan aktivitas akun Anda telah dihapus bersih.');
      await refreshUserData();
    } else {
      setMsgError(res.error || 'Gagal menghapus data.');
    }
  };

  const handleLogout = async () => {
    await repository.logoutAccount();
    await refreshUserData();
  };

  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex % MOTIVATIONAL_QUOTES.length];

  return (
    <>
      <ConfirmDialog
        open={confirmClearOpen}
        title="Hapus Seluruh Data Aktivitas Akun?"
        description="Tindakan ini akan menghapus seluruh catatan screen time, sesi fokus, target harian, dan refleksi mingguan milik akun Anda secara permanen. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus Semua Data Saya"
        onConfirm={confirmDeleteAllData}
        onCancel={() => setConfirmClearOpen(false)}
      />

      <header className="page-header">
        <div>
          <h1 className="page-title">Pengaturan Akun</h1>
          <p className="page-subtitle">
            Kelola profil pengguna, preferensi zona waktu, dan kebiasaan fokus Anda.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={handleLogout}>
            <LogOut size={16} color="var(--text-secondary)" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {msgError && (
        <div className="alert alert-error" role="alert">
          <span>{msgError}</span>
        </div>
      )}

      {msgSuccess && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{msgSuccess}</span>
        </div>
      )}

      <div className="grid-2">
        {/* Form Profil & Zona Waktu */}
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Profil Pengguna &amp; Zona Waktu</h2>
              <p className="card-description">
                Perbarui informasi identitas dan zona waktu pencatatan harian Anda.
              </p>
            </div>
            <span className="icon-box-blue" aria-hidden="true">
              <Settings size={18} />
            </span>
          </div>

          <form onSubmit={handleUpdateProfile}>
            {/* Foto Profil Pengguna */}
            <div className="profile-avatar-row">
              <div className="profile-avatar-preview" aria-label="Pratinjau Foto Profil">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName || 'Foto Profil'} />
                ) : (
                  <span>
                    {(displayName || user?.email || 'U').trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="profile-avatar-details">
                <div className="profile-avatar-title">
                  <Camera size={15} color="var(--primary-blue)" />
                  <span>Foto Profil Pengguna</span>
                </div>

                <div className="profile-avatar-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    className="btn-avatar-upload"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                  >
                    <Upload size={14} />
                    <span>{isProcessingImage ? 'Memproses...' : avatarUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      className="btn-avatar-remove"
                      onClick={handleRemoveAvatar}
                      title="Hapus foto profil dan gunakan inisial huruf"
                    >
                      <Trash2 size={14} />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>

                <div className="profile-avatar-hint">
                  Mendukung JPG, PNG, atau WebP (Maks. 5 MB). Otomatis dipotong rapi secara proporsional.
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prof-email" className="form-label">
                Alamat Email Akun
              </label>
              <input
                id="prof-email"
                type="email"
                className="form-input"
                value={user?.email ?? ''}
                disabled
              />
            </div>

            <div className="form-group">
              <label htmlFor="prof-name" className="form-label">
                Nama Tampilan
              </label>
              <input
                id="prof-name"
                type="text"
                className="form-input"
                placeholder="Contoh: Fulan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
              />
            </div>

            <div className="form-group">
              <label htmlFor="prof-tz" className="form-label">
                Zona Waktu Aktif
              </label>
              <select
                id="prof-tz"
                className="form-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <span className="form-hint">
                Digunakan sebagai acuan pergantian tanggal pada ringkasan harian Anda.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Simpan Perubahan Profil
            </button>
          </form>
        </section>

        {/* Motivasi Fokus & Kontrol Riwayat */}
        <section
          className="card"
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}
        >
          <div>
            <div className="card-header">
              <div>
                <h2 className="card-title">Motivasi &amp; Kebiasaan Fokus</h2>
                <p className="card-description">
                  Pengingat harian untuk menjaga fokus dan keseimbangan waktu layar Anda.
                </p>
              </div>
              <span className="icon-box-blue" aria-hidden="true">
                <Sparkles size={18} />
              </span>
            </div>

            {/* Kotak Kutipan Motivasi Interaktif */}
            <div
              style={{
                padding: '1.15rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-blue-light)',
                border: '1px solid var(--border-blue-subtle)',
                marginBottom: '1rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  lineHeight: 1.55,
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{currentQuote.quote}&rdquo;
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.75rem',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--primary-blue)' }}>
                  — {currentQuote.author}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setQuoteIndex((prev) => prev + 1)}
                  style={{ fontSize: '0.75rem', padding: '0.32rem 0.65rem' }}
                >
                  <RefreshCw size={13} color="var(--primary-blue)" />
                  <span>Motivasi Lainnya</span>
                </button>
              </div>
            </div>

            {/* Tips Singkat Keseimbangan Digital */}
            <div className="card-elevated" style={{ padding: '0.9rem 1.05rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Tips Produktivitas Harian
              </div>
              <ul
                style={{
                  paddingLeft: '1.1rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <li>Mulai hari dengan 1 sesi fokus sebelum membuka media sosial.</li>
                <li>Istirahatkan mata selama 5 menit setiap 25–50 menit menatap layar.</li>
              </ul>
            </div>

            {/* Kartu Hubungi Pengembang Modern & Profesional */}
            <DeveloperContactCard showIntro={true} />
          </div>

          {/* Zona Reset Data */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--status-danger-border)',
              backgroundColor: 'var(--status-danger-bg)',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: '0.85rem',
                color: 'var(--status-danger)',
                marginBottom: '0.2rem',
              }}
            >
              Reset Riwayat Aktivitas
            </div>
            <p
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.7rem',
              }}
            >
              Kosongkan seluruh catatan screen time, sesi fokus, target harian, dan refleksi pada akun ini.
            </p>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setConfirmClearOpen(true)}
              style={{ width: '100%', backgroundColor: 'var(--bg-primary)' }}
            >
              <Trash2 size={15} />
              <span>Hapus Seluruh Riwayat Aktivitas</span>
            </button>
          </div>
        </section>
      </div>
    </>
  );
};
