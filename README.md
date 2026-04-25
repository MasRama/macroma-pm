# Macroma PM

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Built with Nara](https://img.shields.io/badge/built%20with-Nara-6366f1)](https://github.com/MasRama/nara)

> Project management buat tim yang serius soal versi.
> Kanban board + version control per task + batch release tracking, semua dalam satu tempat.

## Apa itu Macroma PM?

Macroma PM adalah aplikasi manajemen project berbasis web yang dirancang khusus untuk tim yang butuh **kejelasan riwayat pekerjaan**. Bukan cuma drag-and-drop kartu, tiap perubahan task punya nomor versi, catatan, dan jejak siapa yang melakukannya — jadi diskusi sama klien atau review internal jadi jauh lebih mudah.

## Fitur Utama

- **Kanban Board** — empat kolom (Backlog, On Going, Revisi, Done) dengan drag-and-drop yang halus.
- **Version Control per Task** — tiap kali task dipindah atau diupdate, versinya otomatis naik (`v1.2.3`) dan log-nya tersimpan permanen.
- **Batch Release** — kelompokkan task ke dalam batch (misal `v1.0`, `v2.0`) untuk tracking release.
- **Workspace & Project** — atur project dalam workspace, undang anggota, kelola akses per workspace.
- **Komentar di Task** — diskusi langsung di dalam detail task, lengkap dengan avatar dan timestamp.
- **Tab Version History** — lihat seluruh riwayat perubahan task dengan badge versi & catatan.
- **Activity Feed** — pantau apa yang terjadi di project secara real-time.
- **Workspace Chat** — chat antar anggota workspace tanpa keluar dari aplikasi.
- **Notifikasi & Undangan** — sistem invite untuk workspace dan notifikasi terpusat.
- **Login Google** — masuk cepat lewat Google OAuth atau email/password biasa.
- **Dashboard** — ringkasan jumlah workspace, project, dan task per status dalam satu pandangan.

## Teknologi

Macroma PM dibangun di atas **[Nara](https://github.com/MasRama/nara)** — framework TypeScript full-stack yang menggabungkan HyperExpress, Svelte 5, dan Inertia.js. Database menggunakan SQLite dengan Knex sebagai query builder.

## Menjalankan Lokal

Butuh Node.js >= 20.

```bash
# Install dependency
npm install

# Setup environment
cp .env.example .env

# Migrasi database
node nara db:migrate

# Jalankan dev server
npm run dev
```

Aplikasi jalan di `http://localhost:5555`.

## Build untuk Production

```bash
npm run build
npm start
```

## Lisensi

MIT — lihat [LICENSE](./LICENSE).

---

Dibuat dengan ❤️ oleh [MasRama](https://github.com/MasRama) · Built with [Nara](https://github.com/MasRama/nara)
