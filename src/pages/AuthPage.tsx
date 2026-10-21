import React, { useState } from 'react';
import {
  UserPlus,
  LogIn,
  Globe,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { repository } from '../services/repository';
import { getDetectedTimezone } from '../utils/time';
import { useApp } from '../context/AppContext';

type AuthMode = 'login' | 'register' | 'change_password';

const COMMON_TIMEZONES = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'UTC',
];

export const AuthPage: React.FC = () => {
  const { refreshUserData } = useApp();
  const detectedTz = getDetectedTimezone();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Khusus mode ganti kata sandi (password lama & password baru)
  const [oldPassword, setOldPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState(
    COMMON_TIMEZONES.includes(detectedTz) ? detectedTz : 'Asia/Jakarta',
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'register') {
        const res = await repository.registerAccount({
          email,
          password,
          displayName,
          timezone,
        });
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          await refreshUserData();
        }
      } else if (mode === 'login') {
        const res = await repository.loginAccount({ email, password });
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          await refreshUserData();
        }
      } else if (mode === 'change_password') {
        const res = await repository.changePasswordWithOldPassword({
          email,
          oldPassword,
          newPassword,
        });
        if (!res.ok) {
          setErrorMsg(res.message);
        } else {
          if (res.user) {
            await refreshUserData();
          } else {
            setSuccessMsg(res.message);
            setMode('login');
            setPassword('');
            setOldPassword('');
            setNewPassword('');
          }
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <div className="card" style={{ maxWidth: '490px', width: '100%' }}>
        {/* Header Identitas TimeCraft */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            marginBottom: '1.35rem',
          }}
        >
          <img
            src="/favicon.svg"
            alt="Logo TimeCraft"
            width={42}
            height={42}
            style={{ borderRadius: '10px', flexShrink: 0 }}
          />
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              TimeCraft
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Kelola waktu layar dan sesi fokus harian Anda
            </p>
          </div>
        </div>

        {/* Pilihan Tab Login / Registrasi atau Header Ganti Kata Sandi */}
        {mode !== 'change_password' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.5rem',
              marginBottom: '1.15rem',
            }}
          >
            <button
              type="button"
              className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              style={{ padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }}
            >
              <LogIn size={16} />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              style={{ padding: '0.6rem', fontSize: '0.85rem', justifyContent: 'center' }}
            >
              <UserPlus size={16} />
              <span>Daftar Akun</span>
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '1.25rem', paddingBottom: '0.25rem' }}>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'none',
                border: 'none',
                color: 'var(--primary-blue)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.2rem 0',
                marginBottom: '0.65rem',
              }}
            >
              <ArrowLeft size={15} />
              <span>Kembali ke Halaman Masuk</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
              <KeyRound size={18} color="var(--primary-blue)" />
              <h2 style={{ fontSize: '1.12rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Ganti Kata Sandi
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Masukkan alamat email terdaftar, kata sandi lama, dan kata sandi baru untuk memperbarui akses akun Anda secara langsung tanpa tautan email.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: '1.15rem' }}>
            <div>
              <div>{errorMsg}</div>
              {mode === 'login' && errorMsg.includes('Lupa Sandi') && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('change_password');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  style={{
                    marginTop: '0.4rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-blue)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  Ganti kata sandi dengan kata sandi lama →
                </button>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" role="status" style={{ marginBottom: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-name" className="form-label">
                Nama Panggilan / Nama Lengkap
              </label>
              <input
                id="auth-name"
                type="text"
                className="form-input"
                placeholder="Contoh: Fulan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email" className="form-label">
              Alamat Email
            </label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Form Khusus Ganti Kata Sandi: Password Lama & Password Baru */}
          {mode === 'change_password' ? (
            <>
              {/* Kolom Password Lama */}
              <div className="form-group">
                <label htmlFor="auth-old-password" className="form-label">
                  Kata Sandi Lama
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="auth-old-password"
                    type={showOldPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingRight: '2.6rem' }}
                    placeholder="Masukkan kata sandi lama Anda"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword((prev) => !prev)}
                    title={showOldPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    aria-label={showOldPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    style={{
                      position: 'absolute',
                      right: '0.6rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.2rem',
                    }}
                  >
                    {showOldPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Kolom Password Baru */}
              <div className="form-group">
                <label htmlFor="auth-new-password" className="form-label">
                  Kata Sandi Baru
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="auth-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingRight: '2.6rem' }}
                    placeholder="Minimal 6 karakter kata sandi baru"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    title={showNewPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    aria-label={showNewPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    style={{
                      position: 'absolute',
                      right: '0.6rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.2rem',
                    }}
                  >
                    {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <span
                  className="form-hint"
                  style={{
                    display: 'block',
                    marginTop: '0.35rem',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                  }}
                >
                  Ikon mata berfungsi untuk menampilkan atau menyembunyikan karakter kata sandi demi kenyamanan dan privasi Anda.
                </span>
              </div>
            </>
          ) : (
            /* Form Standar Kata Sandi (Masuk & Daftar Akun) */
            <div className="form-group">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.45rem',
                }}
              >
                <label htmlFor="auth-password" className="form-label" style={{ marginBottom: 0 }}>
                  Kata Sandi
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('change_password');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setOldPassword('');
                      setNewPassword('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-blue)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Ganti kata sandi?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '2.6rem' }}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  style={{
                    position: 'absolute',
                    right: '0.6rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.2rem',
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <span
                className="form-hint"
                style={{
                  display: 'block',
                  marginTop: '0.35rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                }}
              >
                Ikon mata berfungsi untuk menampilkan atau menyembunyikan karakter kata sandi demi kenyamanan dan privasi Anda.
              </span>
            </div>
          )}

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-timezone" className="form-label">
                <Globe
                  size={14}
                  color="var(--primary-blue)"
                  style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: 'middle' }}
                />
                Zona Waktu
              </label>
              <select
                id="auth-timezone"
                className="form-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz} {tz === detectedTz ? '(Otomatis)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{
              width: '100%',
              marginTop: '0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
            }}
          >
            {submitting ? (
              'Memproses...'
            ) : mode === 'login' ? (
              'Masuk'
            ) : mode === 'register' ? (
              'Daftar Akun Baru'
            ) : (
              <>
                <KeyRound size={16} />
                <span>Perbarui Sandi &amp; Masuk</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
