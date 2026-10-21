import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { DeveloperContactCard } from './DeveloperContactCard';

export const FloatingContactWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Tutup popover jika pengguna mengklik di luar area widget atau menekan Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
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
      {/* Popover Kartu Informasi Kontak Pro (Muncul Saat Ikon Diklik) */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="floating-contact-popover"
          role="dialog"
          aria-label="Kartu Kontak Pengembang"
          aria-modal="true"
        >
          <div className="contact-popover-top-bar">
            <span className="contact-popover-tag">Kontak Pengembang</span>
            <button
              type="button"
              className="contact-popover-close"
              onClick={() => setIsOpen(false)}
              aria-label="Tutup jendela kontak"
            >
              <X size={16} />
            </button>
          </div>

          <DeveloperContactCard showIntro={false} />
        </div>
      )}

      {/* Tombol Pemicu Mengambang di Pojok Kanan Bawah */}
      <button
        ref={triggerRef}
        type="button"
        className={`floating-contact-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title={isOpen ? 'Tutup Kontak' : 'Hubungi WhatsApp & Instagram Pengembang'}
        aria-label="Buka kontak WhatsApp dan Instagram"
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
