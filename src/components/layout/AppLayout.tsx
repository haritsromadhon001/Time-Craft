import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Clock,
  LayoutDashboard,
  Timer,
  Target,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { getSupabaseConfigStatus } from '../../services/supabase';
import { useApp } from '../../context/AppContext';
import { repository } from '../../services/repository';
import { FloatingContactWidget } from '../ui/FloatingContactWidget';
import { LiveClock } from '../ui/LiveClock';

export const AppLayout: React.FC = () => {
  const { user, refreshUserData, theme, toggleTheme } = useApp();
  const dbStatus = getSupabaseConfigStatus();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const activeTimezone = user?.timezone || 'Asia/Jakarta';
  const userInitial = (user?.display_name || user?.email || 'U')
    .trim()
    .charAt(0)
    .toUpperCase();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/screen-time', label: 'Screen Time', icon: Clock },
    { to: '/focus-timer', label: 'Focus Timer', icon: Timer },
    { to: '/targets', label: 'Target & Refleksi', icon: Target },
    { to: '/analytics', label: 'Analitik', icon: BarChart3 },
    { to: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  const handleQuickLogout = async () => {
    await repository.logoutAccount();
    await refreshUserData();
  };

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <a href="#main-content" className="skip-link">
        Lewati ke konten utama
      </a>

      {/* Bilah Atas Khusus Seluler / HP (Mobile Header) */}
      <header className="mobile-header" aria-label="Bilah Navigasi Seluler">
        <div className="mobile-header-brand">
          <img
            src={theme === 'light' ? '/logo-blue.svg' : '/logo-red.svg'}
            alt="Logo TimeCraft"
            width={28}
            height={28}
            style={{ borderRadius: '6px', flexShrink: 0 }}
          />
          <div className="mobile-header-text">
            <span className="mobile-header-title">TimeCraft</span>
            <span className="mobile-header-subtitle">Screen Time &amp; Focus</span>
          </div>
        </div>

        <div className="mobile-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Beralih ke Tema Hitam (Merah)' : 'Beralih ke Tema Putih (Biru)'}
            aria-label="Ganti Tema Tampilan"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <div className="user-avatar" style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user?.display_name || 'Foto'}
                className="user-avatar-img"
              />
            ) : (
              userInitial
            )}
          </div>

          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Tutup Menu Navigasi' : 'Buka Menu Navigasi'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Latar Belakang Gelap Penutup Saat Menu Seluler Terbuka (Backdrop) */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Laci Menu Navigasi (Desktop Collapsible & Mobile Slide-over Drawer) */}
      <aside
        className={`sidebar ${mobileMenuOpen ? 'mobile-drawer-open' : ''}`}
        aria-label="Navigasi Utama"
      >
        <div className="sidebar-top">
          <div className="brand-box">
            <img
              src={theme === 'light' ? '/logo-blue.svg' : '/logo-red.svg'}
              alt="Logo TimeCraft"
              width={34}
              height={34}
              style={{ borderRadius: '8px', flexShrink: 0 }}
            />
            {!collapsed && (
              <div className="brand-text">
                <div className="brand-title">TimeCraft</div>
                <div className="brand-subtitle">Screen Time &amp; Focus</div>
              </div>
            )}
          </div>

          <div className="sidebar-top-actions">
            {/* Tombol ganti tema tampilan */}
            <button
              type="button"
              className="sidebar-toggle-btn desktop-only-btn"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Beralih ke Tema Hitam (Merah)' : 'Beralih ke Tema Putih (Biru)'}
              aria-label="Ganti Tema Tampilan"
            >
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            {/* Tombol ciutkan sidebar (Desktop) */}
            <button
              type="button"
              className="sidebar-toggle-btn desktop-only-btn"
              onClick={() => setCollapsed((prev) => !prev)}
              title={collapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
              aria-label={collapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            {/* Tombol silang tutup laci (Mobile) */}
            <button
              type="button"
              className="sidebar-toggle-btn mobile-only-close-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Tutup Menu"
              title="Tutup Menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {!collapsed && <div className="sidebar-section-label">MENU UTAMA</div>}

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <IconComponent size={19} aria-hidden="true" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Sidebar: Zona Waktu + Jam Klien + Profil Akun */}
        <div className="sidebar-footer">
          {!collapsed ? (
            <LiveClock timezone={activeTimezone} variant="sidebar" />
          ) : (
            <LiveClock timezone={activeTimezone} variant="compact" />
          )}

          <div
            className="sidebar-user-card"
            title={`${user?.display_name || 'Pengguna'} (${user?.email || '-'})`}
          >
            <div className="user-avatar" aria-hidden="true">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user?.display_name || 'Foto Profil'}
                  className="user-avatar-img"
                />
              ) : (
                userInitial
              )}
            </div>
            {!collapsed && (
              <div className="user-meta">
                <div className="user-name">{user?.display_name}</div>
                <div className="user-email" title={user?.email}>
                  {user?.email}
                </div>
              </div>
            )}
            <button
              type="button"
              className="user-logout-btn"
              onClick={handleQuickLogout}
              title={
                dbStatus.isConfigured
                  ? 'Keluar (Supabase Cloud)'
                  : 'Keluar dari akun'
              }
              aria-label="Keluar dari akun"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Area Konten Utama yang Bersih & Lega */}
      <div className="main-wrapper">
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
      </div>

      {/* Widget Ikon Kontak Mengambang di Pojok Kanan Bawah */}
      <FloatingContactWidget />
    </div>
  );
};
