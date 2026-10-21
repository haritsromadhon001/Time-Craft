import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
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
} from 'lucide-react';
import { getSupabaseConfigStatus } from '../../services/supabase';
import { useApp } from '../../context/AppContext';
import { repository } from '../../services/repository';
import { FloatingContactWidget } from '../ui/FloatingContactWidget';
import { LiveClock } from '../ui/LiveClock';

export const AppLayout: React.FC = () => {
  const { user, refreshUserData } = useApp();
  const dbStatus = getSupabaseConfigStatus();
  const [collapsed, setCollapsed] = useState<boolean>(false);

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

      {/* Sidebar Kiri Minimalis & Dapat Dilipat (Collapsible SaaS Sidebar) */}
      <aside className="sidebar" aria-label="Navigasi Utama">
        <div className="sidebar-top">
          <div className="brand-box">
            <img
              src="/favicon.svg"
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

          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
            aria-label={collapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
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
