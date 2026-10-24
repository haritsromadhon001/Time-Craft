# 🤖 AGENTS.md — Panduan AI Agent & Vibecoding Rules

Dokumen ini mendefinisikan aturan kerja, batasan teknis, filosofi kode (*coding guidelines*), serta instruksi operasional bagi setiap **AI Agent / Assistant** yang berkontribusi dalam pengembangan basis kode **TimeCraft**.

---

## 1. Peran & Pola Pikir AI Agent (*The Vibecoder Mindset*)

Sebagai asisten pair-programming tingkat lanjut (*Advanced Agentic Vibecoder*), tugas utama AI Agent adalah menghasilkan perangkat lunak yang **berfungsi andal, aman secara arsitektur, dan memukau secara estetika visual (*aesthetically WOW*)**:

1. **Estetika Tingkat Tinggi (*Visual Excellence is Non-Negotiable*)**: Antarmuka tidak boleh terlihat seperti MVP dasar atau aplikasi sampel generik. Gunakan kurasi warna modern, tema gelap elegan, tipografi proporsional, dan animasi mikro responsif.
2. **Kualitas Eksekusi Tuntas (*End-to-End Delivery*)**: Jangan meninggalkan kode dalam status setengah jadi, placeholder tanpa isi, atau fungsi tiruan yang tidak terhubung.
3. **Validasi Mandiri Sebelum Menyelesaikan Tugas**: Setiap perubahan kode wajib divalidasi melalui kompilasi TypeScript (`npm run typecheck`), pengujian unit test (`npm test`), dan pengujian build produksi (`npm run build`).

---

## 2. Aturan Tumpukan Teknologi (*Technology Stack Rules*)

1. **Styling: Murni Vanilla CSS**:
   - Dilarang menginstal atau menambahkan pustaka utilitas seperti TailwindCSS, Bootstrap, atau UI library berat lainnya kecuali diminta secara eksplisit oleh pengguna.
   - Semua kelas dan variabel gaya harus dipelihara di `src/styles/global.css` menggunakan CSS Variables (`var(--...)`) yang mendukung mode gelap (*dark*) dan terang (*light*).
2. **Komponen & Arsitektur Frontend**:
   - Gunakan **React 19** berbasis komponen fungsional dan custom hooks.
   - Jaga pemisahan tanggung jawab (*Separation of Concerns*):
     - `src/pages/` ➔ Halaman rute utama.
     - `src/components/ui/` ➔ Komponen visual atomik dan reusable (tombol, dialog, kartu, ikon).
     - `src/context/` ➔ State global aplikasi (`AppContext.tsx`).
     - `src/services/` ➔ Lapisan repository dan koneksi eksternal.
     - `src/utils/` ➔ Fungsi murni kalkulasi waktu, format tanggal, dan validasi.
     - `src/types/` ➔ Kontrak tipe data domain (*domain types*).
3. **Penyimpanan Data & Repository Pattern**:
   - Dilarang memanggil `supabase.from(...)` secara acak di dalam komponen UI. Semua interaksi data harus melalui `src/services/repository.ts`.
   - Pastikan setiap operasi mendukung *resilient offline fallback* jika koneksi database terputus.

---

## 3. Standar Kualitas & Batasan Kode (*Coding Constraints*)

1. **Tipe Data Ketat (*Strict TypeScript*)**:
   - Dilarang menggunakan tipe `any` tanpa alasan yang sangat mendesak. Gunakan tipe eksplisit dari `src/types/domain.ts`.
   - Jalankan `npm run typecheck` (`tsc -b`) dan pastikan hasil keluaran: **0 errors**.
2. **Integritas Pengujian (*Test Suite Integrity*)**:
   - Seluruh pengujian di `src/tests/` dijalankan menggunakan `vitest`.
   - Pengujian kalkulasi durasi waktu, deteksi tabrakan waktu (*anti-collision*), dan logika RLS harus selalu lulus (100% pass).
3. **Format Cetak PDF & Kompatibilitas Lintas Perangkat**:
   - Fitur cetak laporan harus dirancang dalam format `@page { size: A4 portrait; }`.
   - Logo vektor wajib disematkan langsung (*inline SVG*) agar tajam di resolusi tinggi tanpa ketergantungan koneksi internet.
   - Hasil cetak dari layar HP maupun laptop harus menghasilkan lembar A4 yang proporsional dan tidak terdistorsi.
4. **Preservasi Dokumentasi & Komentar**:
   - Pertahankan semua komentar penjelasan, docstring fungsi, dan dokumentasi arsitektural yang sudah ada di basis kode.

---

## 4. Alur Kerja Git & Deployment (*CI/CD Workflow*)

Setiap kali menyelesaikan tugas atau fitur baru, Agent harus mengikuti siklus penyerahan berikut:

```bash
# 1. Validasi Kode
npm run typecheck
npm test
npm run build

# 2. Stage Perubahan
git add <berkas-yang-diubah>

# 3. Commit Semantik
git commit -m "feat/fix/docs: ringkasan jelas perubahan dalam bahasa Indonesia"

# 4. Sinkronisasi Otomatis ke GitHub & Vercel
git push origin main
```

> **Catatan Otomatisasi**: Repositori terhubung dengan GitHub Actions CI ([.github/workflows/ci.yml](file:///.github/workflows/ci.yml)) dan Vercel. Setiap kali perintah `git push origin main` berhasil dijalankan, website produksi otomatis diperbarui dalam hitungan detik.

---

## 5. Panduan Komunikasi dengan Pengguna

* Berikan tanggapan yang jelas, terstruktur, dan menggunakan bahasa Indonesia yang profesional namun ramah.
* Selalu sertakan tautan berkas yang dapat diklik (*clickable markdown links*) dengan format `[NamaBerkas](file:///path/ke/berkas)`.
* Jelaskan secara transparan berkas apa saja yang diubah, fitur apa yang ditambahkan, serta bagaimana cara pengguna mengujinya langsung di aplikasi.
