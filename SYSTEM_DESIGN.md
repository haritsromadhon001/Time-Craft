# 🎨 SYSTEM_DESIGN.md — TimeCraft Design System

Dokumen ini mendefinisikan arsitektur visual, palet warna, tipografi, komponen antarmuka (UI), serta pedoman pengalaman pengguna (*user experience*) untuk platform **TimeCraft**.

---

## 1. Filosofi Desain Visual

TimeCraft dirancang dengan pendekatan **Dark-First Modern SaaS** dengan dukungan penuh untuk **Clean Light Mode**. Tujuannya adalah menciptakan atmosfer produktivitas yang fokus, tenang, dan minim distraksi (*minimalist deep work aesthetics*).

### Prinsip Desain Utama:
1. **Fokus & Keterbacaan (*High Legibility*)**: Menggunakan tipografi terstruktur untuk membedakan data analitik, angka waktu, dan teks panduan.
2. **Kejujuran Visual (*Visual Honesty*)**: Metrik kosong ditampilkan eksplisit (*"Belum ada data"*), bukan dimanipulasi menjadi angka nol palsu.
3. **Sentuhan Halus (*Subtle Micro-Interactions*)**: Menggunakan transisi berkecepatan 150ms–250ms dengan kurva `cubic-bezier` untuk memberikan sensasi responsif dan luwes (*snappy yet fluid*).
4. **Desain Ramah Cetak (*Print-Ready Precision*)**: Komponen laporan dioptimalkan untuk menghasilkan dokumen PDF A4 berstandar eksekutif langsung dari peramban tanpa terdistorsi.

---

## 2. Palet Warna (*Color Tokens*)

Sistem warna TimeCraft menggunakan variabel CSS native (`var(--...)`) yang mendukung pergantian tema instan (*theme switching*) via atribut `data-theme` pada elemen root `<html>`.

### 2.1 Tema Gelap (*Dark Mode — Default*)
```css
:root {
  --bg-primary: #090b10;          /* Latar belakang utama kanvas */
  --bg-secondary: #0d1118;        /* Latar bilah sisi dan bilah atas */
  --bg-tertiary: #121722;         /* Latar belakang kartu kontras */
  
  --surface-card: #161c28;        /* Kartu metrik dan panel konten */
  --surface-hover: #1e2636;       /* Efek hover pada kartu */
  --surface-active: #242d3d;      /* Status aktif / ditekan */
  
  --border-subtle: #242d3d;       /* Garis pemisah halus */
  --border-strong: #334155;       /* Garis batas fokus dan input */
  
  --text-primary: #ffffff;        /* Judul dan teks utama */
  --text-secondary: #94a3b8;      /* Teks deskripsi dan label metrik */
  --text-muted: #64748b;          /* Catatan kaki dan stempel waktu */
}
```

### 2.2 Tema Terang (*Light Mode*)
```css
[data-theme="light"] {
  --bg-primary: #f8fafc;          /* Latar belakang utama kanvas */
  --bg-secondary: #ffffff;        /* Latar bilah sisi dan header */
  --bg-tertiary: #f1f5f9;         /* Latar sekunder halus */
  
  --surface-card: #ffffff;        /* Kartu putih bersih */
  --surface-hover: #f8fafc;       /* Efek hover kartu */
  --surface-active: #e2e8f0;      /* Status ditekan */
  
  --border-subtle: #e2e8f0;       /* Garis pemisah halus */
  --border-strong: #cbd5e1;       /* Batas input */
  
  --text-primary: #0f172a;        /* Teks gelap utama */
  --text-secondary: #475569;      /* Teks abu-abu terbaca */
  --text-muted: #94a3b8;          /* Teks redup */
}
```

### 2.3 Warna Aksen Fungsional
| Token | Nilai Hex | Fungsi & Makna |
| :--- | :--- | :--- |
| **Primary Blue** | `#2563eb` / `#1d4ed8` | Aksi utama, branding resmi TimeCraft, link, dan tombol konfirmasi |
| **Timer Crimson** | `#dc2626` / `#b91c1c` | Tombol dan indikator Focus Timer aktif (*urgency / high focus*) |
| **Productive Emerald** | `#059669` / `#22c55e` | Status kegiatan produktif, capaian target, dan pill badge tertib |
| **Warning Amber** | `#d97706` / `#f59e0b` | Peringatan batas screen time terlewati, evaluasi kritis |
| **Slate / Neutral** | `#475569` / `#64748b` | Kegiatan non-produktif / santai, kategori umum |

### 2.4 Warna Saluran Komunikasi Pihak Ketiga
* **WhatsApp**: `#25D366` ➔ `#128C7E` (*emerald gradient*)
* **Instagram**: `#f09433` ➔ `#e6683c` ➔ `#dc2743` ➔ `#cc2366` ➔ `#bc1888` (*sunset gradient*)
* **Google Gmail**: `#ffffff` (*clean white circle*) dengan ikon 4-warna resmi Google (`#4285F4`, `#34A853`, `#FBBC04`, `#EA4335`)

---

## 3. Tipografi (*Typography System*)

Sistem tipografi menggunakan kombinasi Google Fonts yang dioptimalkan untuk web:

1. **Inter (`font-sans`)**:
   - Digunakan untuk seluruh teks UI, judul, tombol, dan formulir.
   - Bobot yang digunakan: Regular (400), Medium (500), Semi-Bold (600), Bold (700), Extra-Bold (800).
   - Fitur font: `-apple-system, BlinkMacSystemFont, "Inter", sans-serif`.

