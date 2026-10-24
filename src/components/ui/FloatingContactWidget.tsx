import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import {
  WhatsAppIcon,
  InstagramIcon,
  GmailIcon,
  WHATSAPP_LINK,
  INSTAGRAM_LINK,
  GMAIL_LINK,
  GMAIL_ADDRESS,
} from './SocialIcons';

export const FloatingContactWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Tutup menu jika pengguna mengklik di luar area widget atau menekan Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <aside className="floating-contact-root" aria-label="Widget Kontak & Media Sosial">
      {/* Menu Ikon Mengambang: Gmail, Instagram, WhatsApp Langsung */}
      {isOpen && (
        <div
          ref={menuRef}
          className="floating-social-speeddial"
          role="menu"
          aria-label="Pilihan Chat & Media Sosial"
        >
          {/* Tombol Ikon Gmail */}
          <a
            href={GMAIL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="floating-social-action item-gmail"
            title={`Kirim Email ke ${GMAIL_ADDRESS}`}
            aria-label="Gmail"
            onClick={() => setIsOpen(false)}
          >
            <span className="floating-social-label">Gmail</span>
            <div className="floating-social-icon-btn gmail-btn">
              <GmailIcon size={20} />
            </div>
          </a>

          {/* Tombol Ikon Instagram */}
          <a
            href={INSTAGRAM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="floating-social-action item-ig"
            title="Buka Instagram (@haritsabdrmd)"
            aria-label="Instagram"
            onClick={() => setIsOpen(false)}
          >
            <span className="floating-social-label">Instagram</span>
            <div className="floating-social-icon-btn ig-btn">
              <InstagramIcon size={22} />
            </div>
          </a>

          {/* Tombol Ikon WhatsApp */}
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="floating-social-action item-wa"
            title="Chat WhatsApp (085711092611)"
            aria-label="WhatsApp"
            onClick={() => setIsOpen(false)}
          >
            <span className="floating-social-label">WhatsApp</span>
            <div className="floating-social-icon-btn wa-btn">
              <WhatsAppIcon size={22} />
            </div>
          </a>
        </div>
      )}

      {/* Tooltip Kritik, Saran & Feedback (Muncul saat tombol disentuh / di-hover sebelum diklik) */}
      {!isOpen && (
        <div className="floating-trigger-tooltip" role="tooltip" aria-hidden="true">
          <div className="trigger-tooltip-title">
            <span className="tooltip-title-icon">💬</span>
            <span>Feedback &amp; Masukan</span>
          </div>
          <div className="trigger-tooltip-desc">
            Bagi Anda yang ingin memberikan masukan penggunaan website, silakan klik untuk menyampaikan <strong>kritik dan saran langsung kepada Author</strong>.
          </div>
        </div>
      )}

      {/* Tombol Pemicu Mengambang di Pojok Kanan Bawah */}
      <button
        ref={triggerRef}
        type="button"
        className={`floating-contact-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Beri feedback, kritik dan saran penggunaan website untuk Author"
        aria-label="Buka kontak WhatsApp dan Instagram untuk kritik dan saran"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X size={22} className="trigger-icon" />
        ) : (
          <div className="trigger-icon-cluster">
            <MessageCircle size={22} className="trigger-main-icon" />
            <span className="trigger-online-dot" />
          </div>
        )}
      </button>
    </aside>
  );
};
