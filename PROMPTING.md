# 🧭 PROMPTING.md — Panduan Rekayasa Prompt & Interaksi AI (TimeCraft)

Dokumen ini adalah buku panduan resmi (*Prompt Engineering & AI Collaboration Guide*) untuk pengembang, kontributor, dan pengguna saat berinteraksi dengan AI Agent (seperti **Antigravity**, **Claude**, **ChatGPT**, **Cursor**, maupun **Gemini**) dalam mengembangkan, memelihara, dan mengembangkan fitur pada platform **TimeCraft**.

---

## 📑 Daftar Isi

- [1. Filosofi Prompting TimeCraft](#1-filosofi-prompting-timecraft)
- [2. Kerangka Kerja ROCCV (Standard Prompt Structure)](#2-kerangka-kerja-roccv-standard-prompt-structure)
- [3. Aturan Emas TimeCraft (*Non-Negotiable Constraints*)](#3-aturan-emas-timecraft-non-negotiable-constraints)
- [4. Template Prompt Universal](#4-template-prompt-universal)
- [5. Katalog Master Prompt Siap Pakai](#5-katalog-master-prompt-siap-pakai)
  - [5.1 Desain & Antarmuka UI (Vanilla CSS & Visual Aesthetics)](#51-desain--antarmuka-ui-vanilla-css--visual-aesthetics)
  - [5.2 Logika Bisnis & Kalkulasi Waktu (Time Tracking & Anti-Collision)](#52-logika-bisnis--kalkulasi-waktu-time-tracking--anti-collision)
  - [5.3 Pomodoro & State Persistensi (Resilient Timer)](#53-pomodoro--state-persistensi-resilient-timer)
  - [5.4 Lapisan Data & Repository Pattern (Supabase & Offline Fallback)](#54-lapisan-data--repository-pattern-supabase--offline-fallback)
  - [5.5 Format Cetak PDF & Verifikasi Dokumen (A4 & Vector SVG)](#55-format-cetak-pdf--verifikasi-dokumen-a4--vector-svg)
  - [5.6 Pengujian Unit & QA (Vitest & DOM Testing)](#56-pengujian-unit--qa-vitest--dom-testing)
  - [5.7 Refaktorisasi, Kinerja & Debugging](#57-refaktorisasi-kinerja--debugging)
- [6. Studi Kasus Komparasi: Prompt Buruk vs Prompt Efektif](#6-studi-kasus-komparasi-prompt-buruk-vs-prompt-efektif)
- [7. Daftar Pantangan Prompting (*Prompting Anti-Patterns*)](#7-daftar-pantangan-prompting-prompting-anti-patterns)
- [8. Protokol Validasi Pasca-Prompting](#8-protokol-validasi-pasca-prompting)

---

## 1. Filosofi Prompting TimeCraft

TimeCraft dibangun dengan filosofi **"High-Aesthetics, Rock-Solid Architecture, Zero-Fluff Execution"**. Setiap prompt yang diajukan ke model AI harus mencerminkan standar rekayasa perangkat lunak produksi, bukan sekadar prototipe atau MVP generik.

Tujuan utama dari panduan ini:
1. **Meminimalkan Halusinasi AI**: Memastikan AI memahami batasan arsitektur (misal: Vanilla CSS, bukan Tailwind).
2. **Menghasilkan Kode Tuntas (*End-to-End Delivery*)**: Mencegah keluaran kode yang menyertakan placeholder `// TODO: implement later` atau mock yang terputus.
3. **Mempertahankan Integritas Ekosistem**: Memastikan tipe data selalu sinkron dengan [domain.ts](file:///src/types/domain.ts) dan pengujian selalu lulus di `vitest`.

---

## 2. Kerangka Kerja ROCCV (Standard Prompt Structure)

Untuk memperoleh hasil kode dengan presisi tinggi dari AI Agent, gunakan formula **ROCCV**:

```
[R] Role          : Peran spesifik yang harus diadopsi oleh AI
[O] Objective     : Sasaran tugas / fitur yang ingin diselesaikan
[C] Context       : Berkas terkait, arsitektur yang berlaku, dan kondisi saat ini
[C] Constraints   : Batasan teknis mutlak (aturan CSS, tipe data, larangan pustaka baru)
[V] Verification  : Langkah pengujian mandiri untuk memverifikasi kebenaran kode
```

### Penjelasan Elemen ROCCV:
* **Role**: Beritahu AI bahwa ia bertindak sebagai *Senior React 19 & TypeScript Engineer* dengan spesialisasi arsitektur bersih dan estetika antarmuka modern.
* **Objective**: Jelaskan fungsi baru apa yang diinginkan secara detail dan terukur.
* **Context**: Cantumkan berkas target seperti `src/services/repository.ts` atau `src/styles/global.css`.
* **Constraints**: Tegaskan larangan (tanpa Tailwind, tanpa tipe `any`, tanpa pemanggilan Supabase langsung dari komponen UI).
* **Verification**: Instruksikan AI untuk menjalankan `npm run typecheck`, `npm test`, dan `npm run build`.

---

## 3. Aturan Emas TimeCraft (*Non-Negotiable Constraints*)

Pastikan prompt Anda selalu selaras dengan aturan yang tertuang dalam [AGENTS.md](file:///AGENTS.md):

| Area | Aturan Mutlak | Alasan Teknis |
| :--- | :--- | :--- |
| **Styling** | **Murni Vanilla CSS** di [src/styles/global.css](file:///src/styles/global.css). Dilarang TailwindCSS / UI Library pihak ketiga. | Kontrol estetika maksimal, performa bundle ringan, isolasi CSS tokens (`var(--...)`). |
| **TypeScript** | **Strict TypeScript (0 errors)**. Dilarang menggunakan `any`. | Menghindari runtime bug; gunakan tipe dari [domain.ts](file:///src/types/domain.ts). |
| **Data Layer** | **Repository Pattern**. Jangan panggil `supabase.from(...)` di dalam komponen UI. | Memusatkan query di [repository.ts](file:///src/services/repository.ts) dan menjamin *offline fallback*. |
| **State** | **React Context** terpusat di [AppContext.tsx](file:///src/context/AppContext.tsx). | State reaktif global untuk sesi login, mode tema, timer pomodoro, dan preferensi. |
| **Dokumentasi** | **Format Cetak Laporan A4** berstandar `@page { size: A4 portrait; }` dengan logo inline SVG murni. | Laporan TimeCraft harus tajam, siap cetak dari HP maupun laptop tanpa dependensi jaringan eksternal. |
| **Testing** | **Vitest 100% Pass**. Pengujian durasi waktu dan anti-tabrakan waktu wajib lulus. | Mencegah anomali waktu overlap pada pencatatan aktivitas. |

---

## 4. Template Prompt Universal

Gunakan template serbaguna berikut untuk memulai tugas baru:

```markdown
Bertindaklah sebagai Senior Full-Stack Engineer & Vibecoder untuk TimeCraft (React 19 + TypeScript + Vite + Supabase + Vanilla CSS).

**Objektif:**
[Deskripsikan fitur atau perbaikan yang ingin dibuat]

**Konteks Berkas:**
- Halaman target: `src/pages/[NamaHalaman].tsx`
- Komponen pendukung: `src/components/ui/[NamaKomponen].tsx`
- Lapisan data: `src/services/repository.ts`
- Gaya visual: `src/styles/global.css`

**Batasan Teknis:**
1. Gunakan HANYA Vanilla CSS dengan CSS variables yang ada di `global.css`. JANGAN menambahkan TailwindCSS atau UI libraries luar.
2. Tipe data harus ketat (Strict TypeScript) merujuk pada `src/types/domain.ts`. Tidak boleh ada `any`.
3. Seluruh interaksi data database harus melalui `repository.ts` dengan penanganan offline fallback.
4. Pertahankan semua komentar, docstrings, dan pengujian yang sudah ada.

**Verifikasi:**
Setelah perubahan selesai, jalankan validasi:
1. `npm run typecheck`
2. `npm test`
3. `npm run build`
Pastikan semuanya 0 errors dan lulus 100%.
```

---

## 5. Katalog Master Prompt Siap Pakai

Berikut adalah daftar prompt siap pakai (*copy-paste ready*) yang telah disesuaikan dengan arsitektur TimeCraft:

### 5.1 Desain & Antarmuka UI (Vanilla CSS & Visual Aesthetics)

#### Prompt: Membuat / Mempercantik Komponen UI Baru
```markdown
Bertindaklah sebagai Ahli Desain UI/UX & Frontend Engineer TimeCraft.
Saya ingin menambahkan komponen baru: `StatComparisonBadge` di `src/components/ui/StatComparisonBadge.tsx`.

Kebutuhan:
1. Menampilkan komparasi persentase produktivitas hari ini vs kemarin (misal: "+12% lebih produktif").
2. Dukungan visual berupa badge dengan warna cerdas:
   - Hijau zamrud (emerald) dengan background transparan lembut untuk kenaikan positif.
   - Merah koral lembut untuk penurunan.
   - Abu-abu netral untuk perubahan stabil (0%).
3. Tambahkan ikon panah dinamis (menggunakan `lucide-react`).
4. Aturan CSS:
   - Tambahkan class `.stat-comparison-badge` di `src/styles/global.css`.
   - Gunakan CSS variables yang sudah ada (`--card-bg`, `--text-primary`, `--success`, `--danger`, dsb).
   - Pastikan tampil menawan di mode gelap (Midnight Focus) maupun mode terang.
5. Jalankan `npm run typecheck` dan `npm run build` untuk memverifikasi.
```

---

### 5.2 Logika Bisnis & Kalkulasi Waktu (Time Tracking & Anti-Collision)

#### Prompt: Menambahkan Validasi Anti-Tumpang Tindih Waktu (*Anti-Collision*)
```markdown
Bertindaklah sebagai Logic Specialist TimeCraft.
Periksa fungsi validasi pencatatan log waktu layar di `src/utils/timeCalculations.ts` dan integrasinya di `src/pages/TrackerPage.tsx`.

Kebutuhan:
1. Pastikan pengguna tidak dapat menyimpan log waktu yang bertabrakan (*overlap*) dengan log waktu yang sudah ada pada tanggal yang sama.
2. Buat fungsi murni `checkTimeCollision(newEntry: { startTime: string, endTime: string, date: string }, existingEntries: ScreenTimeEntry[]): { hasCollision: boolean; conflictingEntry?: ScreenTimeEntry }`.
3. Berikan pesan kesalahan yang informatif dan ramah dalam bahasa Indonesia jika terjadi tabrakan waktu (misal: "Waktu ini tumpang tindih dengan aktivitas 'Belajar & Kuliah' (14:00 - 15:30)").
4. Tambahkan unit test baru di `src/tests/timeCalculations.test.ts` untuk menguji skenario tabrakan penuh, tabrakan sebagian (awal/akhir), dan rentang waktu yang valid.
5. Verifikasi dengan menjalankan `npm test`.
```

---

### 5.3 Pomodoro & State Persistensi (Resilient Timer)

#### Prompt: Memperkuat Ketahanan Pengatur Waktu Fokus
```markdown
Bertindaklah sebagai Frontend Architect TimeCraft.
Optimalkan modul Pomodoro Focus Timer pada `src/context/AppContext.tsx` dan `src/pages/FocusPage.tsx`.

Kebutuhan:
1. Pastikan hitung mundur timer tetap akurat meskipun pengguna me-refresh halaman, berganti rute aplikasi, atau browser berpindah tab (background throttle).
2. Simpan timestamp target akhir (`targetEndTime = Date.now() + remainingSeconds * 1000`) di `localStorage`, bukan sekadar mengandalkan `setInterval` interval 1 detik murni.
3. Saat komponen me-mount kembali, kalkulasikan sisa waktu secara matematis berdasarkan selisih waktu sekarang dengan `targetEndTime`.
4. Jika waktu habis saat pengguna membuka kembali tab, picu notifikasi suara lembut / dialog penyelesaian fokus secara anggun.
5. Pastikan tipe data timer konsisten di `src/types/domain.ts` dan jalankan `npm run typecheck`.
```

---

### 5.4 Lapisan Data & Repository Pattern (Supabase & Offline Fallback)

#### Prompt: Menambah Endpoint Repository dengan Fallback Offline
```markdown
Bertindaklah sebagai Database & Backend Specialist TimeCraft.
Tambahkan operasi baru untuk "Catatan Jurnal Refleksi Mingguan" di `src/services/repository.ts`.

Kebutuhan:
1. Tambahkan fungsi repository:
   - `saveWeeklyReflection(reflection: WeeklyReflection): Promise<RepositoryResult<WeeklyReflection>>`
   - `getWeeklyReflections(userId: string): Promise<RepositoryResult<WeeklyReflection[]>>`
2. Pastikan arsitektur mendukung Resilient Offline Fallback:
   - Jika Supabase online: simpan ke tabel PostgreSQL Supabase `weekly_reflections`, lalu cadangkan ke `localStorage`.
   - Jika Supabase offline atau jaringan terputus: simpan langsung ke `localStorage`, sertakan flag status `is_synced: false`, dan kembalikan response sukses dengan indikator offline.
3. Jangan pernah membocorkan query mentah Supabase ke dalam komponen UI.
4. Perbarui kontrak tipe di `src/types/domain.ts` jika diperlukan.
5. Jalankan `npm run typecheck` dan `npm test`.
```

---

### 5.5 Format Cetak PDF & Verifikasi Dokumen (A4 & Vector SVG)

#### Prompt: Mengoptimalkan Template Dokumen Laporan PDF Resmi
```markdown
Bertindaklah sebagai Document Styling & Print Media Expert TimeCraft.
Buka `src/pages/ReportPage.tsx` dan bagian `@media print` di `src/styles/global.css`.

Kebutuhan:
1. Pastikan tata letak cetak mematuhi standar internasional `@page { size: A4 portrait; margin: 12mm 15mm; }`.
2. Logo TimeCraft wajib berupa **inline SVG vektor murni** (tanpa memuat URL gambar eksternal) agar tampil tajam dan tidak pecah pada printer resolusi 300+ DPI.
3. Sembunyikan elemen non-cetak (tombol filter, navigasi sidebar, widget kontak mengambang) dengan kelas `.no-print`.
4. Tambahkan footer verifikasi resmi:
   - Cap digital TimeCraft Verified Report.
   - Timestamp pencetakan otomatis (zona waktu lokal).
   - Tanda tangan digital hash unik singkat untuk integritas data.
5. Uji bahwa tampilan cetak dari browser HP maupun desktop tetap menghasilkan 1 lembar A4 proporsional (atau multi-halaman tanpa halaman kosong berlebih).
```

---

### 5.6 Pengujian Unit & QA (Vitest & DOM Testing)

#### Prompt: Menulis Test Suite Komprehensif
```markdown
Bertindaklah sebagai Quality Assurance & Test Engineer TimeCraft.
Buat berkas pengujian baru di `src/tests/productivityScore.test.ts`.

Kebutuhan:
1. Uji fungsi kalkulasi skor produktivitas harian di `src/utils/analyticsCalculations.ts`.
2. Skenario uji wajib:
   - Pengguna dengan 100% aktivitas produktif (skor harus mendekati atau sama dengan 100).
   - Pengguna dengan mayoritas waktu di media sosial/game (skor harus proporsional rendah).
   - Pengguna tanpa data aktivitas sama sekali (harus menghasilkan skor `null` atau `N/A`, BUKAN angka 0 palsu).
   - Skenario waktu melewati tengah malam (misal 23:30 - 01:15).
3. Gunakan `vitest` dan assertion dari `@testing-library/jest-dom`.
4. Jalankan `npm test` dan pastikan semua skenario lulus (100% pass).
```

---

### 5.7 Refaktorisasi, Kinerja & Debugging

#### Prompt: Mengatasi Re-render Berlebih pada React Context
```markdown
Bertindaklah sebagai Performance Tuning Specialist React 19.
Analisis alur rendering di `src/context/AppContext.tsx` dan konsumsinya di halaman `DashboardPage.tsx` dan `TrackerPage.tsx`.

Kebutuhan:
1. Identifikasi apakah perubahan state timer pomodoro memicu render ulang yang tidak perlu pada daftar riwayat aktivitas harian.
2. Pisahkan context yang sangat sering berubah (seperti timer detik) dari context data statis (profil pengguna, riwayat log) jika diperlukan, atau manfaatkan `useCallback`, `useMemo`, dan seleksi state terfokus.
3. Pastikan tidak ada kebocoran memori (*memory leak*) pada listener resize atau timer interval.
4. Verifikasi bahwa waktu muat dan responsivitas interaksi tetap instan (60 FPS).
5. Jalankan `npm run typecheck` dan `npm run build`.
```

---

## 6. Studi Kasus Komparasi: Prompt Buruk vs Prompt Efektif

Berikut contoh perbandingan nyata yang membedakan prompt yang menghasilkan bug/rework dengan prompt yang langsung menghasilkan kode berkualitas produksi:

### Kasus: Menambahkan Filter Kategori pada Riwayat Log

#### ❌ Prompt Buruk (Vague & Ambiguous)
> *"Tolong buatin filter kategori dong di halaman tracker biar bisa milih kategori belajar atau hiburan. Pake tailwind aja biar cepet."*

**Dampak Buruk:**
* AI akan menginstal atau menyisipkan kelas TailwindCSS yang bertentangan dengan aturan [AGENTS.md](file:///AGENTS.md) dan merusak tema Vanilla CSS.
* Tidak ada panduan tipe data, sehingga AI berisiko menggunakan string liar atau `any`.
* Tidak ada instruksi penanganan data offline atau pengujian.

---

#### ✅ Prompt Efektif (Precise & Architecture-Aware)
> *"Sebagai Frontend Engineer TimeCraft, tambahkan filter kategori interaktif pada daftar riwayat di `src/pages/TrackerPage.tsx`.*
> 
> *Kebutuhan:*
> 1. *Gunakan tipe `ActivityCategory` yang sudah ada di `src/types/domain.ts`.*
> 2. *Tampilkan pills filter horizontal ('Semua', 'Belajar & Kuliah', 'Pekerjaan', 'Media Sosial', 'Hiburan', 'Game', 'Lainnya').*
> 3. *Styling: Tambahkan class `.category-filter-chip` di `src/styles/global.css` menggunakan CSS variables (`--surface-elevated`, `--primary`, `--border-color`). Pastikan terdapat animasi hover dan status aktif yang kontras.*
> 4. *Jangan gunakan TailwindCSS. Pertahankan arsitektur Vanilla CSS murni.*
> 5. *Pastikan jika tidak ada log pada kategori yang dipilih, tampilkan empty-state yang estetis (ikon Lucide `Inbox` + teks informatif).*
> 6. *Validasi dengan `npm run typecheck` dan `npm run build`."*

**Hasil:**
* Kode langsung cocok dengan sistem desain, rapi, aman dari sisi tipe data TypeScript, dan bebas regresi.

---

## 7. Daftar Pantangan Prompting (*Prompting Anti-Patterns*)

Hindari instruksi-instruksi berikut saat menyusun prompt untuk TimeCraft:

1. 🚫 **Meminta Pustaka Styling Eksternal**:
   - *Jangan:* "Pasang Tailwind / Bootstrap / Chakra UI / MUI."
   - *Seharusnya:* "Gunakan CSS Variables di `src/styles/global.css`."
2. 🚫 **Meminta Supabase Langsung di Komponen**:
   - *Jangan:* "Panggil `supabase.from('screen_time_entries').insert(...)` di `TrackerPage.tsx`."
   - *Seharusnya:* "Tambahkan method di `src/services/repository.ts` dan panggil dari komponen."
3. 🚫 **Mengabaikan Kondisi Data Kosong**:
   - *Jangan:* "Jika data kosong, tampilkan angka 0."
   - *Seharusnya:* "Bedakan nilai `null` (belum ada pencatatan) dengan nilai `0` (sudah dicatat tapi durasi 0)."
4. 🚫 **Menggunakan Tipe Data `any`**:
   - *Jangan:* "Biar cepat, gunakan tipe `any` dulu."
   - *Seharusnya:* "Definisikan interface lengkap di `src/types/domain.ts`."
5. 🚫 **Meminta URL Gambar Eksternal untuk Cetak**:
   - *Jangan:* "Gunakan tag `<img src='https://imgur.com/...' />` untuk logo di cetak PDF."
   - *Seharusnya:* "Gunakan inline SVG vektor agar tahan luring (*offline-resilient*) dan tajam di resolusi tinggi."

---

## 8. Protokol Validasi Pasca-Prompting

Setelah AI Agent selesai menulis atau mengubah kode berdasarkan prompt Anda, wajib jalankan siklus 4 langkah validasi:

```bash
# Langkah 1: Pengecekan Integritas Tipe Data TypeScript
npm run typecheck
# Target: 0 errors

# Langkah 2: Eksekusi Test Suite Vitest
npm test
# Target: Semua test suite lulus (100% passing)

# Langkah 3: Uji Build Produksi Vite
npm run build
# Target: Berhasil membuat bundle di dist/ tanpa error

# Langkah 4: Simpan dan Deploy Otomatis
git add .
git commit -m "feat/fix: ringkasan perubahan sesuai prompt"
git push origin main
```

---

<div align="center">
  <sub>Dokumen resmi panduan rekayasa prompt TimeCraft. Dipelihara bersama oleh Core Engineering Team & AI Agents.</sub>
</div>
