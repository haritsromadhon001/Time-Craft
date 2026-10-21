import React, { useState, useEffect } from 'react';
import { Clock, Globe } from 'lucide-react';

interface LiveClockProps {
  timezone?: string;
  variant?: 'dashboard' | 'compact' | 'sidebar' | 'header';
  className?: string;
}

function getTimezoneAbbr(timeZone: string): string {
  switch (timeZone) {
    case 'Asia/Jakarta':
      return 'WIB';
    case 'Asia/Makassar':
      return 'WITA';
    case 'Asia/Jayapura':
      return 'WIT';
    case 'Asia/Singapore':
      return 'SGT';
    case 'Asia/Tokyo':
      return 'JST';
    case 'Europe/London':
      return 'GMT';
    case 'UTC':
      return 'UTC';
    default:
      return timeZone.split('/').pop()?.replace(/_/g, ' ') || timeZone;
  }
}

export const LiveClock: React.FC<LiveClockProps> = ({
  timezone = 'Asia/Jakarta',
  variant = 'dashboard',
  className = '',
}) => {
  const [time, setTime] = useState<Date>(() => new Date());

  useEffect(() => {
    // Update setiap detik agar jam berjalan real-time
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const tzAbbr = getTimezoneAbbr(timezone);

  // Format jam:menit:detik (contoh: 15:24:54)
  const timeFormatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
    .format(time)
    .replace(/\./g, ':');

  // Format jam:menit ringkas (contoh: 15:24) untuk ruang sempit / sidebar collapsed
  const timeShort = new Intl.DateTimeFormat('id-ID', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(time)
    .replace(/\./g, ':');

  // Format hari & tanggal lengkap (contoh: Senin, 19 Oktober 2026)
  const dateFormatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(time);

  if (variant === 'compact') {
    return (
      <div
        className={`live-clock-compact ${className}`}
        title={`Waktu Klien Aktif: ${timeFormatted} ${tzAbbr} (${timezone})`}
      >
        <div className="live-clock-compact-top">
          <Clock size={13} color="var(--primary-blue)" />
          <span className="live-clock-compact-dot" />
        </div>
        <span className="live-clock-compact-time">{timeShort}</span>
        <span className="live-clock-compact-tz">{tzAbbr}</span>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div
        className={`live-clock-sidebar-card ${className}`}
        title={`Zona Waktu: ${timezone} • Jam Klien: ${timeFormatted} ${tzAbbr}`}
      >
        <div className="live-clock-sidebar-header">
          <div className="live-clock-sidebar-tz">
            <Globe size={13} color="var(--primary-blue)" style={{ flexShrink: 0 }} />
            <span className="live-clock-sidebar-tz-name" title={timezone}>
              {timezone}
            </span>
          </div>
          <span className="live-clock-sidebar-badge">{tzAbbr}</span>
        </div>
        <div className="live-clock-sidebar-time-row">
          <div className="live-clock-sidebar-digits-box">
            <Clock size={13} color="var(--primary-blue)" style={{ flexShrink: 0 }} />
            <span className="live-clock-sidebar-digits">{timeFormatted}</span>
          </div>
          <span className="live-clock-sidebar-live-tag">
            <span className="live-clock-status-dot-active" />
            Waktu Klien
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`live-clock-widget ${className}`}
      title={`Jam Klien Real-Time (${timezone})`}
      role="timer"
      aria-live="off"
    >
      <div className="live-clock-main">
        <div className="live-clock-icon-wrap">
          <Clock size={18} />
          <span className="live-clock-pulse-dot" />
        </div>
        <div className="live-clock-digits-wrap">
          <span className="live-clock-digits">{timeFormatted}</span>
          <span className="live-clock-tz-tag">{tzAbbr}</span>
        </div>
      </div>
      <div className="live-clock-meta">
        <span className="live-clock-date">{dateFormatted}</span>
        <span className="live-clock-status-text">• Waktu Klien Aktif</span>
      </div>
    </div>
  );
};
