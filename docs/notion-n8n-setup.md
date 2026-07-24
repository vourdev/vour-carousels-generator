# Panduan Integrasi Notion & n8n Automation

Dokumen ini menjelaskan langkah-langkah setup integrasi Notion menggunakan **Internal Integration Token** (`NOTION_TOKEN`) dan **n8n** untuk memicu pembuatan carousel otomatis di [https://vour-carousels-generator.vercel.app/](https://vour-carousels-generator.vercel.app/).

---

## Langkah 1: Buat Notion Integration & Dapatkan `NOTION_TOKEN`

1. Masuk ke dashboard integrasi Notion di [notion.so/my-integrations](https://www.notion.so/my-integrations).
2. Klik tombol **+ New integration**.
3. Beri nama integrasi Anda (misal: `Vour Carousels Automation`).
4. Pilih workspace yang sesuai, lalu klik **Submit**.
5. Di tab **Secrets**, klik **Show** lalu salin **Internal Integration Token**. Token ini adalah `NOTION_TOKEN` Anda.

---

## Langkah 2: Buat Database Notion & Hubungkan Integrasi

1. Buat halaman baru di Notion, lalu buat database berbentuk **Table** atau **Board**.
2. Konfigurasikan dua kolom (properties) berikut:
   * **`Topic`** (Tipe data: **Title**) -> Menyimpan topik konten yang akan dibuat.
   * **`Status`** (Tipe data: **Select** atau **Status**) -> Tambahkan opsi opsi: `"Ready"` (untuk memicu antrean) dan `"Scheduled"` (setelah sukses dibuat).
3. **PENTING: Hubungkan integrasi ke database tersebut:**
   * Di sudut kanan atas halaman database Notion Anda, klik tombol menu tiga titik (**...**).
   * Gulir ke bawah ke bagian **Connections**, klik **Add connections**.
   * Cari nama integrasi Anda (misal: `Vour Carousels Automation`) lalu hubungkan.
   * *Tanpa langkah ini, n8n tidak akan bisa membaca database Anda (akan muncul error 404/403).*

---

## Langkah 3: Konfigurasi Kredensial di n8n

1. Buka dashboard n8n Anda.
2. Masuk ke menu **Credentials** -> Klik **Add Credential**.
3. Cari **Notion API**, pilih jenis autentikasi **Internal Integration Token**.
4. Tempelkan `NOTION_TOKEN` yang Anda salin pada Langkah 1 ke kolom **Internal Integration Token** lalu simpan.

---

## Langkah 4: Impor & Aktifkan Workflow di n8n

1. Salin seluruh isi berkas workflow JSON berikut: [n8n-carousel-notion-workflow.json](file:///Users/zero/Projects/vour-carousels/n8n-carousel-notion-workflow.json).
2. Buat workflow baru di n8n, lalu **Paste** (`Ctrl+V` atau `Cmd+V`) langsung ke canvas editor n8n Anda.
3. Klik node **Notion (Get Next Topic)**:
   * Pilih kredensial Notion yang telah Anda buat di Langkah 3.
   * Pada kolom **Database ID**, pilih database Notion yang telah Anda buat di Langkah 2.
4. Klik node **Notion (Update Status to Scheduled)**:
   * Pastikan kredensial dan database yang sama telah dipilih.
5. Klik node **HTTP Request (Vour API)**:
   * Endpoint otomatisasi mengarah ke: `https://vour-carousels-generator.vercel.app/api/n8n-generate`.
   * Header `x-api-key` menggunakan nilai `BETTER_AUTH_SECRET` dari berkas `.env` Anda.
6. Aktifkan workflow dengan menggeser toggle di pojok kanan atas ke **Active**.

---

## Langkah 5: Cara Kerja Otomatisasi (Midnight Run)

Setiap hari tepat pada pukul **12:00 malam (00:00)**:
1. n8n akan memeriksa database Notion Anda.
2. Jika ada baris konten berstatus `"Ready"`, n8n akan mengambil topiknya.
3. n8n mengirim POST request membawa topik tersebut ke API Vour di Vercel.
4. Vour API akan otomatis menghasilkan **2 Carousel** (Panduan Praktis pada jam 12:00 siang & Deep Dive pada jam 12:30 siang hari yang sama), mengunggah ke Cloudinary, dan menjadwalkannya langsung di Buffer.
5. n8n memperbarui status halaman Notion tersebut menjadi `"Scheduled"`.
