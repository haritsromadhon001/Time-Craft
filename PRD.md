# 📄 PRD.md — Product Requirements Document (TimeCraft)

---

## 1. Ringkasan Eksekutif (*Executive Summary*)

**TimeCraft** adalah platform aplikasi web progresif yang didesain untuk membantu individu, keluarga, dan institusi pendidikan mengambil alih kendali atas kebiasaan digital mereka. Menggabungkan pencatatan waktu layar (*screen time*) yang disiplin, pengatur waktu fokus (*deep work timer*), serta portal pengawasan kolaboratif untuk ruang keluarga dan kelas belajar, TimeCraft mengubah hubungan manusia dengan teknologi dari pasif-konsumtif menjadi sadar, terukur, dan bermakna (*digital mindfulness*).

---

## 2. Latar Belakang & Masalah yang Diselesaikan (*Problem Statements*)

| Permasalahan Nyata | Dampak Negatif | Solusi yang Dihadirkan TimeCraft |
| :--- | :--- | :--- |
| **Ketergantungan Gawai Pasif (*Doomscrolling*)** | Kelelahan mental (*screen fatigue*), hilangnya konsentrasi, dan insomnia. | Pencatatan waktu layar kategoris dengan sistem anti-tabrakan waktu dan visualisasi rasio produktivitas harian. |
| **Sesi Kerja Sering Terdistraksi** | Tugas bernilai tinggi tertunda, tidak ada fokus mendalam (*deep work*). | *Focus Timer* Pomodoro berbasis stempel waktu riil dengan dentang audio dan sistem anti-reset saat browser diminimalkan. |
| **Kekhawatiran Orang Tua atas Gawai Anak** | Anak menghabiskan waktu berlebih di HP tanpa transparansi dan pemantauan sehat. | **Ruang Keluarga Real-Time**: Orang tua dapat memantau durasi layar dan waktu belajar anak dari laptop/HP melalui kode akses unik. |
| **Kurangnya Akuntabilitas Belajar Siswa** | Guru sulit memantau apakah murid belajar mandiri atau terdistraksi di rumah. | **Portal Kelas Digital**: Guru membuat ruang kelas dan murid menyetorkan laporan aktivitas belajar secara transparan. |
| **Ketiadaan Bukti Laporan Formal** | Siswa/profesional kesulitan membuktikan kepatuhan waktu layar untuk beasiswa/magang. | **Ekspor PDF Resmi**: Menghasilkan dokumen A4 berstandar korporat dengan logo vektor resmi, metrik eksekutif, dan verifikasi digital. |

---

## 3. Persona Pengguna (*Target Personas*)

### 3.1 Persona 1: Pengguna Produktif Mandiri (*The Self-Improver*)
* **Profil**: Mahasiswa, pekerja lepas (*freelancer*), atau profesional digital.
* **Tujuan**: Membatasi konsumsi media sosial, memperbanyak jam fokus, dan melacak pencapaian harian secara jujur.
* **Kebutuhan**: Dasbor analitik bersih, timer Pomodoro tangguh, dan jurnal refleksi mingguan.

### 3.2 Persona 2: Orang Tua & Anak (*The Family Unit*)
* **Profil**: Orang tua yang ingin mendampingi anak dalam membangun kebiasaan layar yang sehat di rumah.
* **Tujuan**: Memastikan anak tidak bermain game hingga larut malam dan tetap meluangkan waktu untuk belajar.
* **Kebutuhan**: Kode keluarga unik (`FAM-XXXX`), sinkronisasi multi-device instan, indikator kepatuhan batas harian, dan cetak rekap keluarga.

### 3.3 Persona 3: Guru & Siswa (*The Academic Classroom*)
* **Profil**: Pendidik atau tutor bimbingan belajar.
* **Tujuan**: Mengukur kedisiplinan dan durasi belajar mandiri murid di luar jam sekolah.
* **Kebutuhan**: Kode kelas murid (`CLS-XXXX`), rekapitulasi kolektif murid dalam kelas, dan ekspor laporan kelas formal.

---

## 4. Persyaratan Fitur & Logika Bisnis (*Functional Requirements*)

### 4.1 Modul 1: Dasbor Ringkasan Harian (*Dashboard Overview*)
* **Metrik Utama**: Total jam layar hari ini, total waktu fokus tuntas, rasio produktif vs non-produktif (%).
* **Sapaan Personal Dinamis**: Menampilkan nama tampilan pengguna dan penyesuaian waktu lokal (pagi/siang/malam).
* **Aksi Sekali Klik**: Tombol pintas untuk segera mencatat aktivitas atau memulai timer fokus.

### 4.2 Modul 2: Pencatat Waktu Layar (*Screen Time Tracker*)
* **7 Kategori Baku**:
  1. *Belajar & Kuliah* (Produktif)
  2. *Pekerjaan & Proyek* (Produktif)
  3. *Media Sosial* (Non-Produktif)
  4. *Hiburan & Streaming* (Non-Produktif)
  5. *Bermain Game* (Non-Produktif)
  6. *Komunikasi & Pesan* (Fleksibel)
  7. *Lainnya* (Umum)
