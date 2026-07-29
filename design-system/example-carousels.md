# Carousel Content — JWT Bukan Enkripsi

## Content Info
- Format:    Carousel Slide
- Platform:  Instagram & TikTok (1080×1350)
- Total Slides:  8
- Audience:  Junior developer / self-taught programmer yang baru belajar auth & JWT
- Goal:      Saves / Awareness
- Tone:      Casual Indonesian, first-person "saya", senior-dev-to-junior, sedikit opinionated

---

# Slide 1 — Cover

## Eyebrow
Miskonsepsi JWT

## Headline
JWT Itu Bukan **Enkripsi**.

## Description
Banyak developer pikir data di dalam JWT itu aman karena "udah di-encode."

Padahal payload-nya bisa dibaca siapa aja tanpa perlu secret key.

Saya bahas kenapa JWT itu soal integrity, bukan confidentiality — dan apa yang harus kamu lakuin.

## Highlight
Payload JWT cuma di-encode, bukan dienkripsi.

## Visual Direction
- Icon: lucide:key
- Accent Color: Sky

---

# Slide 2 — Problem

## Page Counter
01 / 08

## Eyebrow
Kenapa Ini Penting

## Headline
Encode **Bukan** Berarti Aman.

## Description
Base64 itu encoding, bukan encryption. Encoding cuma ubah format — semua orang bisa decode balik dalam sekejap.

Masalahnya, banyak yang taruh data sensitif langsung di payload JWT: email, role, bahkan reset token.

Padahal siapa aja yang pegang token itu bisa buka isinya.

## Highlight
Base64 encode ≠ enkripsi. Decode-nya cuma satu baris kode.

## Visual Direction
- Icon: lucide:unlock
- Accent Color: Red

---

# Slide 3 — Point #1 (Mockup: Terminal)

## Page Counter
02 / 08

## Eyebrow
Point #1

## Headline
Payload JWT **Kebaca** Semua Orang.

## Description
Decode payload-nya pakai atob() aja, nggak butuh secret key sama sekali.

## Mockup Role
Terminal — decoded JWT payload, no secret needed

## Catatan
Signature valid ≠ isi datanya rahasia.

## Visual Direction
- Icon: lucide:terminal
- Accent Color: Sky

---

# Slide 4 — Point #2

## Page Counter
03 / 08

## Eyebrow
Point #2

## Headline
Signature Itu Soal **Integrity**.

## Description
Signature di JWT cuma buktiin token itu nggak diubah-ubah setelah di-generate server.

Dia nggak nyembunyiin isi payload dari mata orang lain — itu bukan tujuannya.

Jadi signature valid bukan berarti data di dalamnya rahasia.

## Highlight
Verify, bukan Encrypt — signature membuktikan keaslian, bukan menyembunyikan isi.

## Visual Direction
- Icon: lucide:shield-check
- Accent Color: Mint

---

# Slide 5 — Point #3

## Page Counter
04 / 08

## Eyebrow
Point #3

## Headline
Jangan Taruh **Rahasia** di Payload.

## Description
Password, API key, atau data pribadi sensitif — semua itu nggak boleh nangkring di payload JWT.

Token ini biasanya kesimpen di localStorage, cookie, bahkan log server — makin banyak titik bocor.

Anggap aja payload JWT itu kartu nama, bukan brankas.

## Highlight (Dark Callout)
Butuh kerahasiaan? Itu tugas enkripsi (JWE), bukan JWT biasa (JWS).

## Visual Direction
- Icon: lucide:alert-triangle
- Accent Color: Red

---

# Slide 6 — Comparison (Mockup: Comparison Bars)

## Page Counter
05 / 08

## Eyebrow
Perbandingan

## Headline
Encoding **vs** Enkripsi.

## Description
Base64 gampang dibalikin. Enkripsi butuh key buat baca isinya lagi.

## Mockup Role
Comparison Bars — panel kiri "Base64 Encoding" (loser), panel kanan "Enkripsi (JWE/AES)" (winner)

## Catatan
JWT standar itu encoding + signing, bukan encryption.

## Visual Direction
- Icon: lucide:scale
- Accent Color: Violet

---

# Slide 7 — Solution

## Page Counter
06 / 08

## Eyebrow
Biar Nggak Salah Pakai

## Headline
3 Langkah **Aman** Pakai JWT.

## Step 1
Jangan taruh data sensitif di payload.
Simpan cuma ID atau claim publik, misal role atau expiry.

## Step 2
Selalu pakai HTTPS.
Supaya token nggak gampang dicegat pas dikirim antar client-server.

## Step 3
Butuh kerahasiaan? Pakai JWE.
Kalau payload-nya emang harus rahasia, ganti ke JSON Web Encryption, bukan JWS biasa.

## Visual Direction
- Icon: lucide:shield-check
- Accent Color: Amber

---

# Slide 8 — Outro

## Page Counter
07 / 08

## Eyebrow
Kesimpulan

## Headline
JWT Soal **Kepercayaan**, Bukan Rahasia.

## Description
Verifikasi keaslian token — itu kerjaan JWT.

Melindungi isi data — itu kerjaan enkripsi, beda cerita.

## Highlight
Paham bedanya = auth system kamu lebih aman.
Share ke tim biar nggak ada yang salah taruh data sensitif di JWT lagi.

## Visual Direction
- Icon: lucide:check-circle
- Accent Color: Violet

---

# Caption
JWT itu bukan enkripsi. 🔑
Payload-nya bisa dibaca siapa aja tanpa secret key — signature cuma buktiin token nggak diubah, bukan nyembunyiin isinya.

Save biar nggak lupa. Comment kalau tim kamu pernah taruh data sensitif di JWT payload 👀

# Hashtag
#jwt #webdev #backend #softwareengineer #vourdev