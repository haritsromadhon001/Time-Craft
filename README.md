<div align="center">

# ⏱️ TimeCraft

### Platform Manajemen Waktu Layar, Fokus Mendalam, & Pemantauan Digital Terpadu
*Solusi cerdas berbasis web untuk mengelola waktu layar secara bijak, meningkatkan konsentrasi belajar dan bekerja, serta memantau aktivitas digital keluarga dan kelas secara real-time.*

<br/>

[![Live Demo](https://img.shields.io/badge/Website-time--craft--ruby.vercel.app-2563eb?style=for-the-badge&logo=vercel&logoColor=white)](https://time-craft-ruby.vercel.app/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Database](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

<br/>

---

</div>

## 📑 Daftar Isi

- [1. Mengenal TimeCraft](#1-mengenal-timecraft)
- [2. Filosofi & Pilar Utama](#2-filosofi--pilar-utama)
- [3. Fitur Utama & Modul Sistem](#3-fitur-utama--modul-sistem)
  - [3.1 Dasbor Ringkasan Harian (*Dashboard Overview*)](#31-dasbor-ringkasan-harian-dashboard-overview)
  - [3.2 Pencatat Waktu Layar (*Screen Time Tracker*)](#32-pencatat-waktu-layar-screen-time-tracker)
  - [3.3 Pengatur Waktu Fokus Pomodoro (*Focus Timer*)](#33-pengatur-waktu-fokus-pomodoro-focus-timer)
  - [3.4 Ruang Pemantauan Keluarga (*Family Screen Time Monitoring*)](#34-ruang-pemantauan-keluarga-family-screen-time-monitoring)
  - [3.5 Portal Kelas & Pemantauan Siswa (*Classroom & School Portal*)](#35-portal-kelas--pemantauan-siswa-classroom--school-portal)
  - [3.6 Ekspor Dokumen Laporan PDF Resmi (*TimeCraft Verified Report*)](#36-ekspor-dokumen-laporan-pdf-resmi-timecraft-verified-report)
  - [3.7 Target Harian & Jurnal Refleksi Mingguan](#37-target-harian--jurnal-refleksi-mingguan)
  - [3.8 Analitik Mendalam & Visualisasi Data](#38-analitik-mendalam--visualisasi-data)
  - [3.9 Sinkronisasi Real-Time Multi-Perangkat (HP & Laptop)](#39-sinkronisasi-real-time-multi-perangkat-hp--laptop)
  - [3.10 Personalisasi Profil & Keamanan Akun](#310-personalisasi-profil--keamanan-akun)
- [4. Alur Kerja Pengguna (*User Workflows*)](#4-alur-kerja-pengguna-user-workflows)
  - [4.1 Alur Penggunaan Mandiri (*Personal Productivity*)](#41-alur-penggunaan-mandiri-personal-productivity)
  - [4.2 Alur Pengawasan Orang Tua & Anak (*Family Mode*)](#42-alur-pengawasan-orang-tua--anak-family-mode)
  - [4.3 Alur Guru & Siswa (*Education Mode*)](#43-alur-guru--siswa-education-mode)
- [5. Arsitektur Teknis & Teknologi](#5-arsitektur-teknis--teknologi)
- [6. Panduan Menjalankan Proyek Secara Lokal (*Local Setup*)](#6-panduan-menjalankan-proyek-secara-lokal-local-setup)
- [7. Keamanan & Kebijakan Privasi](#7-keamanan--kebijakan-privasi)
- [8. Kontribusi & Lisensi](#8-kontribusi--lisensi)

---

## 1. Mengenal TimeCraft

Di era serba digital saat ini, keterhubungan tanpa henti sering kali memecah konsentrasi dan mengikis produktivitas. Menghabiskan waktu berjam-jam di depan gawai atau laptop kerap terjadi tanpa disadari, menimbulkan kelelahan mata (*screen fatigue*) serta berkurangnya kualitas istirahat.

**TimeCraft** hadir sebagai platform terintegrasi untuk membantu individu, keluarga, dan institusi pendidikan mengambil alih kendali atas waktu secara sadar (*mindful time management*). 

Tidak hanya sebagai pencatat pasif, TimeCraft menggabungkan:
1. **Pencatatan Waktu Layar Mandiri** dengan validasi anti-tumpang tindih waktu.
2. **Pengatur Fokus Pomodoro Tangguh** yang tetap berjalan meski tab browser ditutup atau dimuat ulang.
3. **Portal Pengawasan Keluarga** yang memungkinkan orang tua memantau keseimbangan waktu anak dari jarak jauh secara aman.
4. **Ruang Kelas Digital** untuk guru memonitor keteraturan belajar para siswa.
5. **Ekspor Dokumen Laporan PDF Resmi** berstandar profesional dengan identitas visual TimeCraft, ringkasan metrik eksekutif, dan verifikasi digital.

---

## 2. Filosofi & Pilar Utama

> *"Produktivitas sejati bukanlah tentang menyibukkan diri sepanjang hari, melainkan tentang memilih hal-hal bermakna yang layak mendapatkan fokus penuh Anda."*

TimeCraft dibangun berlandaskan empat prinsip inti:

1. **Integritas Data Transparan**: Tidak memanipulasi metrik. Jika belum ada data aktivitas, sistem menyatakannya dengan jujur, bukan menampilkan angka nol palsu.
2. **Sinkronisasi Multi-Perangkat Tanpa Hambatan**: Satu akun dapat digunakan secara serempak di laptop kerja dan smartphone, tersinkronisasi otomatis ke cloud.
3. **Privasi & Keamanan Terisolasi**: Akses data keluarga dan kelas dilindungi oleh kode akses unik (*cryptographically isolated access*).
4. **Desain SaaS Modern & Ramah Pengguna**: Mengutamakan kenyamanan visual dengan tata letak responsif, kontras warna yang menenangkan mata, serta tipografi modern.

---

## 3. Fitur Utama & Modul Sistem

### 3.1 Dasbor Ringkasan Harian (*Dashboard Overview*)
Pusat kendali utama yang merangkum kesehatan aktivitas digital pengguna dalam sekejap:
* **Kartu Ringkasan Metrik**: Total waktu layar hari ini, total jam fokus belajar, dan rasio pencapaian target.
* **Indikator Rasio Produktivitas**: Perbandingan matematis antara waktu produktif (pekerjaan/studi) vs waktu hiburan/media sosial.
* **Aksi Cepat Sekali Klik**: Tombol pintas untuk segera mencatat aktivitas baru atau menyalakan sesi fokus.
* **Salam Sambutan Personal**: Menyapa pengguna berdasarkan nama tampilan akun dan waktu harian (pagi, siang, malam).

---

### 3.2 Pencatat Waktu Layar (*Screen Time Tracker*)
Pencatatan riwayat pemakaian gawai dengan akurat dan tertib:
* **7 Kategori Aktivitas Terstruktur**:
  * 📚 **Belajar & Kuliah** *(Kategori Produktif)*
  * 💼 **Pekerjaan & Proyek** *(Kategori Produktif)*
  * 📱 **Media Sosial** *(Kategori Non-Produktif)*
  * 🎬 **Hiburan & Streaming** *(Kategori Non-Produktif)*
  * 🎮 **Bermain Game** *(Kategori Non-Produktif)*
  * 💬 **Komunikasi & Pesan** *(Kategori Fleksibel)*
  * 🌐 **Lainnya** *(Kategori Umum)*
* **Pencegah Tabrakan Waktu (*Anti-Collision Engine*)**: Mencegah kesalahan manusia dengan menolak penyimpanan catatan jam yang saling tumpang tindih (*time overlap*) pada hari yang sama.
* **Catatan Rincian Tugas**: Menyimpan deskripsi pekerjaan atau materi yang sedang dipelajari.

---

### 3.3 Pengatur Waktu Fokus Pomodoro (*Focus Timer*)
Asisten konsentrasi untuk memasuki mode kerja mendalam (*deep work*):
* **Pilihan Durasi Fleksibel**: Preset standar 25 menit (Pomodoro klasik), 50 menit, 90 menit, atau durasi kustom.
* **Sasaran Tugas Spesifik**: Pengguna menentukan target hasil spesifik sebelum sesi dimulai.
* **Sesi Anti-Reset**: Timer berjalan berbasis stempel waktu (*timestamp delta*) sehingga tidak terganggu saat browser di-refresh atau dialihkan ke aplikasi lain.
* **Notifikasi Audio & Jeda Istirahat**: Notifikasi suara yang jernih saat sesi fokus usai, dilanjutkan dengan sesi istirahat singkat (*short break*) untuk relaksasi mata.
* **Penyimpanan Otomatis**: Tiap sesi fokus yang selesai langsung masuk ke basis data harian pengguna.

---

### 3.4 Ruang Pemantauan Keluarga (*Family Screen Time Monitoring*)
Solusi pendampingan digital orang tua terhadap kebiasaan gawai anak di rumah:
* **Pembuatan Ruang Keluarga**: Orang tua dapat membuat ruang keluarga instan dan memperoleh **Kode Keluarga Unik** (contoh: `FAM-A9G5`).
* **Koneksi Lintas Perangkat**: Anak cukup memasukkan kode keluarga dari smartphone atau laptop mereka untuk terhubung ke ruang keluarga orang tua.
* **Pemantauan Real-Time**: Orang tua dapat melihat durasi layar anak hari ini, total jam fokus belajar, rata-rata 7 hari terakhir, dan waktu terhubung.
* **Indikator Batas Sehat**: Status kepatuhan otomatis menandai apakah durasi layar anak masih berada dalam batas wajar atau melewati batas.
* **Pencegahan Duplikasi & Keamanan**: Ruang keluarga dilindungi dari penghapusan tidak sengaja dengan konfirmasi keamanan.

---

### 3.5 Portal Kelas & Pemantauan Siswa (*Classroom & School Portal*)
Mendukung institusi pendidikan dan guru dalam memantau kedisiplinan belajar digital siswa:
* **Manajemen Kelas Interaktif**: Guru dapat membuka kelas baru dan membagikan **Kode Kelas** kepada seluruh murid.
* **Akuntabilitas Belajar Siswa**: Siswa mengisi laporan waktu layar dan durasi belajar yang langsung tersinkronisasi ke papan pemantauan guru.
* **Daftar Kehadiran & Aktivitas Digital**: Guru dapat mengecek kepatuhan seluruh kelas secara kolektif dalam satu tampilan terpusat.

---

### 3.6 Ekspor Dokumen Laporan PDF Resmi (*TimeCraft Verified Report*)
Menghasilkan dokumen laporan profesional yang siap cetak atau disimpan sebagai PDF:
* **Identitas Visual Resmi TimeCraft**: Dilengkapi logo vektor TimeCraft (*high-resolution vector logo*), tagline platform, dan domain resmi.
* **Kartu Ringkasan Eksekutif (4 Metrik Utama)**:
  1. Total Anak / Siswa Terhubung
  2. Rerata Waktu Layar Hari Ini
  3. Total Jam Fokus Belajar
  4. Persentase Kepatuhan Batas Waktu
* **Tabel Terstruktur dengan Badge Status**: Baris data rapi dengan penanda status berwarna (🟢 *✓ Tertib / Terkendali* vs 🟠 *⚠️ Melewati Batas*).
* **Pedoman Kesehatan Mata 20-20-20**: Memuat petunjuk kesehatan mata TimeCraft (istirahat 20 detik melihat jarak 6 meter setiap 20 menit).
* **Verifikasi Digital & Kolom Tanda Tangan**: Cap dokumen elektronik terverifikasi (*TimeCraft Verified Document*) dan kolom tanda tangan pengesahan resmi.

---

### 3.7 Target Harian & Jurnal Refleksi Mingguan
* **Batas Maksimal Layar & Target Fokus**: Menentukan batas maksimal gawai per hari dan target minimal durasi konsentrasi.
* **Jurnal Refleksi Akhir Pekan**:
  * Evaluasi suasana hati mingguan (*Mood Rating* skala 1–5).
  * Catatan pencapaian positif mingguan (*Weekly Wins*).
  * Rencana evaluasi dan perbaikan untuk pekan berikutnya.

---

### 3.8 Analitik Mendalam & Visualisasi Data
* **Grafik Tren Fluktuasi**: Melihat pola pemakaian gawai dari hari ke hari.
* **Diagram Proporsi Kategori**: Analisis persentase penggunaan waktu berdasarkan jenis aktivitas.
* **Statistik Sesi Fokus**: Perbandingan jam fokus vs jam non-produktif.

---

### 3.9 Sinkronisasi Real-Time Multi-Perangkat (HP & Laptop)
* **Akses Terpadu Satu Akun**: Pengguna dapat masuk menggunakan email dan password yang sama di laptop maupun smartphone tanpa perlu mendaftar ulang.
* **Dukungan Basis Data Cloud**: Menggunakan PostgreSQL Supabase dengan skema relasional tangguh untuk sinkronisasi data antarperangkat secara instan.
* **Ketahanan Operasi (*Resilient Fallback*)**: Jika terjadi kendala jaringan sementara, sistem tetap menyimpan catatan secara lokal dan melakukan rekonsiliasi saat koneksi pulih.

---

### 3.10 Personalisasi Profil & Keamanan Akun
* **Kustomisasi Foto Profil**: Mengunggah foto profil yang otomatis dioptimalkan dan dipotong simetris (*center-cropped square*) di sisi browser.
* **Ganti Kata Sandi Mandiri**: Memperbarui kata sandi langsung dengan validasi kata sandi lama dan baru secara aman.
* **Pengaturan Zona Waktu Fleksibel**: Mendukung zona waktu WIB, WITA, WIT, Singapore, Tokyo, London, hingga UTC.

---

## 4. Alur Kerja Pengguna (*User Workflows*)

### 4.1 Alur Penggunaan Mandiri (*Personal Productivity*)
```
  [Buka Dasbor] ──> [Pasang Target Harian] ──> [Jalankan Focus Timer] ──> [Catat Aktivitas] ──> [Refleksi Mingguan]
```

### 4.2 Alur Pengawasan Orang Tua & Anak (*Family Mode*)
```
  ORANG TUA (Laptop/HP):
  [Buka Menu Keluarga] ──> [Buat Ruang Keluarga] ──> [Dapatkan Kode Unik: FAM-XXXX]
                                                              │
  ANAK (Smartphone/Laptop):                                   ▼
  [Buka Menu Keluarga] ──> [Pilih 'Saya Anak'] ──> [Masukkan Kode: FAM-XXXX] ──> [Terhubung Otomatis]
                                                              │
  ORANG TUA:                                                  ▼
  [Pantau Aktivitas Layar & Fokus Real-Time] ──> [Klik 'Cetak Laporan PDF Resmi']
```

### 4.3 Alur Guru & Siswa (*Education Mode*)
```
  GURU:  [Buat Ruang Kelas] ──> [Bagikan Kode Kelas]
                                       │
  SISWA: [Gabung dengan Kode] ──> [Isi Riwayat Belajar & Layar]
                                       │
  GURU:  [Evaluasi Kepatuhan Siswa] ──> [Cetak Laporan Akademik PDF]
```

---

## 5. Arsitektur Teknis & Teknologi

| Lapisan (*Layer*) | Teknologi yang Digunakan | Penjelasan |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** & **TypeScript 5.7** | Arsitektur modern berbasis komponen dengan keamanan tipe (*type-safe*) |
| **Build Tool & Bundler** | **Vite 6** | Kompilasi ultra-cepat dengan Hot Module Replacement (HMR) |
| **Styling & UI** | **Vanilla CSS Modern** & **Lucide React** | Desain SaaS premium, responsif mobile/desktop, tanpa framework CSS berlebih |
| **Database & Auth** | **Supabase (PostgreSQL)** | Layanan database cloud real-time dengan Row Level Security (RLS) |
| **Testing** | **Vitest** | Pengujian unit test untuk fungsi kalkulasi waktu dan integritas data |
| **Deployment** | **Vercel** | CI/CD otomatis, edge-network global, dan SSL otomatis |

---

## 6. Panduan Menjalankan Proyek Secara Lokal (*Local Setup*)

### Prasyarat
* [Node.js](https://nodejs.org/) versi 18 atau lebih tinggi
* Paket manajer `npm`

### Langkah-langkah Instalasi
1. **Kloning Repositori**:
   ```bash
   git clone https://github.com/haritsromadhon001/Time-Craft.git
   cd Time-Craft
   ```

2. **Pasang Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Lingkungan (`.env`)**:
   Salin berkas contoh konfigurasi lingkungan:
   ```bash
   cp .env.example .env
   ```
   Lengkapi kunci akses Supabase Anda pada `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Jalankan Server Pengembangan**:
   ```bash
   npm run dev
   ```
   Buka peramban di `http://localhost:5173`.

5. **Perintah Tersedia**:
   * `npm run dev` — Menjalankan development server lokal.
   * `npm run build` — Melakukan kompilasi produksi ke folder `dist`.
   * `npm run typecheck` — Memeriksa validasi tipe TypeScript (`tsc -b`).
   * `npm test` — Menjalankan rangkaian unit test otomatis (`vitest`).

---

## 7. Keamanan & Kebijakan Privasi

* **Isolasi Akun Penuh**: Setiap akun pengguna memiliki ruang penyimpanan privat yang terproteksi.
* **Pemrosesan Gambar di Sisi Klien**: Foto profil diproses secara lokal di peramban pengguna sebelum disimpan, memastikan efisiensi bandwidth dan kerahasiaan.
* **Bebas Pelacak & Iklan**: TimeCraft tidak memuat skrip analitik invasif pihak ketiga atau iklan yang mengganggu kenyamanan.
* **Format Cetak Aman**: Template cetak dokumen PDF dieksekusi secara lokal di peramban tanpa mengirim data sensitif ke server eksternal perender HTML.

---

## 8. Kontribusi & Lisensi

Proyek **TimeCraft** dikembangkan dan dikelola oleh **Fulan** bersama kontributor komunitas.

Proyek ini didistribusikan di bawah lisensi terbuka **[MIT License](LICENSE)**. Anda bebas untuk menggunakan, memodifikasi, dan mendistribusikan perangkat lunak ini untuk keperluan edukasi, komersial, maupun pengembangan lanjutan.

<div align="center">
  <sub>Dibangun dengan dedikasi untuk keseimbangan hidup dan produktivitas digital yang sehat.</sub>
</div>