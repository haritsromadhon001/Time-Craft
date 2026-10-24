import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  WhatsAppIcon,
  InstagramIcon,
  GmailIcon,
  WHATSAPP_NUMBER,
  WHATSAPP_LINK,
  INSTAGRAM_HANDLE,
  INSTAGRAM_LINK,
  GMAIL_ADDRESS,
  GMAIL_LINK,
} from './SocialIcons';

interface DeveloperContactCardProps {
  className?: string;
  showIntro?: boolean;
}

export const DeveloperContactCard: React.FC<DeveloperContactCardProps> = ({
  className = '',
  showIntro = true,
}) => {
  const [copiedWA, setCopiedWA] = useState(false);
  const [copiedIG, setCopiedIG] = useState(false);
  const [copiedGmail, setCopiedGmail] = useState(false);

  const handleCopyWA = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(WHATSAPP_NUMBER);
      setCopiedWA(true);
      setTimeout(() => setCopiedWA(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyIG = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(INSTAGRAM_HANDLE);
      setCopiedIG(true);
      setTimeout(() => setCopiedIG(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyGmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(GMAIL_ADDRESS);
      setCopiedGmail(true);
      setTimeout(() => setCopiedGmail(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className={`dev-contact-container ${className}`}>
      {/* Header Profil Pengembang Modern */}
      <div className="dev-profile-header">
        <div className="dev-avatar-group">
          <div className="dev-avatar-glow">
            <div className="dev-avatar-inner">A</div>
          </div>
          <div className="dev-info-meta">
            <div className="dev-name-row">
              <span className="dev-author-name">Author</span>
              <span className="dev-badge-verified" title="Pengembang Terverifikasi">
                <CheckCircle2 size={13} color="#2563eb" />
                <span>Pengembang</span>
              </span>
            </div>
            <div className="dev-author-role">Creator &amp; Maintainer TimeCraft</div>
          </div>
        </div>

        <div className="dev-status-indicator">
          <span className="dev-live-dot" />
          <span>Siap Terhubung</span>
        </div>
      </div>

      {showIntro && (
        <p className="dev-profile-bio">
          Punya kritik, saran fitur, atau pertanyaan terkait TimeCraft? Hubungi saya langsung
          melalui saluran komunikasi resmi di bawah ini:
        </p>
      )}

      {/* Grid Saluran Komunikasi: WhatsApp, Instagram, Gmail */}
      <div className="dev-channels-grid">
        {/* Kartu WhatsApp Pro */}
        <div className="dev-channel-card dev-channel-wa">
          <div className="dev-channel-top">
            <div className="dev-channel-icon-wrap wa-icon-glow">
              <WhatsAppIcon size={20} />
            </div>
            <div className="dev-channel-meta">
              <span className="dev-channel-tag">Direct Chat</span>
              <h4 className="dev-channel-title">WhatsApp</h4>
            </div>
          </div>

          <div className="dev-channel-value-box">
            <span className="dev-channel-value">{WHATSAPP_NUMBER}</span>
          </div>

          <div className="dev-channel-actions">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="dev-btn-action dev-btn-primary"
              title="Kirim pesan langsung ke WhatsApp"
            >
              <ExternalLink size={13} />
              <span>Buka Chat</span>
            </a>
            <button
              type="button"
              className="dev-btn-action dev-btn-secondary"
              onClick={handleCopyWA}
              title="Salin nomor WhatsApp"
            >
              {copiedWA ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
              <span>{copiedWA ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
        </div>

        {/* Kartu Instagram Pro */}
        <div className="dev-channel-card dev-channel-ig">
          <div className="dev-channel-top">
            <div className="dev-channel-icon-wrap ig-icon-glow">
              <InstagramIcon size={20} />
            </div>
            <div className="dev-channel-meta">
              <span className="dev-channel-tag">Media Sosial</span>
              <h4 className="dev-channel-title">Instagram</h4>
            </div>
          </div>

          <div className="dev-channel-value-box">
            <span className="dev-channel-value">@{INSTAGRAM_HANDLE}</span>
          </div>

          <div className="dev-channel-actions">
            <a
              href={INSTAGRAM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="dev-btn-action dev-btn-primary"
              title="Buka profil Instagram"
            >
              <ExternalLink size={13} />
              <span>Buka Profil</span>
            </a>
            <button
              type="button"
              className="dev-btn-action dev-btn-secondary"
              onClick={handleCopyIG}
              title="Salin akun Instagram"
            >
              {copiedIG ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
              <span>{copiedIG ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
        </div>

        {/* Kartu Gmail Pro */}
        <div className="dev-channel-card dev-channel-gmail">
          <div className="dev-channel-top">
            <div className="dev-channel-icon-wrap gmail-icon-glow">
              <GmailIcon size={20} />
            </div>
            <div className="dev-channel-meta">
              <span className="dev-channel-tag">Email Resmi</span>
              <h4 className="dev-channel-title">Gmail</h4>
            </div>
          </div>

          <div className="dev-channel-value-box">
            <span className="dev-channel-value" style={{ fontSize: '0.78rem' }}>{GMAIL_ADDRESS}</span>
          </div>

          <div className="dev-channel-actions">
            <a
              href={GMAIL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="dev-btn-action dev-btn-primary"
              title={`Kirim email ke ${GMAIL_ADDRESS}`}
            >
              <ExternalLink size={13} />
              <span>Kirim Email</span>
            </a>
            <button
              type="button"
              className="dev-btn-action dev-btn-secondary"
              onClick={handleCopyGmail}
              title="Salin alamat Gmail"
            >
              {copiedGmail ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
              <span>{copiedGmail ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Catatan Kaki Estetik */}
      <div className="dev-footer-note">
        <Sparkles size={13} color="var(--primary-blue)" />
        <span>Respon cepat untuk umpan balik dan pengembangan website</span>
      </div>
    </div>
  );
};
