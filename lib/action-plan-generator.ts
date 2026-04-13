/**
 * Action Plan Generator
 * Creates weekly intervention plans based on assessment data
 * Each week provides different activities to ensure progression
 */

import type { ChallengeType } from "@/lib/enums";

export interface PlanActivity {
  title: string;
  description: string;
  domain: string; // DevelopmentDomain enum value
  dayOfWeek: number | null; // null = any day
}

export interface GeneratedPlan {
  title: string;
  domain: string;
  goalText: string;
  activities: PlanActivity[];
}

// ─────────────────────────────────────────────
// Multi-week plans per challenge type
// Each challenge has 4 weeks of progressive activities
// ─────────────────────────────────────────────

const ACTIVITIES_BY_CHALLENGE: Record<ChallengeType, GeneratedPlan[]> = {
  COMMUNICATION_ISSUES: [
    // Week 1: Foundation — build basic communication habits
    {
      title: "Stimulasi Bahasa Dasar",
      domain: "COMMUNICATION",
      goalText: "Membangun fondasi komunikasi melalui aktivitas narasi dan respons sederhana.",
      activities: [
        { title: "Narasi Aktivitas Pagi", description: "Ceritakan setiap aktivitas pagi anak dengan kalimat sederhana: 'Kita mandi. Air hangat. Pakai baju biru.' Tunggu 3-5 detik untuk respons anak.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Baca Cerita Interaktif", description: "Bacakan cerita bergambar 10-15 menit. Tunjuk gambar, tanya 'Apa ini?', beri jeda untuk anak merespons. Ulangi kata kunci 3x.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Bernyanyi Bersama", description: "Nyanyikan lagu anak-anak favorit. Berhenti di tengah lirik, tunggu anak melengkapi. Gunakan gerakan tangan untuk mendukung pemahaman.", domain: "COMMUNICATION", dayOfWeek: 1 },
        { title: "Bermain Peran Sederhana", description: "Main dokter-dokteran, masak-masakan, atau toko-tokoan. Model kalimat sederhana yang bisa ditiru anak.", domain: "COMMUNICATION", dayOfWeek: 3 },
        { title: "Waktu Bermain Sosial", description: "Atur playdate dengan 1 teman. Fasilitasi percakapan sederhana antara anak-anak. Bantu anak mengekspresikan keinginan.", domain: "SOCIAL", dayOfWeek: 5 },
        { title: "Jurnal Gambar", description: "Minta anak menggambar aktivitas hari ini. Tanyakan tentang gambarnya, tulis kata-kata yang anak sebutkan di bawah gambar.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Latihan Motorik Oral", description: "Tiup gelembung sabun, meniup sedotan, membuat suara binatang. Latihan ini memperkuat otot-otot yang digunakan untuk bicara.", domain: "MOTOR", dayOfWeek: 2 },
      ],
    },
    // Week 2: Expansion — increase vocabulary and expression
    {
      title: "Ekspansi Kosakata",
      domain: "COMMUNICATION",
      goalText: "Memperluas kosakata anak melalui aktivitas eksplorasi dan penamaan benda di lingkungan.",
      activities: [
        { title: "Safari Kata di Rumah", description: "Jalan-jalan di rumah, tunjuk dan sebut nama benda. Minta anak mengulangi. Target 5 kata baru per hari. Tempel label gambar+kata pada benda.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Kategori Benda", description: "Kelompokkan benda: buah-buahan, hewan, pakaian. 'Ini apel, jeruk, pisang — ini semua buah!' Minta anak menambah contoh.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Cerita Berantai", description: "Mulai cerita sederhana, minta anak melanjutkan. 'Ada kucing. Kucing itu...' Bantu jika anak kesulitan, puji setiap usaha.", domain: "COMMUNICATION", dayOfWeek: 2 },
        { title: "Telepon-teleponan", description: "Bermain telepon mainan. Model percakapan: 'Halo, siapa ini?', 'Apa kabar?', 'Sedang apa?' Giliran anak bertanya.", domain: "SOCIAL", dayOfWeek: 4 },
        { title: "Buku Kosakata Pribadi", description: "Buat buku kecil dengan gambar+kata yang sudah dipelajari minggu ini. Review bersama anak sebelum tidur.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Lagu dengan Gerakan", description: "Ajarkan 2 lagu baru yang ada gerakan tangan/badan. Gerakan membantu anak mengingat kata-kata.", domain: "MOTOR", dayOfWeek: 1 },
        { title: "Deskripsi Makanan", description: "Saat makan, deskripsikan: 'Ini nasi. Putih. Hangat. Enak!' Minta anak mendeskripsikan makanannya juga.", domain: "COMMUNICATION", dayOfWeek: null },
      ],
    },
    // Week 3: Sentences — build sentence structure
    {
      title: "Membangun Kalimat",
      domain: "COMMUNICATION",
      goalText: "Mendorong anak membentuk kalimat 2-3 kata dan memperkuat pemahaman bahasa reseptif.",
      activities: [
        { title: "Pilihan Kalimat", description: "Berikan pilihan yang mendorong kalimat: 'Mau susu atau jus?' tunggu anak menjawab dengan kalimat 'Mau susu'. Model jika perlu.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Cerita dari Foto", description: "Lihat foto keluarga/kegiatan. Tanya: 'Siapa ini?', 'Sedang apa?', 'Dimana?' Bantu anak menjawab dalam kalimat pendek.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Instruksi 2 Langkah", description: "Berikan instruksi sederhana: 'Ambil bola, lalu taruh di meja.' Perlahan tingkatkan kompleksitas. Puji saat berhasil.", domain: "COMMUNICATION", dayOfWeek: 2 },
        { title: "Drama Mini", description: "Pakai boneka/mainan untuk cerita mini. Buat dialog sederhana antar karakter. Minta anak berperan.", domain: "SOCIAL", dayOfWeek: 4 },
        { title: "Tebak Suara", description: "Putar suara hewan/kendaraan, minta anak menebak dan membuat kalimat: 'Itu suara kucing. Kucing bilang meong.'", domain: "COMMUNICATION", dayOfWeek: 1 },
        { title: "Rutinitas Doa/Puisi", description: "Ajarkan doa pendek atau puisi anak. Repetisi membantu anak mengingat struktur kalimat.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Bermain Toko", description: "Buat toko-tokoan. 'Saya mau beli roti. Berapa harganya?' Latih percakapan transaksional sederhana.", domain: "SOCIAL", dayOfWeek: 5 },
      ],
    },
    // Week 4: Social Communication — apply in social contexts
    {
      title: "Komunikasi Sosial",
      domain: "COMMUNICATION",
      goalText: "Mengaplikasikan kemampuan komunikasi dalam konteks sosial dan interaksi dengan orang lain.",
      activities: [
        { title: "Sapaan Pagi", description: "Latih rutinitas sapaan: 'Selamat pagi, Mama!' Puji anak setiap kali inisiatif menyapa tanpa diminta.", domain: "SOCIAL", dayOfWeek: null },
        { title: "Bercerita ke Keluarga", description: "Minta anak menceritakan aktivitas hari ini kepada anggota keluarga lain. Bantu dengan pertanyaan pemandu jika perlu.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Playdate dengan Panduan", description: "Atur bermain dengan teman. Sebelumnya, latih kalimat: 'Mau main bareng?', 'Giliran kamu', 'Terima kasih'.", domain: "SOCIAL", dayOfWeek: 3 },
        { title: "Video Call Keluarga", description: "Video call kakek/nenek/saudara. Latih anak menjawab pertanyaan dan bercerita via layar.", domain: "COMMUNICATION", dayOfWeek: 5 },
        { title: "Jalan-jalan Narasi", description: "Jalan-jalan keluar. Ajak anak mendeskripsikan apa yang dilihat: 'Ada burung! Burung terbang di atas pohon!'", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Minta Bantuan", description: "Latih anak meminta bantuan: 'Tolong bukakan', 'Bantu saya'. Buat situasi yang mendorong anak perlu minta tolong.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Review Minggu Ini", description: "Lihat buku kosakata. Hitung berapa kata baru yang dipelajari. Rayakan progres bersama!", domain: "EMOTION", dayOfWeek: 6 },
      ],
    },
  ],
  BEHAVIORAL_CHALLENGES: [
    // Week 1: Routine & Structure
    {
      title: "Membangun Rutinitas",
      domain: "BEHAVIOR",
      goalText: "Mengurangi perilaku menantang dan meningkatkan kemampuan regulasi diri melalui strategi positif.",
      activities: [
        { title: "Jadwal Visual Pagi", description: "Buat jadwal visual dengan gambar untuk rutinitas pagi: bangun → mandi → sarapan → sikat gigi. Beri stiker bintang setiap langkah.", domain: "BEHAVIOR", dayOfWeek: null },
        { title: "Teknik Napas Tenang", description: "Ajarkan 'bau bunga, tiup lilin': tarik napas 4 detik, tahan 2 detik, hembuskan 4 detik. Latih saat anak tenang.", domain: "EMOTION", dayOfWeek: null },
        { title: "Pilihan Terkontrol", description: "Berikan 2 pilihan: 'Mau baju merah atau biru?', 'Mau makan dulu atau mandi dulu?' Memberi rasa kontrol.", domain: "BEHAVIOR", dayOfWeek: null },
        { title: "Waktu Khusus 15 Menit", description: "15 menit bermain bersama tanpa gangguan. Ikuti minat anak, hindari instruksi. Membangun koneksi emosional.", domain: "EMOTION", dayOfWeek: null },
        { title: "Token Economy", description: "Buat sistem reward: 5 stiker bintang = 1 aktivitas pilihan anak. Beri token untuk perilaku positif.", domain: "BEHAVIOR", dayOfWeek: 1 },
        { title: "Social Story Perilaku", description: "Baca social story tentang antri, berbagi, menunggu giliran.", domain: "SOCIAL", dayOfWeek: 3 },
        { title: "Sensory Break Terstruktur", description: "10 menit aktivitas sensorik: meremas plastisin, bermain pasir kinetik. Jadwalkan sebelum aktivitas menantang.", domain: "MOTOR", dayOfWeek: null },
      ],
    },
    // Week 2: Emotional Regulation
    {
      title: "Regulasi Emosi",
      domain: "EMOTION",
      goalText: "Meningkatkan kemampuan anak mengenali dan mengelola emosi sebelum terjadi ledakan.",
      activities: [
        { title: "Zona Emosi", description: "Ajarkan 4 zona: biru (sedih), hijau (tenang), kuning (frustrasi), merah (marah). Tanya 'Kamu di zona apa?' 3x sehari.", domain: "EMOTION", dayOfWeek: null },
        { title: "Termometer Emosi", description: "Gambar termometer 1-5. Latih anak menunjuk level emosinya. Di level 3 mulai gunakan strategi tenang.", domain: "EMOTION", dayOfWeek: null },
        { title: "Calm Down Kit", description: "Buat kotak tenang bersama anak: bola stres, botol glitter, selimut kecil, gambar keluarga. Latih penggunaannya.", domain: "EMOTION", dayOfWeek: 1 },
        { title: "Latihan Transisi", description: "Beri peringatan sebelum transisi: '5 menit lagi selesai bermain.' Gunakan timer visual. Puji transisi yang mulus.", domain: "BEHAVIOR", dayOfWeek: null },
        { title: "Cerita Emosi", description: "Bacakan cerita tentang karakter yang marah/sedih/takut. Diskusikan: 'Apa yang dirasakan? Apa yang bisa dilakukan?'", domain: "EMOTION", dayOfWeek: 3 },
        { title: "Olahraga Pelepasan", description: "30 menit aktivitas fisik intens: lari, lompat, sepeda. Membantu melepas energi berlebih secara sehat.", domain: "MOTOR", dayOfWeek: null },
        { title: "Refleksi Malam", description: "Sebelum tidur, review hari ini: 'Kapan kamu di zona hijau? Kapan di zona kuning? Apa yang membantu?'", domain: "EMOTION", dayOfWeek: null },
      ],
    },
    // Week 3: Social Skills
    {
      title: "Keterampilan Sosial",
      domain: "SOCIAL",
      goalText: "Melatih keterampilan sosial dasar: berbagi, menunggu giliran, dan bermain kooperatif.",
      activities: [
        { title: "Latihan Berbagi", description: "Bermain board game sederhana. Latih menunggu giliran dan mengucapkan 'Giliranmu'. Puji setiap usaha berbagi.", domain: "SOCIAL", dayOfWeek: null },
        { title: "Role Play Situasi", description: "Latih skenario: cara meminta bergabung bermain, cara bilang 'tidak' dengan sopan, cara minta maaf.", domain: "SOCIAL", dayOfWeek: 2 },
        { title: "Proyek Bersama", description: "Kerjakan proyek bersama anak: membuat prakarya, menyusun puzzle besar. Latih kerjasama dan komunikasi.", domain: "SOCIAL", dayOfWeek: 4 },
        { title: "Pujian Spesifik 5x", description: "Berikan 5 pujian spesifik per hari: 'Kamu hebat karena menunggu giliran' bukan hanya 'anak pintar'.", domain: "EMOTION", dayOfWeek: null },
        { title: "Mendengarkan Aktif", description: "Latih anak mendengarkan: ceritakan sesuatu pendek, minta anak mengulangi. 'Apa yang Mama bilang tadi?'", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Playdate Terstruktur", description: "Atur bermain dengan 1 teman, 30-45 menit. Siapkan aktivitas kooperatif. Fasilitasi jika ada konflik.", domain: "SOCIAL", dayOfWeek: 5 },
        { title: "Jurnal Perilaku Positif", description: "Catat 3 perilaku positif anak hari ini. Bacakan ke anak sebelum tidur: 'Hari ini kamu hebat karena...'", domain: "BEHAVIOR", dayOfWeek: null },
      ],
    },
    // Week 4: Independence & Consolidation
    {
      title: "Kemandirian & Penguatan",
      domain: "BEHAVIOR",
      goalText: "Memperkuat rutinitas positif dan meningkatkan kemandirian anak dalam mengelola perilaku.",
      activities: [
        { title: "Jadwal Visual Mandiri", description: "Biarkan anak mengecek jadwal visual sendiri dan pindahkan aktivitas ke 'selesai'. Kurangi bantuan bertahap.", domain: "BEHAVIOR", dayOfWeek: null },
        { title: "Problem Solving", description: "Saat muncul masalah kecil, tanya anak: 'Menurutmu bagaimana solusinya?' Berikan 2 opsi jika anak bingung.", domain: "EMOTION", dayOfWeek: null },
        { title: "Tanggung Jawab Kecil", description: "Berikan tugas harian sesuai usia: menyimpan mainan, menaruh piring kotor, menyiram tanaman. Puji penyelesaian.", domain: "BEHAVIOR", dayOfWeek: null },
        { title: "Menunggu dengan Aktivitas", description: "Latih menunggu dengan aktivitas: coret-coret, hitung benda, nyanyikan lagu. Tingkatkan durasi menunggu perlahan.", domain: "BEHAVIOR", dayOfWeek: 2 },
        { title: "Bermain Tanpa Bimbingan", description: "Biarkan anak bermain sendiri 15-20 menit. Observasi dari jauh. Intervensi hanya jika diperlukan.", domain: "SOCIAL", dayOfWeek: 4 },
        { title: "Self-Care Pengasuh", description: "Luangkan 30 menit untuk diri sendiri. Burnout pengasuh berdampak pada kualitas pendampingan.", domain: "EMOTION", dayOfWeek: 6 },
        { title: "Evaluasi & Selebrasi", description: "Review progres 4 minggu. Rayakan pencapaian bersama anak. Tentukan area fokus untuk bulan depan.", domain: "BEHAVIOR", dayOfWeek: null },
      ],
    },
  ],
  LEARNING_DIFFICULTIES: [
    {
      title: "Fondasi Belajar Multi-Sensorik",
      domain: "ACADEMIC",
      goalText: "Meningkatkan kemampuan belajar anak melalui metode multi-sensorik dan pendekatan individual.",
      activities: [
        { title: "Belajar Multi-Sensorik", description: "Gunakan benda nyata: hitung buah asli, bentuk huruf dari plastisin, tulis di pasir. Libatkan mata, tangan, dan telinga.", domain: "ACADEMIC", dayOfWeek: null },
        { title: "Sesi Belajar Pendek", description: "Belajar 15 menit, istirahat 5 menit, ulangi. Maksimal 3 sesi. Fokus 1 konsep per sesi.", domain: "ACADEMIC", dayOfWeek: null },
        { title: "Game Edukatif", description: "Puzzle sederhana, memory card, sorting warna/bentuk. Mulai dari level mudah.", domain: "ACADEMIC", dayOfWeek: 1 },
        { title: "Aktivitas Motorik Halus", description: "Menggunting garis lurus, meronce manik-manik, mewarnai dalam garis.", domain: "MOTOR", dayOfWeek: 3 },
        { title: "Cerita & Pemahaman", description: "Cerita pendek + 2-3 pertanyaan: siapa, apa, dimana. Gambar sebagai petunjuk.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Rutinitas Belajar Visual", description: "Checklist bergambar untuk tugas belajar. Anak centang setiap langkah selesai.", domain: "BEHAVIOR", dayOfWeek: null },
        { title: "Eksplorasi Alam", description: "Belajar di luar: hitung daun, amati serangga, kenali warna bunga.", domain: "ACADEMIC", dayOfWeek: 5 },
      ],
    },
    {
      title: "Penguatan Fokus & Konsentrasi",
      domain: "ACADEMIC",
      goalText: "Melatih daya fokus dan konsentrasi anak melalui aktivitas yang bertahap dan menarik.",
      activities: [
        { title: "Timer Fokus", description: "Gunakan timer visual. Mulai 5 menit fokus → istirahat. Tingkatkan 1 menit per hari. Target minggu ini: 10 menit fokus.", domain: "ACADEMIC", dayOfWeek: null },
        { title: "Cari & Temukan", description: "Bermain 'I Spy' di rumah atau di buku. Latih anak memperhatikan detail dan menjelaskan apa yang ditemukan.", domain: "ACADEMIC", dayOfWeek: null },
        { title: "Menyalin Pola", description: "Buat pola dari balok/manik-manik, minta anak menyalinnya. Tingkatkan kompleksitas pola bertahap.", domain: "ACADEMIC", dayOfWeek: 2 },
        { title: "Mendengarkan Cerita + Quiz", description: "Bacakan cerita 5 menit, lalu ajukan pertanyaan detail. Ini melatih fokus pendengaran.", domain: "COMMUNICATION", dayOfWeek: 4 },
        { title: "Puzzle Bertahap", description: "Mulai dari puzzle 6 keping, naik ke 12, lalu 24. Jangan langsung bantu — beri waktu anak berpikir.", domain: "ACADEMIC", dayOfWeek: null },
        { title: "Labirin & Dot-to-Dot", description: "Aktivitas kertas: labirin sederhana, hubungkan titik, tebalkan garis putus-putus. Melatih koordinasi dan fokus.", domain: "MOTOR", dayOfWeek: null },
        { title: "Reward Fokus", description: "Setiap kali anak menyelesaikan sesi fokus tanpa gangguan, berikan stiker. 5 stiker = aktivitas pilihan anak.", domain: "BEHAVIOR", dayOfWeek: null },
      ],
    },
    {
      title: "Literasi & Numerasi Awal",
      domain: "ACADEMIC",
      goalText: "Memperkenalkan konsep huruf dan angka melalui pendekatan bermain yang menyenangkan.",
      activities: [
        { title: "Huruf di Lingkungan", description: "Cari huruf di papan toko, kemasan makanan, plat mobil. 'Ini huruf apa? Ada huruf namamu!'", domain: "ACADEMIC", dayOfWeek: null },
        { title: "Hitung Sehari-hari", description: "Hitung saat aktivitas: 'Berapa sendok nasi?', 'Ada berapa anak tangga?', 'Hitung mainanmu.'", domain: "ACADEMIC", dayOfWeek: null },
        { title: "Menulis di Media Berbeda", description: "Tulis huruf di pasir, tepung, busa cukur, kertas besar. Variasi media membuat belajar menyenangkan.", domain: "MOTOR", dayOfWeek: 1 },
        { title: "Sortir & Klasifikasi", description: "Sortir benda berdasarkan warna, ukuran, atau bentuk. 'Yang besar di sini, yang kecil di sana.'", domain: "ACADEMIC", dayOfWeek: 3 },
        { title: "Lagu ABC & Angka", description: "Nyanyikan lagu huruf dan angka dengan gerakan. Repetisi musical membantu memorisasi.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Buku Huruf Pribadi", description: "Buat buku huruf: 1 huruf per halaman + gambar benda yang dimulai huruf itu. Kerjakan bersama anak.", domain: "ACADEMIC", dayOfWeek: null },
        { title: "Bermain Toko Angka", description: "Main toko-tokoan dengan uang mainan. Latih hitung sederhana: 'Rotinya 2 koin. Kamu punya 5 koin.'", domain: "ACADEMIC", dayOfWeek: 5 },
      ],
    },
    {
      title: "Belajar Mandiri & Percaya Diri",
      domain: "ACADEMIC",
      goalText: "Meningkatkan kemandirian belajar dan rasa percaya diri anak saat menghadapi tantangan akademik.",
      activities: [
        { title: "Pilih Aktivitas Sendiri", description: "Sediakan 3 opsi belajar, biarkan anak memilih. Kemandirian memilih meningkatkan motivasi.", domain: "ACADEMIC", dayOfWeek: null },
        { title: "Ajarkan Orang Lain", description: "Minta anak 'mengajarkan' konsep yang sudah dipelajari ke boneka/mainan. Mengajar = cara terbaik belajar.", domain: "ACADEMIC", dayOfWeek: 2 },
        { title: "Tantangan Harian Kecil", description: "Beri 1 tantangan kecil per hari yang bisa diselesaikan anak. Rayakan setiap pencapaian.", domain: "ACADEMIC", dayOfWeek: null },
        { title: "Membaca Bersama", description: "Baca buku bersama 15 menit. Anak tunjuk gambar, coba baca kata yang diulang-ulang.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Proyek Mini", description: "Kerjakan proyek kecil: membuat kartu ucapan, poster hewan favorit, kolase foto. Latih perencanaan.", domain: "ACADEMIC", dayOfWeek: 4 },
        { title: "Portofolio Karya", description: "Kumpulkan hasil karya anak minggu ini. Lihat bersama: 'Wah, minggu lalu belum bisa, sekarang sudah bisa!'", domain: "EMOTION", dayOfWeek: 6 },
        { title: "Evaluasi Progres", description: "Review kemajuan 4 minggu. Catat area yang meningkat dan area yang perlu fokus bulan depan.", domain: "ACADEMIC", dayOfWeek: null },
      ],
    },
  ],
  SENSORY_PROCESSING: [
    {
      title: "Diet Sensorik Dasar",
      domain: "MOTOR",
      goalText: "Memberikan input sensorik yang tepat untuk membantu anak mengatur respons sensoriknya.",
      activities: [
        { title: "Sensory Warm-Up Pagi", description: "10 menit aktivitas sensorik: deep pressure (pelukan kuat), proprioceptive (dorong dinding), vestibular (ayunan).", domain: "MOTOR", dayOfWeek: null },
        { title: "Sensory Bin Exploration", description: "Wadah berisi beras, pasir kinetik, atau air + mainan. Biarkan anak mengeksplorasi 15 menit. Observasi preferensi.", domain: "MOTOR", dayOfWeek: 1 },
        { title: "Obstacle Course Mini", description: "Jalur rintangan: merangkak di bawah meja, melompati bantal, berjalan di atas garis. Sediakan 2-3x sehari.", domain: "MOTOR", dayOfWeek: 3 },
        { title: "Calm Down Corner", description: "Siapkan sudut tenang: selimut berat, headphone, bola stres, botol glitter. Ajarkan anak menggunakannya.", domain: "EMOTION", dayOfWeek: null },
        { title: "Aktivitas Taktil", description: "Berbagai tekstur: plastisin, slime, cat finger, busa cukur. Mulai dari yang disukai.", domain: "MOTOR", dayOfWeek: null },
        { title: "Latihan Pernapasan Sensorik", description: "Tiup bulu ayam, tiup gelembung, tarik napas sambil cium bunga lavender. Bantu regulasi.", domain: "EMOTION", dayOfWeek: null },
        { title: "Journaling Sensory Response", description: "Catat respons sensorik hari ini: apa yang dihindari, apa yang dicari, kapan meltdown terjadi.", domain: "BEHAVIOR", dayOfWeek: null },
      ],
    },
    {
      title: "Eksplorasi Sensorik Lanjutan",
      domain: "MOTOR",
      goalText: "Memperluas toleransi sensorik anak dan memperkenalkan input sensorik baru secara bertahap.",
      activities: [
        { title: "Tekstur Baru Bertahap", description: "Perkenalkan 1 tekstur baru per hari: kapas, amplas halus, kain beludru. Biarkan anak menyentuh sebentar saja dulu.", domain: "MOTOR", dayOfWeek: null },
        { title: "Suara & Musik Terapeutik", description: "Dengarkan musik tenang 10 menit. Eksplorasi bunyi dari benda rumah: sendok di gelas, ketuk meja. Observasi respons.", domain: "EMOTION", dayOfWeek: 2 },
        { title: "Bermain Air Terstruktur", description: "Bermain air dengan wadah, corong, gelas. Variasikan suhu (hangat/dingin). Aktivitas air umumnya menenangkan.", domain: "MOTOR", dayOfWeek: 4 },
        { title: "Heavy Work Activities", description: "Aktivitas berat: memindahkan buku, membawa tas belanjaan, mendorong keranjang cucian. Input proprioceptive yang menenangkan.", domain: "MOTOR", dayOfWeek: null },
        { title: "Art Sensory", description: "Melukis dengan jari, cap tangan, bermain dengan tanah liat. Gabungan kreativitas + input sensorik.", domain: "MOTOR", dayOfWeek: 1 },
        { title: "Sensory Diet Check-In", description: "Review jurnal sensorik minggu lalu. Identifikasi pola: jam berapa anak paling butuh input sensorik?", domain: "BEHAVIOR", dayOfWeek: null },
        { title: "Outdoor Sensory Walk", description: "Jalan-jalan di luar: injak rumput, pegang daun, dengarkan burung. Input sensorik alami paling efektif.", domain: "MOTOR", dayOfWeek: 5 },
      ],
    },
    {
      title: "Regulasi Sensorik Mandiri",
      domain: "MOTOR",
      goalText: "Mengajarkan anak mengenali kebutuhan sensoriknya sendiri dan menggunakan strategi self-regulation.",
      activities: [
        { title: "Body Check-In", description: "Ajarkan anak cek tubuhnya: 'Badan kamu tegang atau rileks?', 'Perutmu nyaman?' Latih body awareness.", domain: "EMOTION", dayOfWeek: null },
        { title: "Pilih Sensory Tool", description: "Sediakan 3-4 opsi sensory tool. Biarkan anak memilih yang dibutuhkan saat ini. Puji pilihan mandiri.", domain: "MOTOR", dayOfWeek: null },
        { title: "Yoga Anak Sederhana", description: "3-5 pose yoga anak: pohon, kucing-sapi, anak. 5 menit pagi dan sore. Video bisa membantu.", domain: "MOTOR", dayOfWeek: 2 },
        { title: "Sensory Schedule Visual", description: "Buat jadwal sensorik visual: kapan sensory break, kapan calm down time. Anak belajar memprediksi.", domain: "BEHAVIOR", dayOfWeek: null },
        { title: "Cooking Sensory", description: "Masak bersama: remas adonan, aduk, potong buah lunak. Banyak input sensorik + rasa pencapaian.", domain: "MOTOR", dayOfWeek: 4 },
        { title: "Transisi dengan Sensory Prep", description: "Sebelum aktivitas yang menantang, beri 5 menit sensory prep: lompat-lompat, pelukan kuat, deep breathing.", domain: "BEHAVIOR", dayOfWeek: null },
        { title: "Evaluasi Sensory Profile", description: "Review 3 minggu data sensorik. Mana yang membantu? Mana yang dihindari? Sesuaikan diet sensorik.", domain: "BEHAVIOR", dayOfWeek: 6 },
      ],
    },
    {
      title: "Integrasi Sensorik Sosial",
      domain: "MOTOR",
      goalText: "Mengaplikasikan strategi sensorik dalam situasi sosial dan lingkungan yang lebih luas.",
      activities: [
        { title: "Sensory Kit Bepergian", description: "Buat kit sensorik mini untuk dibawa: bola stres kecil, headphone, permen karet. Latih anak menggunakannya di luar rumah.", domain: "MOTOR", dayOfWeek: null },
        { title: "Bermain di Playground", description: "Ke taman bermain saat tidak ramai. Biarkan anak eksplorasi. Observasi alat mana yang dicari/dihindari.", domain: "SOCIAL", dayOfWeek: 3 },
        { title: "Playdate Sensory-Friendly", description: "Atur bermain di rumah (lingkungan terkontrol). Siapkan aktivitas sensorik yang bisa dilakukan berdua.", domain: "SOCIAL", dayOfWeek: 5 },
        { title: "Makan di Luar Bertahap", description: "Latih makan di tempat baru: mulai yang sepi, bawa comfort item, durasi pendek. Tingkatkan bertahap.", domain: "BEHAVIOR", dayOfWeek: null },
        { title: "Sensory-Friendly Routine", description: "Buat rutinitas yang mengakomodasi kebutuhan sensorik: pakaian nyaman, waktu transisi, predictable schedule.", domain: "BEHAVIOR", dayOfWeek: null },
        { title: "Komunikasi Kebutuhan", description: "Ajarkan anak mengkomunikasikan: 'Terlalu bising', 'Saya butuh istirahat', 'Tolong peluk kuat'.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Selebrasi & Plan Depan", description: "Rayakan progres 4 minggu! Review apa yang berhasil. Buat rencana sensory diet untuk bulan depan.", domain: "EMOTION", dayOfWeek: 6 },
      ],
    },
  ],
  SOCIAL_EMOTIONAL: [
    {
      title: "Mengenal Emosi",
      domain: "EMOTION",
      goalText: "Membangun kemampuan anak mengenali dan menamai emosi diri sendiri dan orang lain.",
      activities: [
        { title: "Zona Emosi", description: "Ajarkan 4 zona: biru (sedih/lelah), hijau (tenang/siap), kuning (frustrasi), merah (marah). Tanya 3x sehari.", domain: "EMOTION", dayOfWeek: null },
        { title: "Social Story Harian", description: "1 social story per hari tentang berbagi, menunggu giliran, menyapa teman. Diskusikan perasaan karakter.", domain: "SOCIAL", dayOfWeek: null },
        { title: "Role Play Interaksi", description: "Latih: cara menyapa, cara meminta bergabung, cara bilang tidak dengan sopan.", domain: "SOCIAL", dayOfWeek: 2 },
        { title: "Emosi dalam Cermin", description: "Buat ekspresi wajah di cermin: senang, sedih, marah, takut. Anak menebak dan meniru.", domain: "EMOTION", dayOfWeek: 4 },
        { title: "Playdate Terstruktur", description: "Bermain dengan 1 teman, 30-45 menit. Aktivitas kooperatif. Fasilitasi interaksi.", domain: "SOCIAL", dayOfWeek: 5 },
        { title: "Pujian Spesifik 5x", description: "5 pujian spesifik per hari: 'Kamu hebat karena menunggu giliran.' Catat respons anak.", domain: "EMOTION", dayOfWeek: null },
        { title: "Papan Perasaan", description: "Papan perasaan dengan gambar. Pagi dan malam, anak tunjuk perasaannya. Validasi tanpa menghakimi.", domain: "EMOTION", dayOfWeek: null },
      ],
    },
    {
      title: "Keterampilan Pertemanan",
      domain: "SOCIAL",
      goalText: "Melatih anak membangun dan mempertahankan pertemanan melalui keterampilan sosial dasar.",
      activities: [
        { title: "Latihan Sapaan", description: "Latih 3 cara menyapa: kontak mata + senyum + 'Halo!' Praktikkan dengan anggota keluarga.", domain: "SOCIAL", dayOfWeek: null },
        { title: "Bermain Giliran", description: "Board game sederhana yang butuh giliran. Model mengatakan: 'Giliranmu!', 'Aku tunggu ya.'", domain: "SOCIAL", dayOfWeek: 2 },
        { title: "Proyek Bersama", description: "Buat sesuatu bersama: puzzle, menara balok, gambar kolaboratif. Latih kerjasama dan negosiasi.", domain: "SOCIAL", dayOfWeek: 4 },
        { title: "Membaca Ekspresi Wajah", description: "Lihat foto/gambar orang. Tebak perasaannya: 'Menurutmu dia senang atau sedih? Kenapa?'", domain: "EMOTION", dayOfWeek: null },
        { title: "Latihan Empati", description: "Saat menonton film/cerita: 'Kalau kamu jadi dia, apa yang kamu rasakan? Apa yang akan kamu lakukan?'", domain: "EMOTION", dayOfWeek: null },
        { title: "Playdate + Refleksi", description: "Setelah bermain dengan teman, tanya: 'Apa yang menyenangkan?', 'Apa yang sulit?', 'Besok mau main apa?'", domain: "SOCIAL", dayOfWeek: 5 },
        { title: "Surat/Gambar untuk Teman", description: "Buat gambar atau kartu untuk teman. Berikan besok. Latih memikirkan orang lain.", domain: "SOCIAL", dayOfWeek: null },
      ],
    },
    {
      title: "Regulasi Diri & Coping",
      domain: "EMOTION",
      goalText: "Mengajarkan strategi coping dan regulasi diri yang bisa anak gunakan secara mandiri.",
      activities: [
        { title: "Toolbox Emosi", description: "Buat 'kotak alat emosi': napas dalam, hitung mundur 10-1, peluk boneka, ke tempat tenang. Latih saat anak tenang.", domain: "EMOTION", dayOfWeek: null },
        { title: "Skala Masalah", description: "Ajarkan skala masalah 1-5. Level 1: masalah kecil (mainan hilang). Level 5: bahaya. Solusi sesuai level.", domain: "EMOTION", dayOfWeek: 2 },
        { title: "Journaling Emosi Visual", description: "Anak gambar/warnai emosinya hari ini. Tidak perlu kata — warna dan gambar cukup ekspresif.", domain: "EMOTION", dayOfWeek: null },
        { title: "Relaksasi Otot", description: "Latih relaksasi otot progresif: tegang-lepas dari kaki ke kepala. 5 menit sebelum tidur.", domain: "MOTOR", dayOfWeek: null },
        { title: "Situasi Sosial Sulit", description: "Role play situasi sulit: ditolak bermain, mainan direbut, diejek. Latih respons yang tepat.", domain: "SOCIAL", dayOfWeek: 4 },
        { title: "Gratitude Practice", description: "Sebelum tidur, sebutkan 3 hal yang disyukuri hari ini. Menulis atau menggambar di 'gratitude journal'.", domain: "EMOTION", dayOfWeek: null },
        { title: "Self-Talk Positif", description: "Ajarkan kalimat penyemangat: 'Aku bisa coba', 'Tidak apa-apa salah', 'Aku berani'. Tempel di kamar anak.", domain: "EMOTION", dayOfWeek: null },
      ],
    },
    {
      title: "Kemandirian Sosial-Emosional",
      domain: "SOCIAL",
      goalText: "Memantapkan keterampilan sosial-emosional anak agar bisa diterapkan secara mandiri di berbagai situasi.",
      activities: [
        { title: "Inisiatif Sosial", description: "Dorong anak mengambil inisiatif: mengajak teman bermain, menawarkan bantuan, memulai percakapan.", domain: "SOCIAL", dayOfWeek: null },
        { title: "Menyelesaikan Konflik", description: "Saat konflik dengan saudara/teman, tahan diri untuk langsung intervensi. Bimbing: 'Kalian bisa selesaikan bersama.'", domain: "SOCIAL", dayOfWeek: null },
        { title: "Emosi di Tempat Baru", description: "Kunjungi tempat baru (taman, toko). Latih anak mengkomunikasikan perasaan dan menggunakan toolbox emosi.", domain: "EMOTION", dayOfWeek: 3 },
        { title: "Bermain Kelompok", description: "Atur bermain dengan 2-3 teman. Observasi dinamika sosial anak. Beri feedback setelahnya.", domain: "SOCIAL", dayOfWeek: 5 },
        { title: "Review Toolbox", description: "Review semua strategi yang dipelajari. Mana yang paling membantu? Buat 'top 3' strategi favorit anak.", domain: "EMOTION", dayOfWeek: null },
        { title: "Surat untuk Diri Sendiri", description: "Bantu anak membuat 'surat penyemangat' untuk dirinya sendiri. Baca saat hari-hari sulit.", domain: "EMOTION", dayOfWeek: null },
        { title: "Selebrasi 4 Minggu", description: "Rayakan progres! Buat 'diploma' atau sertifikat kecil. Review perkembangan bersama anak.", domain: "EMOTION", dayOfWeek: 6 },
      ],
    },
  ],
  MULTIPLE_CHALLENGES: [
    {
      title: "Fondasi Pendampingan",
      domain: "COMMUNICATION",
      goalText: "Menerapkan program pendampingan multi-domain yang terintegrasi untuk mendukung perkembangan anak secara holistik.",
      activities: [
        { title: "Rutinitas Terstruktur", description: "Jadwal visual dari bangun sampai tidur. Konsistensi membantu anak merasa aman.", domain: "BEHAVIOR", dayOfWeek: null },
        { title: "Komunikasi Total", description: "Kombinasi kata, gestur, gambar. Narasi aktivitas. Tunggu respons, terima semua bentuk komunikasi.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Sensory Diet", description: "Aktivitas sensorik teratur: deep pressure, proprioceptive, sensory break sebelum aktivitas menantang.", domain: "MOTOR", dayOfWeek: null },
        { title: "Bermain Sosial Terbimbing", description: "Bermain dengan 1 teman. Mulai paralel, lalu kooperatif. Fasilitasi.", domain: "SOCIAL", dayOfWeek: 3 },
        { title: "Belajar Melalui Bermain", description: "Konsep akademik dalam bermain: hitung saat toko-tokoan, huruf di lingkungan, sortir benda.", domain: "ACADEMIC", dayOfWeek: null },
        { title: "Regulasi Emosi", description: "Zona emosi, pernapasan dalam, calm down kit. Modelkan cara mengelola emosi.", domain: "EMOTION", dayOfWeek: null },
        { title: "Self-Care Pengasuh", description: "15-30 menit untuk diri sendiri. Burnout berdampak pada kualitas pendampingan.", domain: "EMOTION", dayOfWeek: 6 },
      ],
    },
    {
      title: "Penguatan Komunikasi & Perilaku",
      domain: "COMMUNICATION",
      goalText: "Memperkuat kemampuan komunikasi dan membangun kebiasaan perilaku positif secara bersamaan.",
      activities: [
        { title: "Kosakata Kontekstual", description: "5 kata baru per hari dari aktivitas nyata. Tempel label pada benda rumah. Review sebelum tidur.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Token System", description: "Stiker untuk perilaku positif spesifik. 5 stiker = reward pilihan anak. Fokus pada usaha, bukan hasil.", domain: "BEHAVIOR", dayOfWeek: null },
        { title: "Pilihan & Kalimat", description: "Sediakan 2 pilihan yang mendorong anak bicara: 'Mau A atau B?' Tunggu jawaban kalimat.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Olahraga Terstruktur", description: "30 menit aktivitas fisik: lari, lompat tali, sepeda. Pelepas energi + input proprioceptive.", domain: "MOTOR", dayOfWeek: 2 },
        { title: "Social Story + Role Play", description: "Baca social story, lalu praktikkan skenario dengan role play bersama anak.", domain: "SOCIAL", dayOfWeek: 4 },
        { title: "Sesi Belajar Pendek", description: "3x15 menit belajar multi-sensorik. 1 konsep per sesi. Gunakan benda nyata.", domain: "ACADEMIC", dayOfWeek: null },
        { title: "Refleksi Bersama", description: "Sebelum tidur: 'Apa yang menyenangkan hari ini?', '1 hal yang kamu pelajari', '1 hal yang sulit'.", domain: "EMOTION", dayOfWeek: null },
      ],
    },
    {
      title: "Keterampilan Sosial & Sensorik",
      domain: "SOCIAL",
      goalText: "Mengembangkan keterampilan sosial sambil mengelola kebutuhan sensorik anak secara terintegrasi.",
      activities: [
        { title: "Playdate Sensory-Friendly", description: "Bermain dengan teman di rumah. Siapkan sensory tools. Durasi terbatas. Refleksi setelahnya.", domain: "SOCIAL", dayOfWeek: 3 },
        { title: "Emosi & Zona Tubuh", description: "Gabungan zona emosi + body check: 'Badan tegang/rileks?', 'Zona apa sekarang?', 'Apa yang dibutuhkan?'", domain: "EMOTION", dayOfWeek: null },
        { title: "Bermain Peran Sosial", description: "Role play: minta bergabung bermain, berbagi mainan, minta tolong. 3 skenario per sesi.", domain: "SOCIAL", dayOfWeek: 2 },
        { title: "Sensory Cooking", description: "Masak sederhana bersama: remas, aduk, potong. Input sensorik + following instructions + bonding.", domain: "MOTOR", dayOfWeek: 5 },
        { title: "Cerita & Pemahaman Sosial", description: "Baca cerita tentang anak yang punya tantangan. Diskusikan: 'Apa yang dia rasakan?', 'Bagaimana menurutmu?'", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Problem Solving Bersama", description: "Berikan masalah sederhana untuk dipecahkan bersama anak. Latih berpikir fleksibel.", domain: "ACADEMIC", dayOfWeek: null },
        { title: "Journaling Multi-Domain", description: "Catat perkembangan di semua domain hari ini. Mana yang progress? Mana yang butuh perhatian?", domain: "BEHAVIOR", dayOfWeek: null },
      ],
    },
    {
      title: "Kemandirian & Evaluasi",
      domain: "BEHAVIOR",
      goalText: "Meningkatkan kemandirian anak dan mengevaluasi progres 4 minggu untuk menentukan langkah selanjutnya.",
      activities: [
        { title: "Rutinitas Mandiri", description: "Biarkan anak mengikuti jadwal visual tanpa bantuan. Cek sendiri, pindahkan sendiri. Puji kemandirian.", domain: "BEHAVIOR", dayOfWeek: null },
        { title: "Komunikasi Kebutuhan", description: "Latih anak mengkomunikasikan: 'Saya butuh bantuan', 'Saya lelah', 'Terlalu bising'. Gunakan kartu jika perlu.", domain: "COMMUNICATION", dayOfWeek: null },
        { title: "Bermain di Luar Rumah", description: "Ke taman/playground. Biarkan anak berinteraksi dengan anak lain. Bawa sensory kit. Observasi dari jauh.", domain: "SOCIAL", dayOfWeek: 3 },
        { title: "Tantangan Akademik", description: "Berikan tugas sedikit di atas kemampuan. Bimbing tapi jangan langsung bantu. Celebrate effort.", domain: "ACADEMIC", dayOfWeek: null },
        { title: "Review Strategi", description: "Bersama anak, review semua strategi 4 minggu. Mana yang paling membantu? Buat top 5 strategi.", domain: "EMOTION", dayOfWeek: null },
        { title: "Self-Care Pengasuh", description: "30 menit me-time. Evaluasi energi dan well-being pengasuh. Anda penting!", domain: "EMOTION", dayOfWeek: 6 },
        { title: "Selebrasi & Rencana", description: "Rayakan progres 4 minggu! Buat 'diploma'. Diskusikan fokus untuk 4 minggu selanjutnya.", domain: "EMOTION", dayOfWeek: null },
      ],
    },
  ],
};

export function generateActionPlan(challengeType: ChallengeType, weekNumber: number = 1): GeneratedPlan {
  const plans = ACTIVITIES_BY_CHALLENGE[challengeType];
  // Cycle through available plans (4 weeks per cycle)
  const planIndex = (weekNumber - 1) % plans.length;
  const plan = plans[planIndex];

  return {
    ...plan,
    title: `${plan.title} - Minggu ${weekNumber}`,
  };
}

export function generateAllPlansForChallenge(challengeType: ChallengeType): GeneratedPlan[] {
  return ACTIVITIES_BY_CHALLENGE[challengeType];
}