* **Validasi Anti-Collision**: Menolak penyimpanan data jika rentang `start_time` dan `end_time` bertabrakan dengan aktivitas lain pada tanggal yang sama.

### 4.3 Modul 3: Pengatur Waktu Fokus Pomodoro (*Focus Timer*)
* **Preset Durasi**: 25 menit (Pomodoro), 50 menit (Deep Work), 90 menit (Ultradian), dan kustom.
* **Ketahanan Sesi (*Crash-Resilient*)**: Sesi dihitung berdasarkan selisih waktu (`Date.now() - startTime`), tidak akan berhenti meski halaman di-refresh.
* **Notifikasi Audio**: Dentang lonceng penanda akhir sesi fokus dan jeda istirahat singkat (*short break*).

### 4.4 Modul 4: Ruang Keluarga (*Family Screen Time Monitoring*)
* **Pembuatan Ruang**: Orang tua membuat ruang keluarga dan memperoleh kode unik (contoh: `FAM-A9G5`).
* **Koneksi Lintas Perangkat**: Anak memasukkan kode dari HP/laptop untuk terhubung secara instan.
* **Papan Pemantauan Orang Tua**: Menampilkan daftar anak, durasi layar hari ini, durasi fokus, rata-rata 7 hari, dan status tertib vs melewati batas.
* **Ekspor Laporan Keluarga**: Tombol "Cetak Laporan PDF" untuk mencetak lembar pemantauan keluarga resmi TimeCraft.

### 4.5 Modul 5: Portal Kelas & Sekolah (*Classroom Portal*)
* **Mode Guru**: Membuka kelas baru, membagikan kode kelas, dan melihat rekap aktivitas seluruh murid.
* **Mode Siswa**: Bergabung ke kelas guru dan mengirimkan aktivitas belajar harian.
* **Laporan Akademik**: Rekapitulasi kelas resmi A4 dengan data lengkap kehadiran digital siswa.

### 4.6 Modul 6: Ekspor Dokumen Laporan PDF Resmi (*Verified PDF Engine*)
* **Identitas Visual**: Logo vektor TimeCraft (biru `#2563EB` dengan jam), tagline resmi, dan domain `time-craft-ruby.vercel.app`.
* **Tata Letak Standar A4**: `@page { size: A4 portrait; margin: 12mm 15mm; }` yang proporsional baik diekspor dari layar smartphone maupun laptop.
* **Komponen Lembar Laporan**:
  1. Header resmi dan stempel tanggal cetak (WIB).
  2. Kartu profil dan rentang tanggal analisis.
  3. 4 kartu metrik eksekutif.
  4. Tabel berstatus pill badge (`✓ Tertib / Produktif` vs `⚠️ Melewati Batas`).
  5. Kotak evaluasi kritis dan saran perbaikan kebiasaan layar.
  6. Pedoman kesehatan mata 20-20-20.
  7. Blok verifikasi digital *TimeCraft Verified Document* dan tanda tangan resmi.

### 4.7 Modul 7: Speed-Dial Komunikasi Mengambang (*Floating Contact Widget*)
* **Hover Tooltip**: Saat kursor menyentuh tombol chat, muncul pesan ajakan masukan: *"Bagi Anda yang ingin memberikan masukan penggunaan website, silakan klik untuk menyampaikan kritik dan saran langsung kepada Author."*
* **Pilihan Ikon Cepat**: Saat diklik, memunculkan menu vertikal:
  - **Gmail**: Logo resmi Google Gmail 4-warna di atas lingkaran putih bersih (`haritsromadhon001@gmail.com`).
  - **Instagram**: Gradien sunset resmi (`@haritsabdrmd`).
  - **WhatsApp**: Gradien emerald resmi (`085711092611`).

---

## 5. Persyaratan Non-Fungsional (*Non-Functional Requirements*)

1. **Performa & Ringan**:
   - Waktu muat awal (*First Contentful Paint*) di bawah 1 detik pada koneksi 4G.
   - Tanpa runtime CSS berat; seluruh komponen memanfaatkan CSS Variables murni.
2. **Keamanan & Privasi**:
   - Autentikasi berbasis Supabase Auth dengan isolasi data akun menggunakan Row Level Security (RLS).
   - Pengolahan foto profil dipotong secara simetris di sisi browser klien sebelum disimpan.
3. **Kompatibilitas**:
   - Bekerja optimal di Google Chrome, Microsoft Edge, Safari, Firefox, dan peramban seluler (iOS Safari & Android Chrome).

---

## 6. Kriteria Keberhasilan & Metrik Produk (*Success Metrics*)

1. **Akurasi Data**: 0% tabrakan catatan waktu yang lolos ke database (*zero overlap allowance*).
2. **Kepatuhan Target**: Peningkatan rasio waktu produktif pengguna di atas 60% dalam pemakaian 14 hari berturut-turut.
3. **Keterlibatan Kolaboratif**: Keberhasilan koneksi lintas perangkat (orang tua ➔ anak, guru ➔ murid) tanpa hambatan pendaftaran ganda.
4. **Kepuasan Visual**: Nilai estetika tinggi dengan umpan balik positif terhadap kemudahan navigasi dan kejernihan laporan PDF.