2. **JetBrains Mono (`font-mono`)**:
   - Digunakan untuk penunjuk waktu (Jam Digital Live, Timer Countdown), angka statistik, serta kode unik (`FAM-XXXX`, `CLS-XXXX`).
   - Mencegah pergeseran angka berdetik (*tabular lining figures / non-jittering monospace*).

### Skala Tipografi:
- **Display Heading**: `1.75rem` (28px), Semi-Bold / Bold (Header halaman utama)
- **Section Heading**: `1.25rem` (20px), Semi-Bold (Judul bagian kartu)
- **Card Title / Value**: `1.5rem` (24px) – `1.75rem` (28px), Extra-Bold (Angka metrik utama)
- **Body Regular**: `0.875rem` (14px), Regular / Medium
- **Caption / Meta**: `0.75rem` (12px), Semi-Bold, Letter-spacing `0.02em`
- **Micro Badge**: `0.65rem` (10.5px), Bold, Uppercase, Letter-spacing `0.04em`

---

## 4. Komponen Antarmuka (*UI Components*)

### 4.1 Bilah Sisi Navigasi (*Collapsible Sidebar*)
* Dapat diciutkan (*collapsed*) untuk memaksimalkan ruang kerja atau dibuka (*expanded*) untuk label menu lengkap.
* Memuat navigasi terpusat: Dashboard, Screen Time, Focus Timer, Target & Refleksi, Analitik, Pantau & Bimbingan (Kelas/Keluarga), dan Pengaturan.
* Dilengkapi **Jam Klien Real-Time** yang berdetik presisi dengan label zona waktu aktif (WIB/WITA/WIT/UTC).

### 4.2 Kartu Metrik Ringkasan (*Executive Stat Cards*)
* Desain grid adaptif (`grid-4`, `grid-3`, `grid-2`, `grid-1` pada mobile).
* Latar belakang kaca halus dengan batas luar `1px solid var(--border-subtle)`.
* Menampilkan label metrik, angka durasi yang dihitung secara dinamis, dan baris konteks pembanding.

### 4.3 Speed-Dial Kontak Mengambang (*Floating Action Widget*)
* Terletak di pojok kanan bawah layar (`fixed; bottom: 22px; right: 24px; z-index: 1000`).
* **Saat disentuh (hover sebelum diklik)**: Memunculkan *tooltip* lembut di sebelah kiri berisi ajakan: *"Bagi Anda yang ingin memberikan masukan penggunaan website, silakan klik untuk menyampaikan kritik dan saran langsung kepada Author."*
* **Saat diklik**: Menampilkan 3 tombol lingkaran mengambang vertikal (Gmail Google 4-warna, Instagram gradient, WhatsApp emerald) yang dilengkapi label frosted glass.

### 4.4 Tabel & Status Badge
* Header tabel gelap bergaya profesional (`#0f172a`), teks putih kapital.
* Baris bergaris belang lembut (*zebra striping* `#ffffff` dan `#f8fafc`).
* *Status Badge Pill*:
  * `✓ Produktif` / `✓ Tertib`: Latar hijau lembut (`#ecfdf5`), teks hijau tua (`#059669`).
  * `Non-Produktif`: Latar abu-abu lembut (`#f1f5f9`), teks abu-abu gelap (`#475569`).
  * `⚠️ Melewati Batas`: Latar merah lembut (`#fef2f2`), teks merah tegas (`#dc2626`).

### 4.5 Kotak Dialog & Notifikasi (*Modal & ConfirmDialog*)
* Backdrop gelap blur (`backdrop-filter: blur(6px); background: rgba(0, 0, 0, 0.7)`).
* Animasi buka/tutup skala mikro (`scale(0.95)` ➔ `scale(1)`).
* Mendukung penutupan via tombol `Esc` dan klik luar modal.

---

## 5. Sistem Tata Letak Cetak & Dokumen PDF (*Print Design System*)

Format cetak TimeCraft dirancang untuk standar kertas internasional **A4 Portrait** (210mm × 297mm):

* **Ukuran Margin Halaman**: `@page { size: A4 portrait; margin: 12mm 15mm; }`
* **Pemberian Warna Asli**: `-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;`
* **Struktur Lembar Dokumen**:
  1. **Header Kop Surat**: Logo vektor TimeCraft (*inline SVG 300+ DPI*), nama platform, tagline, URL domain `time-craft-ruby.vercel.app`, serta badge dokumen dan stempel tanggal cetak WIB.
  2. **Metadata Pemantauan**: Kartu info nama akun pengguna / guru / orang tua dan kode akses ruangan.
  3. **4 Kotak Metrik Ringkasan**: Total screen time, rerata harian, total fokus, dan persentase kepatuhan.
  4. **Tabel Rincian Data**: Komposisi proporsional dengan kolom durasi, persentase, dan bar grafis.
  5. **Kotak Wawasan Edukasi**: Rekomendasi aturan istirahat mata 20-20-20.
  6. **Blok Pengesahan & Tanda Tangan**: Watermark *TimeCraft Verified Document* dan garis tanda tangan resmi.
* **Kompatibilitas Lintas Perangkat**: Menghasilkan dokumen cetak A4 yang sama persis dan proporsional baik diekspor dari layar smartphone maupun laptop.
