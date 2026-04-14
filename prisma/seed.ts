import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ortoconnect.id" },
    update: {},
    create: {
      email: "admin@ortoconnect.id",
      name: "Admin OrtoPedagogik",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  await prisma.consultationQuota.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  // Sample expert users
  const expertData = [
    {
      name: "Dr. Siti Rahayu, M.Pd",
      email: "siti.rahayu@ortoconnect.id",
      specializations: ["LEARNING_DIFFICULTIES", "ADHD"],
      bio: "Spesialis ortopedagogik dengan pengalaman lebih dari 12 tahun mendampingi anak-anak dengan kesulitan belajar dan ADHD.",
      hourlyRate: 350000,
      rating: 4.9,
      totalReviews: 87,
      yearsExperience: 12,
      city: "Jakarta",
      province: "DKI Jakarta",
    },
    {
      name: "Budi Santoso, S.Pd, M.Si",
      email: "budi.santoso@ortoconnect.id",
      specializations: ["AUTISM_SPECTRUM", "COMMUNICATION_DISORDERS"],
      bio: "Terapis wicara dan komunikasi dengan spesialisasi Spektrum Autisme. Menggunakan pendekatan ABA dan PECS.",
      hourlyRate: 300000,
      rating: 4.8,
      totalReviews: 64,
      yearsExperience: 8,
      city: "Bandung",
      province: "Jawa Barat",
    },
    {
      name: "Dewi Lestari, M.Psi",
      email: "dewi.lestari@ortoconnect.id",
      specializations: ["BEHAVIORAL_SUPPORT", "EMOTIONAL_REGULATION", "SOCIAL_SKILLS"],
      bio: "Psikolog klinis anak yang berfokus pada manajemen perilaku dan perkembangan emosi anak.",
      hourlyRate: 400000,
      rating: 4.9,
      totalReviews: 112,
      yearsExperience: 15,
      city: "Surabaya",
      province: "Jawa Timur",
    },
    {
      name: "Andi Pratama, M.Ed",
      email: "andi.pratama@ortoconnect.id",
      specializations: ["SENSORY_PROCESSING", "MOTOR_DEVELOPMENT"],
      bio: "Terapis okupasi dengan keahlian dalam pemrosesan sensorik dan perkembangan motorik anak.",
      hourlyRate: 280000,
      rating: 4.7,
      totalReviews: 45,
      yearsExperience: 6,
      city: "Online",
      province: "Yogyakarta",
      locationType: "BOTH" as const,
    },
  ];

  for (const expert of expertData) {
    const password = await bcrypt.hash("Expert@123456", 12);
    const user = await prisma.user.upsert({
      where: { email: expert.email },
      update: {},
      create: {
        email: expert.email,
        name: expert.name,
        password,
        role: "EXPERT",
      },
    });

    await prisma.consultationQuota.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    await prisma.expertProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        specializations: expert.specializations as any,
        bio: expert.bio,
        hourlyRate: expert.hourlyRate,
        rating: expert.rating,
        totalReviews: expert.totalReviews,
        yearsExperience: expert.yearsExperience,
        city: expert.city,
        province: expert.province,
        locationType: (expert as any).locationType ?? "ONLINE",
        isVerified: true,
        isAvailable: true,
        availabilitySlots: {
          create: [1, 2, 3, 4, 5].map((day) => ({
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "17:00",
          })),
        },
      },
    });
  }

  // Knowledge content
  const articles = [
    // ─────────────────────────────────────────────
    // CATEGORY: LEARNING_DIFFICULTIES (Kesulitan Belajar)
    // ─────────────────────────────────────────────
    {
      title: "Memahami Disleksia: Panduan Lengkap untuk Orang Tua",
      slug: "memahami-disleksia-panduan-orang-tua",
      excerpt: "Disleksia bukan tentang kecerdasan — ini tentang cara otak memproses bahasa. Panduan mendalam untuk mengenali tanda, memahami diagnosis, dan membangun strategi belajar yang efektif di rumah.",
      content: `
<h2>Apa Itu Disleksia?</h2>
<p>Disleksia adalah kondisi neurologis yang memengaruhi cara otak memproses bahasa tertulis. Penting untuk dipahami bahwa <strong>disleksia tidak ada hubungannya dengan tingkat kecerdasan</strong>. Banyak individu dengan disleksia justru memiliki kemampuan berpikir kreatif, pemecahan masalah, dan penalaran spasial yang luar biasa.</p>
<p>Menurut data International Dyslexia Association, disleksia memengaruhi sekitar 15–20% populasi global. Di Indonesia, meskipun data epidemiologis masih terbatas, diperkirakan jutaan anak mengalami kondisi ini — sebagian besar belum terdiagnosis dengan tepat.</p>

<h2>Mengenali Tanda-Tanda Disleksia Berdasarkan Usia</h2>
<h3>Usia Prasekolah (3–5 tahun)</h3>
<ul>
<li>Kesulitan mempelajari dan mengingat huruf alfabet</li>
<li>Sering keliru membedakan huruf yang mirip secara visual (b/d, p/q, m/w)</li>
<li>Terlambat dalam perkembangan bicara dibandingkan teman sebaya</li>
<li>Kesulitan dalam permainan rima atau mengenali pola bunyi kata</li>
<li>Menghindari aktivitas yang melibatkan membaca atau menulis</li>
</ul>

<h3>Usia Sekolah Dasar (6–12 tahun)</h3>
<ul>
<li>Membaca jauh lebih lambat dari teman sekelas</li>
<li>Sering menebak kata alih-alih membaca, terutama pada kata yang panjang</li>
<li>Kesulitan mengeja — menulis kata yang sama dengan ejaan berbeda-beda</li>
<li>Menghindari membaca dengan suara keras karena malu</li>
<li>Pemahaman bacaan rendah meskipun kemampuan verbal baik</li>
<li>Tulisan tangan sulit dibaca, ukuran huruf tidak konsisten</li>
</ul>

<h3>Usia Remaja (13+ tahun)</h3>
<ul>
<li>Membaca sangat lambat dan melelahkan</li>
<li>Kesulitan menyusun esai atau karangan tertulis</li>
<li>Sering salah membaca soal ujian sehingga jawaban melenceng</li>
<li>Mengandalkan hafalan berlebihan karena kesulitan memproses teks</li>
</ul>

<h2>Proses Diagnosis</h2>
<p>Diagnosis disleksia dilakukan oleh <strong>psikolog pendidikan</strong> atau <strong>spesialis ortopedagogik</strong> melalui serangkaian asesmen komprehensif yang meliputi:</p>
<ol>
<li><strong>Tes Kecerdasan (IQ)</strong> — Memastikan kemampuan kognitif anak berada dalam rentang normal atau di atasnya</li>
<li><strong>Tes Kemampuan Membaca</strong> — Mengukur akurasi, kecepatan, dan pemahaman membaca</li>
<li><strong>Tes Kesadaran Fonologis</strong> — Menilai kemampuan anak mengenali dan memanipulasi bunyi dalam kata</li>
<li><strong>Tes Mengeja dan Menulis</strong> — Mengevaluasi pola kesalahan yang khas disleksia</li>
<li><strong>Riwayat Perkembangan</strong> — Menelusuri milestone perkembangan bahasa dan riwayat keluarga</li>
</ol>

<h2>Strategi Belajar di Rumah</h2>
<h3>Metode Multisensori (Orton-Gillingham)</h3>
<p>Pendekatan ini melibatkan <strong>penglihatan, pendengaran, dan sentuhan secara bersamaan</strong>. Misalnya:</p>
<ul>
<li>Anak melihat huruf "B", mendengar bunyinya /b/, dan meraba huruf bertekstur dari amplas</li>
<li>Menulis huruf di nampan berisi pasir atau garam sambil mengucapkan bunyinya</li>
<li>Menggunakan balok huruf berwarna untuk menyusun kata</li>
</ul>

<h3>Teknik Membaca Terbimbing</h3>
<ul>
<li><strong>Bacakan bersama (paired reading)</strong> — Anda dan anak membaca bersama-sama dengan suara keras, lalu perlahan anak mengambil alih</li>
<li><strong>Gunakan penanda baris</strong> — Letakkan penggaris atau karton di bawah baris yang sedang dibaca agar mata tidak melompat</li>
<li><strong>Chunking</strong> — Pecah kata panjang menjadi suku kata: "me-nge-rti" bukan langsung "mengerti"</li>
</ul>

<h3>Membangun Lingkungan yang Mendukung</h3>
<ul>
<li>Sediakan <strong>audiobook</strong> sebagai pendamping buku cetak</li>
<li>Gunakan <strong>font yang ramah disleksia</strong> seperti OpenDyslexic saat mencetak materi belajar</li>
<li>Berikan <strong>waktu ekstra</strong> tanpa tekanan saat anak mengerjakan tugas membaca</li>
<li>Rayakan setiap kemajuan sekecil apapun — motivasi intrinsik sangat penting</li>
</ul>

<h2>Kapan Harus Berkonsultasi dengan Profesional?</h2>
<p>Segera cari bantuan profesional jika:</p>
<ul>
<li>Anak menunjukkan frustrasi berlebihan terhadap kegiatan akademik</li>
<li>Nilai sekolah terus menurun meskipun sudah berusaha</li>
<li>Muncul gejala kecemasan atau menolak pergi ke sekolah</li>
<li>Ada riwayat disleksia dalam keluarga (faktor genetik berperan signifikan)</li>
</ul>
<p>Intervensi yang dimulai sejak dini memberikan hasil yang jauh lebih baik. Riset menunjukkan bahwa anak yang mendapat intervensi sebelum usia 7 tahun memiliki tingkat perbaikan yang signifikan dibandingkan yang ditangani di usia lebih tua.</p>

<blockquote>
<p><strong>Ingat:</strong> Anak dengan disleksia bukan anak yang malas atau bodoh. Mereka adalah anak yang berpikir dengan cara berbeda — dan dengan dukungan yang tepat, mereka mampu mencapai potensi penuh mereka.</p>
</blockquote>
      `.trim(),
      type: "ARTICLE" as const,
      category: "LEARNING_DIFFICULTIES" as const,
      isPremium: false,
      readTimeMins: 12,
      ageRangeMin: 3,
      ageRangeMax: 15,
    },
    {
      title: "Diskalkulia pada Anak: Ketika Angka Terasa Seperti Bahasa Asing",
      slug: "diskalkulia-pada-anak-panduan-lengkap",
      excerpt: "Anak Anda kesulitan memahami konsep angka sederhana? Bisa jadi itu bukan soal kurang latihan. Kenali diskalkulia — gangguan belajar spesifik yang memengaruhi kemampuan matematika.",
      content: `
<h2>Mengenal Diskalkulia</h2>
<p>Diskalkulia adalah gangguan belajar spesifik yang memengaruhi kemampuan seseorang dalam memahami angka dan konsep matematika. Sama seperti disleksia yang terkait dengan membaca, diskalkulia terkait dengan <strong>cara otak memproses informasi numerik</strong>.</p>
<p>Anak dengan diskalkulia mungkin memiliki kemampuan bahasa dan membaca yang sangat baik, namun mengalami kesulitan luar biasa ketika berhadapan dengan angka — mulai dari berhitung sederhana hingga memahami konsep waktu dan uang.</p>

<h2>Tanda-Tanda Diskalkulia yang Perlu Diwaspadai</h2>
<h3>Tanda di Kehidupan Sehari-hari</h3>
<ul>
<li>Kesulitan membaca jam analog dan memperkirakan waktu</li>
<li>Bingung dengan konsep uang — tidak bisa menghitung kembalian</li>
<li>Sering tersesat karena sulit memahami arah (kiri/kanan, utara/selatan)</li>
<li>Kesulitan mengingat nomor telepon atau tanggal penting</li>
<li>Tidak bisa memperkirakan jarak atau ukuran benda</li>
</ul>

<h3>Tanda di Sekolah</h3>
<ul>
<li>Masih menghitung dengan jari saat teman-teman sudah berhitung otomatis</li>
<li>Sering tertukar antara tanda operasi (+, −, ×, ÷)</li>
<li>Tidak memahami konsep "lebih besar" dan "lebih kecil"</li>
<li>Kesulitan menghafal tabel perkalian meskipun sudah berlatih berulang kali</li>
<li>Tidak bisa mengikuti langkah-langkah pemecahan soal secara berurutan</li>
<li>Nilai matematika sangat rendah dibandingkan mata pelajaran lain</li>
</ul>

<h2>Penyebab Diskalkulia</h2>
<p>Penelitian terkini menunjukkan bahwa diskalkulia melibatkan <strong>perbedaan struktural dan fungsional di otak</strong>, terutama di area:</p>
<ul>
<li><strong>Sulkus intraparietal</strong> — area yang bertanggung jawab atas representasi numerik</li>
<li><strong>Korteks prefrontal</strong> — berperan dalam memori kerja dan penalaran logis</li>
</ul>
<p>Faktor genetik juga berperan — anak dengan orang tua yang memiliki diskalkulia berisiko lebih tinggi mengalami kondisi serupa.</p>

<h2>Strategi Membantu Anak dengan Diskalkulia</h2>
<h3>1. Gunakan Alat Bantu Konkret</h3>
<p>Anak dengan diskalkulia membutuhkan representasi visual dan taktil dari konsep angka:</p>
<ul>
<li><strong>Balok Cuisenaire</strong> — batang berwarna dengan panjang berbeda untuk merepresentasikan angka</li>
<li><strong>Garis bilangan</strong> — tempel di meja belajar agar anak bisa "melangkah" secara visual</li>
<li><strong>Uang mainan</strong> — untuk berlatih transaksi jual-beli sederhana</li>
<li><strong>Kelereng atau manik-manik</strong> — untuk memahami penjumlahan dan pengurangan secara fisik</li>
</ul>

<h3>2. Hubungkan Matematika dengan Kehidupan Nyata</h3>
<ul>
<li>Libatkan anak saat memasak — "Kita butuh 2 gelas tepung, sudah ada 1, kurang berapa?"</li>
<li>Berbelanja bersama — biarkan anak menghitung kembalian</li>
<li>Bermain board game yang melibatkan angka dan strategi</li>
</ul>

<h3>3. Pecah Masalah Menjadi Langkah Kecil</h3>
<p>Jangan berikan soal "48 ÷ 6 = ?" secara langsung. Pecah menjadi:</p>
<ol>
<li>Kita punya 48 kelereng</li>
<li>Kita mau bagi rata ke 6 anak</li>
<li>Berapa kelereng untuk setiap anak?</li>
<li>Coba bagikan satu per satu…</li>
</ol>

<h3>4. Berikan Waktu dan Hindari Tekanan</h3>
<p>Speed drill (latihan cepat) justru kontraproduktif untuk anak diskalkulia. Berikan waktu yang cukup dan <strong>fokus pada pemahaman konsep, bukan kecepatan</strong>.</p>

<h2>Akomodasi di Sekolah</h2>
<p>Diskusikan dengan guru tentang akomodasi berikut:</p>
<ul>
<li>Waktu tambahan saat ujian matematika</li>
<li>Diizinkan menggunakan kalkulator untuk soal yang menguji konsep, bukan aritmetika</li>
<li>Lembar soal dengan ruang kerja yang lebih luas</li>
<li>Penggunaan kertas bergaris kotak untuk menjaga keselarasan angka</li>
<li>Penilaian alternatif yang mengukur pemahaman konsep secara lisan</li>
</ul>

<blockquote>
<p><strong>Penting:</strong> Diskalkulia tidak bisa disembuhkan, tetapi dengan strategi yang tepat, anak dapat mengembangkan kemampuan matematika fungsional yang memadai untuk kehidupan sehari-hari dan akademik.</p>
</blockquote>
      `.trim(),
      type: "ARTICLE" as const,
      category: "LEARNING_DIFFICULTIES" as const,
      isPremium: false,
      readTimeMins: 10,
      ageRangeMin: 5,
      ageRangeMax: 14,
    },

    // ─────────────────────────────────────────────
    // CATEGORY: BEHAVIORAL_SUPPORT (Dukungan Perilaku)
    // ─────────────────────────────────────────────
    {
      title: "Teknik Manajemen Perilaku untuk Anak ADHD: Panduan Berbasis Bukti",
      slug: "teknik-manajemen-perilaku-anak-adhd",
      excerpt: "Strategi praktis dan terbukti efektif dari para ahli untuk membantu anak ADHD mengelola perilaku, meningkatkan fokus, dan membangun kebiasaan positif di rumah maupun sekolah.",
      content: `
<h2>Memahami Perilaku Anak ADHD</h2>
<p>ADHD (Attention Deficit Hyperactivity Disorder) bukan tentang anak yang nakal atau kurang disiplin. Ini adalah <strong>kondisi neurobiologis</strong> di mana otak memproses dopamin secara berbeda, menyebabkan kesulitan dalam mengatur perhatian, mengendalikan impuls, dan mengatur tingkat aktivitas.</p>
<p>Memahami bahwa perilaku anak ADHD berakar pada neurologi — bukan niat — adalah langkah pertama menuju manajemen yang efektif. Bukan berarti kita membiarkan perilaku negatif, melainkan kita <strong>mengubah pendekatan</strong> dari menghukum menjadi membimbing.</p>

<h2>Prinsip Dasar Manajemen Perilaku</h2>
<h3>1. Struktur dan Prediktabilitas</h3>
<p>Otak ADHD bekerja lebih baik dalam lingkungan yang terstruktur. Buat rutinitas harian yang konsisten:</p>
<ul>
<li><strong>Jadwal visual</strong> — Tempel di dinding kamar anak, gunakan gambar untuk anak yang lebih kecil</li>
<li><strong>Rutinitas pagi</strong> — Bangun → Mandi → Sarapan → Siapkan tas → Berangkat (selalu dalam urutan yang sama)</li>
<li><strong>Timer visual</strong> — Gunakan timer pasir atau timer digital untuk membantu anak memahami durasi aktivitas</li>
<li><strong>Transisi yang jelas</strong> — Beri peringatan 10 menit, 5 menit, dan 1 menit sebelum pergantian aktivitas</li>
</ul>

<h3>2. Penguatan Positif (Positive Reinforcement)</h3>
<p>Anak ADHD menerima jauh lebih banyak teguran daripada pujian setiap harinya. Riset menunjukkan <strong>rasio ideal adalah 5:1</strong> — lima respons positif untuk setiap satu koreksi.</p>
<ul>
<li><strong>Spesifik dalam memuji</strong> — "Hebat, kamu langsung duduk begitu Bu Guru minta!" lebih efektif dari "Anak pintar!"</li>
<li><strong>Tangkap perilaku baik</strong> — Aktif mencari momen ketika anak melakukan hal yang benar, lalu segera berikan pengakuan</li>
<li><strong>Sistem token</strong> — Kumpulkan stiker atau poin untuk ditukar dengan hadiah yang disepakati bersama</li>
</ul>

<h3>3. Aturan yang Jelas dan Konsisten</h3>
<ul>
<li>Buat <strong>maksimal 5 aturan rumah</strong> yang spesifik dan positif (misalnya "Tangan untuk diri sendiri" bukan "Jangan memukul")</li>
<li>Tulis aturan dan tempel di tempat yang terlihat</li>
<li>Pastikan <strong>semua pengasuh</strong> (ayah, ibu, kakek, nenek, babysitter) menerapkan aturan yang sama</li>
<li>Konsekuensi harus konsisten, segera, dan proporsional</li>
</ul>

<h2>Strategi Spesifik untuk Situasi Umum</h2>
<h3>Waktu Mengerjakan PR</h3>
<ul>
<li>Pecah tugas besar menjadi potongan kecil (10–15 menit per sesi)</li>
<li>Berikan jeda gerakan di antara sesi — lompat-lompat, push-up, atau jalan-jalan sebentar</li>
<li>Sediakan meja belajar yang minim distraksi — jauh dari TV, jendela, dan mainan</li>
<li>Gunakan <strong>teknik "body double"</strong> — anak bekerja lebih fokus ketika ada orang lain yang juga bekerja di dekatnya</li>
</ul>

<h3>Mengatasi Ledakan Emosi (Meltdown)</h3>
<ol>
<li><strong>Tetap tenang</strong> — Nada suara rendah dan stabil. Anak tidak bisa belajar saat otak dalam mode "fight or flight"</li>
<li><strong>Validasi perasaan</strong> — "Ibu lihat kamu sangat kesal. Wajar kalau kesal."</li>
<li><strong>Beri ruang</strong> — Jika aman, biarkan anak menenangkan diri di "sudut tenang" yang sudah disiapkan</li>
<li><strong>Refleksi setelah tenang</strong> — Baru bahas apa yang terjadi dan solusi alternatif setelah anak benar-benar tenang (bisa 20–30 menit kemudian)</li>
</ol>

<h3>Meningkatkan Kepatuhan</h3>
<ul>
<li><strong>Berdiri dekat</strong> — Berikan instruksi dari jarak dekat, bukan berteriak dari ruang lain</li>
<li><strong>Kontak mata</strong> — Sejajarkan tinggi mata Anda dengan anak</li>
<li><strong>Satu instruksi</strong> — Berikan satu perintah pada satu waktu, tunggu selesai baru lanjut</li>
<li><strong>Minta anak mengulangi</strong> — "Coba ulangi, tadi Ibu minta apa?"</li>
</ul>

<h2>Kesalahan Umum yang Harus Dihindari</h2>
<ul>
<li><strong>Berteriak atau mengancam</strong> — Meningkatkan stres dan justru memperburuk perilaku</li>
<li><strong>Hukuman fisik</strong> — Tidak pernah efektif, merusak hubungan, dan meningkatkan risiko masalah perilaku jangka panjang</li>
<li><strong>Membandingkan dengan saudara</strong> — "Kakak kamu bisa, masa kamu tidak?" sangat merusak harga diri</li>
<li><strong>Menghilangkan semua aktivitas menyenangkan</strong> — Anak ADHD membutuhkan outlet fisik dan kreatif</li>
<li><strong>Tidak konsisten</strong> — Aturan yang berubah-ubah membingungkan anak ADHD yang sangat butuh prediktabilitas</li>
</ul>

<h2>Kapan Mempertimbangkan Bantuan Profesional?</h2>
<p>Strategi perilaku saja mungkin tidak cukup jika:</p>
<ul>
<li>Perilaku anak membahayakan diri sendiri atau orang lain</li>
<li>Prestasi akademik terus menurun meskipun sudah ada akomodasi</li>
<li>Anak menunjukkan gejala depresi atau kecemasan</li>
<li>Hubungan sosial anak sangat terganggu</li>
</ul>
<p>Konsultasikan dengan <strong>psikiater anak</strong> atau <strong>spesialis ortopedagogik</strong> untuk evaluasi menyeluruh. Terapi perilaku yang dikombinasikan dengan pendekatan lain seringkali memberikan hasil terbaik.</p>
      `.trim(),
      type: "ARTICLE" as const,
      category: "BEHAVIORAL_SUPPORT" as const,
      isPremium: false,
      readTimeMins: 14,
      ageRangeMin: 4,
      ageRangeMax: 16,
    },
    {
      title: "Memahami dan Mengelola Perilaku Tantrum pada Anak Berkebutuhan Khusus",
      slug: "mengelola-tantrum-anak-berkebutuhan-khusus",
      excerpt: "Tantrum pada anak berkebutuhan khusus berbeda dengan tantrum pada umumnya. Pelajari perbedaannya, pahami pemicunya, dan kuasai teknik de-eskalasi yang aman dan efektif.",
      content: `
<h2>Tantrum vs Meltdown: Perbedaan yang Penting</h2>
<p>Sebelum membahas strategi, penting untuk memahami perbedaan antara <strong>tantrum</strong> dan <strong>meltdown</strong> — keduanya terlihat serupa namun memiliki penyebab dan penanganan yang sangat berbeda.</p>

<table>
<thead>
<tr><th>Aspek</th><th>Tantrum</th><th>Meltdown</th></tr>
</thead>
<tbody>
<tr><td><strong>Tujuan</strong></td><td>Mendapatkan sesuatu atau menghindari sesuatu</td><td>Tidak ada tujuan — ini adalah respons terhadap kelebihan beban</td></tr>
<tr><td><strong>Kesadaran</strong></td><td>Anak masih sadar akan lingkungan sekitar</td><td>Anak kehilangan kendali — tidak bisa berhenti meskipun mau</td></tr>
<tr><td><strong>Penonton</strong></td><td>Biasanya berhenti jika tidak ada yang menonton</td><td>Berlanjut terlepas ada penonton atau tidak</td></tr>
<tr><td><strong>Penanganan</strong></td><td>Jangan berikan yang diminta saat tantrum</td><td>Kurangi stimulus, beri ruang aman</td></tr>
</tbody>
</table>

<h2>Mengidentifikasi Pemicu (Trigger)</h2>
<p>Setiap anak memiliki pemicu yang berbeda. Gunakan metode <strong>ABC (Antecedent–Behavior–Consequence)</strong> untuk mengidentifikasi pola:</p>
<ul>
<li><strong>A (Antecedent)</strong> — Apa yang terjadi sesaat sebelum perilaku? Apakah ada perubahan rutinitas? Stimulus sensorik?</li>
<li><strong>B (Behavior)</strong> — Seperti apa perilakunya secara spesifik? Menangis? Memukul? Melempar barang?</li>
<li><strong>C (Consequence)</strong> — Apa yang terjadi setelahnya? Apakah anak mendapatkan yang diinginkan? Apakah aktivitas yang tidak disukai dihentikan?</li>
</ul>
<p>Catat pola ABC selama 1–2 minggu. Anda akan mulai melihat <strong>pola yang berulang</strong> — ini adalah kunci pencegahan.</p>

<h2>Pemicu Umum pada Anak Berkebutuhan Khusus</h2>
<ul>
<li><strong>Kelebihan sensorik</strong> — Suara bising, lampu terang, keramaian, tekstur pakaian</li>
<li><strong>Perubahan rutinitas mendadak</strong> — Jadwal berubah tanpa peringatan</li>
<li><strong>Kesulitan berkomunikasi</strong> — Frustrasi karena tidak bisa mengungkapkan kebutuhan</li>
<li><strong>Transisi antar aktivitas</strong> — Berpindah dari aktivitas yang disukai ke yang tidak disukai</li>
<li><strong>Kelelahan atau lapar</strong> — Kebutuhan fisiologis dasar yang tidak terpenuhi</li>
<li><strong>Tuntutan yang terlalu tinggi</strong> — Tugas yang melebihi kemampuan saat itu</li>
</ul>

<h2>Strategi Pencegahan (Proaktif)</h2>
<h3>1. Visual Schedule</h3>
<p>Buat jadwal visual dengan gambar atau foto untuk setiap aktivitas. Ini membantu anak memahami apa yang akan terjadi selanjutnya dan mengurangi kecemasan terhadap ketidakpastian.</p>

<h3>2. Social Stories</h3>
<p>Buat cerita pendek bergambar tentang situasi yang sering memicu perilaku. Misalnya: "Kadang kita harus menunggu giliran. Menunggu memang susah. Saat menunggu, aku bisa menarik napas dalam-dalam."</p>

<h3>3. Sensory Diet</h3>
<p>Bekerja sama dengan terapis okupasi untuk membuat "menu sensorik" — aktivitas sensorik yang dijadwalkan sepanjang hari untuk menjaga regulasi diri anak:</p>
<ul>
<li>Pagi: Lompat trampolin 5 menit sebelum sekolah</li>
<li>Siang: Main playdough atau kinetic sand</li>
<li>Sore: Berenang atau bermain air</li>
<li>Malam: Pijat ringan sebelum tidur</li>
</ul>

<h2>Teknik De-eskalasi Saat Terjadi</h2>
<ol>
<li><strong>Pastikan keamanan</strong> — Jauhkan benda berbahaya, lindungi anak dari benturan</li>
<li><strong>Kurangi stimulus</strong> — Matikan TV, redupkan lampu, minta orang lain memberi ruang</li>
<li><strong>Gunakan suara rendah dan kalimat pendek</strong> — "Kamu aman. Ibu di sini."</li>
<li><strong>Tawarkan alat regulasi</strong> — Selimut tebal, headphone peredam, bantal peluk, squishy</li>
<li><strong>Jangan bicara banyak</strong> — Otak yang overload tidak bisa memproses bahasa. Diam menemani lebih efektif</li>
<li><strong>Tunggu sampai tenang</strong> — Setelah tenang baru bicara dengan perlahan tentang apa yang terjadi</li>
</ol>

<h2>Yang TIDAK Boleh Dilakukan</h2>
<ul>
<li>Berteriak atau menunjukkan kemarahan Anda</li>
<li>Memegang atau menahan anak secara paksa (kecuali situasi berbahaya)</li>
<li>Memberikan ancaman atau ultimatum</li>
<li>Mempermalukan anak di depan orang lain</li>
<li>Membahas perilaku saat anak masih dalam kondisi emosional</li>
</ul>

<h2>Merawat Diri Sendiri</h2>
<p>Mendampingi anak dengan perilaku tantrum/meltdown intens sangat menguras emosi. Anda perlu:</p>
<ul>
<li>Memiliki <strong>support system</strong> — teman, keluarga, atau komunitas sesama orang tua ABK</li>
<li>Tidak merasa bersalah saat butuh waktu untuk diri sendiri</li>
<li>Mencari bantuan profesional jika merasa kewalahan atau mengalami burnout</li>
</ul>
      `.trim(),
      type: "ARTICLE" as const,
      category: "BEHAVIORAL_SUPPORT" as const,
      isPremium: true,
      readTimeMins: 13,
      ageRangeMin: 2,
      ageRangeMax: 12,
    },

    // ─────────────────────────────────────────────
    // CATEGORY: COMMUNICATION_DISORDERS (Gangguan Komunikasi)
    // ─────────────────────────────────────────────
    {
      title: "Komunikasi AAC: Panduan Lengkap Sistem Komunikasi Alternatif dan Augmentatif",
      slug: "komunikasi-aac-alternatif-augmentatif",
      excerpt: "Ketika kata-kata tidak cukup, AAC membuka jalan baru. Panduan komprehensif tentang sistem komunikasi alternatif untuk anak dengan gangguan komunikasi — dari low-tech hingga high-tech.",
      content: `
<h2>Apa Itu AAC?</h2>
<p><strong>Augmentative and Alternative Communication (AAC)</strong> adalah semua bentuk komunikasi selain bicara verbal yang digunakan untuk mengekspresikan pikiran, kebutuhan, keinginan, dan perasaan. AAC bukan pengganti bicara — justru penelitian menunjukkan bahwa penggunaan AAC <strong>mendukung dan seringkali meningkatkan</strong> perkembangan bicara verbal.</p>
<p>Mitos terbesar tentang AAC adalah bahwa penggunaannya akan membuat anak "malas bicara." Riset selama 30 tahun secara konsisten membuktikan hal sebaliknya.</p>

<h2>Siapa yang Membutuhkan AAC?</h2>
<ul>
<li>Anak dengan <strong>Autism Spectrum Disorder (ASD)</strong> yang mengalami keterlambatan atau ketiadaan bicara</li>
<li>Anak dengan <strong>apraxia</strong> — otak kesulitan mengoordinasikan gerakan mulut untuk bicara</li>
<li>Anak dengan <strong>cerebral palsy</strong> yang memengaruhi otot-otot bicara</li>
<li>Anak dengan <strong>Down syndrome</strong> yang mengalami keterlambatan bahasa ekspresif</li>
<li>Anak dengan gangguan bahasa yang signifikan akibat kondisi apapun</li>
</ul>

<h2>Jenis-Jenis Sistem AAC</h2>
<h3>1. AAC Tanpa Alat Bantu (Unaided)</h3>
<p>Menggunakan tubuh sendiri tanpa perangkat eksternal:</p>
<ul>
<li><strong>Bahasa isyarat</strong> — BISINDO (Bahasa Isyarat Indonesia) atau sistem isyarat lainnya</li>
<li><strong>Gestur alami</strong> — Menunjuk, mengangguk, menggeleng, melambaikan tangan</li>
<li><strong>Ekspresi wajah</strong> — Senyum, cemberut, kontak mata untuk menunjukkan pilihan</li>
</ul>

<h3>2. AAC Low-Tech</h3>
<p>Alat bantu sederhana yang tidak memerlukan baterai atau listrik:</p>
<ul>
<li><strong>PECS (Picture Exchange Communication System)</strong> — Anak menyerahkan kartu bergambar untuk menyampaikan keinginan</li>
<li><strong>Papan komunikasi</strong> — Papan berisi simbol/gambar yang bisa ditunjuk anak</li>
<li><strong>Buku komunikasi</strong> — Kumpulan halaman berisi simbol yang diorganisir berdasarkan kategori</li>
<li><strong>Jadwal visual</strong> — Deretan gambar yang menunjukkan urutan aktivitas</li>
</ul>

<h3>3. AAC High-Tech</h3>
<p>Perangkat elektronik yang menghasilkan output suara:</p>
<ul>
<li><strong>Tablet dengan aplikasi AAC</strong> — Seperti Proloquo2Go, TouchChat, atau LAMP Words for Life</li>
<li><strong>Perangkat AAC khusus</strong> — Tobii Dynavox dan sejenisnya dengan fitur eye-tracking</li>
<li><strong>Aplikasi gratis</strong> — LetMeTalk, Niki Talk (tersedia dalam Bahasa Indonesia)</li>
</ul>

<h2>Memulai Perjalanan AAC</h2>
<h3>Langkah 1: Evaluasi oleh Terapis Wicara</h3>
<p>Terapis wicara (Speech-Language Pathologist) yang berpengalaman dalam AAC akan mengevaluasi:</p>
<ul>
<li>Kemampuan komunikasi anak saat ini</li>
<li>Kemampuan motorik (untuk menentukan metode akses)</li>
<li>Kemampuan kognitif dan visual</li>
<li>Lingkungan komunikasi anak (rumah, sekolah, terapi)</li>
</ul>

<h3>Langkah 2: Pilih Sistem yang Tepat</h3>
<p>Tidak ada satu sistem yang cocok untuk semua anak. Pertimbangkan:</p>
<ul>
<li>Usia dan kemampuan motorik anak</li>
<li>Tingkat kosakata yang dibutuhkan</li>
<li>Portabilitas — harus bisa dibawa ke mana-mana</li>
<li>Kemampuan keluarga dalam mendukung penggunaan</li>
</ul>

<h3>Langkah 3: Modeling, Modeling, Modeling</h3>
<p>Ini adalah kunci terpenting. <strong>Modeling</strong> berarti Anda sebagai orang dewasa juga menggunakan AAC saat berkomunikasi dengan anak. Sama seperti bayi belajar bicara karena mendengar orang dewasa berbicara, anak AAC belajar menggunakan sistem dengan melihat orang lain menggunakannya.</p>
<ul>
<li>Tunjuk simbol di papan komunikasi saat Anda berbicara</li>
<li>Gunakan aplikasi AAC untuk menyertai ucapan verbal Anda</li>
<li>Mulai dengan modeling 1–2 kata inti di setiap interaksi</li>
<li>Jangan memaksa anak untuk mengulangi — cukup modelkan secara konsisten</li>
</ul>

<h2>Kata Inti (Core Words) — Fondasi AAC</h2>
<p>Riset menunjukkan bahwa <strong>50 kata inti</strong> membentuk sekitar 80% dari semua yang kita ucapkan. Fokuskan pengajaran pada kata-kata ini:</p>
<ul>
<li><strong>Kata kerja:</strong> mau, tidak, lagi, berhenti, pergi, lihat, buka, bantu, makan, minum</li>
<li><strong>Kata sifat:</strong> besar, kecil, banyak, sedikit, bagus</li>
<li><strong>Kata ganti:</strong> aku, kamu, itu, ini, sini, sana</li>
<li><strong>Kata sosial:</strong> halo, dadah, tolong, terima kasih, maaf</li>
</ul>

<h2>Kesalahan Umum yang Harus Dihindari</h2>
<ul>
<li><strong>"Dia belum siap untuk AAC"</strong> — Tidak ada prasyarat untuk mulai menggunakan AAC. Semakin dini, semakin baik</li>
<li><strong>Hanya mengajarkan kata benda</strong> — Anak tidak bisa membuat kalimat hanya dengan nama benda. Kata kerja dan kata inti jauh lebih fungsional</li>
<li><strong>Memaksa anak menunjuk sebelum diberi barang</strong> — AAC bukan tes, tapi alat komunikasi. Jangan jadikan sebagai syarat</li>
<li><strong>Menyembunyikan AAC sebagai "hadiah"</strong> — AAC harus selalu tersedia, seperti suara kita yang selalu bisa digunakan</li>
</ul>

<blockquote>
<p><strong>"Semua orang berhak berkomunikasi. Komunikasi bukan hak istimewa — itu hak asasi manusia."</strong> — National Joint Committee for the Communication Needs of Persons with Severe Disabilities</p>
</blockquote>
      `.trim(),
      type: "MODULE" as const,
      category: "COMMUNICATION_DISORDERS" as const,
      isPremium: true,
      readTimeMins: 16,
      ageRangeMin: 1,
      ageRangeMax: 18,
    },
    {
      title: "Speech Delay vs Gangguan Bahasa: Memahami Perbedaan yang Krusial",
      slug: "speech-delay-vs-gangguan-bahasa",
      excerpt: "Anak Anda terlambat bicara — apakah hanya 'late bloomer' atau ada yang perlu diperhatikan? Kenali perbedaan antara keterlambatan bicara dan gangguan bahasa, serta kapan harus bertindak.",
      content: `
<h2>Perkembangan Bahasa Normal: Milestone yang Perlu Diketahui</h2>
<p>Sebelum membahas keterlambatan, penting untuk memahami milestone perkembangan bahasa yang tipikal:</p>

<table>
<thead>
<tr><th>Usia</th><th>Kemampuan yang Diharapkan</th></tr>
</thead>
<tbody>
<tr><td><strong>6–12 bulan</strong></td><td>Babbling (ba-ba, ma-ma), merespons nama sendiri, memahami "tidak"</td></tr>
<tr><td><strong>12–18 bulan</strong></td><td>Kata pertama yang bermakna (1–20 kata), menunjuk benda yang diinginkan</td></tr>
<tr><td><strong>18–24 bulan</strong></td><td>Menggabungkan 2 kata ("Mama pergi"), kosakata 50+ kata</td></tr>
<tr><td><strong>2–3 tahun</strong></td><td>Kalimat 3–4 kata, orang asing memahami ±50% ucapannya</td></tr>
<tr><td><strong>3–4 tahun</strong></td><td>Kalimat kompleks, bercerita sederhana, orang asing memahami ±75%</td></tr>
<tr><td><strong>4–5 tahun</strong></td><td>Bicara jelas dan lancar, orang asing memahami hampir seluruhnya</td></tr>
</tbody>
</table>

<h2>Speech Delay (Keterlambatan Bicara)</h2>
<p>Speech delay berarti anak mengikuti pola perkembangan bahasa yang normal, tetapi <strong>lebih lambat dari jadwal yang diharapkan</strong>.</p>
<h3>Ciri-ciri:</h3>
<ul>
<li>Pemahaman bahasa (reseptif) sesuai usia — anak mengerti apa yang dikatakan kepadanya</li>
<li>Kemampuan mengekspresikan diri (ekspresif) yang tertinggal</li>
<li>Komunikasi nonverbal baik — menunjuk, menarik tangan, menggunakan gestur</li>
<li>Bermain sesuai usia</li>
<li>Interaksi sosial baik — kontak mata, berbagi perhatian</li>
</ul>

<h2>Gangguan Bahasa (Language Disorder)</h2>
<p>Gangguan bahasa adalah kondisi yang lebih kompleks di mana perkembangan bahasa anak <strong>berbeda secara kualitatif</strong>, bukan sekadar terlambat.</p>
<h3>Jenis gangguan bahasa:</h3>
<ul>
<li><strong>Gangguan bahasa reseptif</strong> — Kesulitan memahami bahasa yang didengar</li>
<li><strong>Gangguan bahasa ekspresif</strong> — Kesulitan mengekspresikan pikiran dalam kata</li>
<li><strong>Gangguan bahasa campuran</strong> — Kombinasi keduanya</li>
</ul>

<h3>Tanda peringatan:</h3>
<ul>
<li>Tidak merespons nama sendiri pada usia 12 bulan</li>
<li>Tidak menunjuk atau menggunakan gestur pada usia 12 bulan</li>
<li>Tidak ada satu kata pun pada usia 16 bulan</li>
<li>Tidak bisa menggabungkan 2 kata pada usia 24 bulan</li>
<li>Kehilangan kemampuan bahasa yang sudah pernah dimiliki (regresi)</li>
<li>Tidak memahami instruksi sederhana sesuai usia</li>
</ul>

<h2>Mitos "Late Bloomer"</h2>
<p>Mitos yang paling berbahaya adalah <strong>"Tunggu saja, nanti juga bisa sendiri."</strong> Memang benar sebagian anak yang terlambat bicara akhirnya menyusul — ini disebut <em>late bloomers</em>. Namun:</p>
<ul>
<li>Tidak ada cara untuk memprediksi apakah anak Anda termasuk late bloomer atau tidak</li>
<li>Riset menunjukkan bahwa 20–30% anak yang dianggap late bloomer ternyata memiliki gangguan bahasa yang persisten</li>
<li>Intervensi dini tidak merugikan siapapun — bahkan late bloomers mendapat manfaat</li>
<li><strong>Menunggu = membuang waktu emas perkembangan otak</strong></li>
</ul>

<h2>Apa yang Harus Dilakukan Orang Tua?</h2>
<h3>Segera Lakukan:</h3>
<ol>
<li><strong>Periksa pendengaran</strong> — Gangguan pendengaran adalah penyebab tersembunyi paling umum dari keterlambatan bicara</li>
<li><strong>Konsultasi ke dokter anak</strong> — Untuk skrining perkembangan awal</li>
<li><strong>Rujukan ke terapis wicara</strong> — Untuk evaluasi formal kemampuan bahasa</li>
</ol>

<h3>Stimulasi Bahasa di Rumah:</h3>
<ul>
<li><strong>Narasi aktivitas</strong> — "Ibu sedang cuci piring. Ini piring kotor. Ibu pakai sabun. Sekarang bilas."</li>
<li><strong>Ekspansi</strong> — Anak bilang "Mobil!", Anda respons "Ya, mobil merah! Mobil merah jalan cepat!"</li>
<li><strong>Pilihan</strong> — "Mau susu atau air?" alih-alih pertanyaan ya/tidak</li>
<li><strong>Bacakan buku</strong> — Minimal 15 menit per hari, tunjuk gambar, buat interaktif</li>
<li><strong>Kurangi screen time</strong> — Layar tidak bisa menggantikan interaksi manusia untuk perkembangan bahasa</li>
<li><strong>Bernyanyi bersama</strong> — Lagu dengan gerakan (seperti "Kepala Pundak Lutut Kaki") sangat efektif</li>
</ul>

<blockquote>
<p><strong>Prinsip emas:</strong> Jika Anda ragu apakah perkembangan bahasa anak normal atau tidak, selalu lebih baik berkonsultasi. Profesional tidak akan menilai Anda sebagai orang tua yang berlebihan — mereka justru menghargai kewaspadaan dini.</p>
</blockquote>
      `.trim(),
      type: "ARTICLE" as const,
      category: "COMMUNICATION_DISORDERS" as const,
      isPremium: false,
      readTimeMins: 11,
      ageRangeMin: 0,
      ageRangeMax: 6,
    },

    // ─────────────────────────────────────────────
    // CATEGORY: SENSORY_PROCESSING (Pemrosesan Sensorik)
    // ─────────────────────────────────────────────
    {
      title: "Sensory Processing Disorder: Memahami Dunia dari Perspektif Anak Anda",
      slug: "sensory-processing-disorder-panduan",
      excerpt: "Mengapa anak Anda menutup telinga di tempat ramai? Atau justru tidak merespons rasa sakit? Pahami bagaimana gangguan pemrosesan sensorik memengaruhi kehidupan sehari-hari anak.",
      content: `
<h2>Apa Itu Sensory Processing Disorder (SPD)?</h2>
<p>Sensory Processing Disorder adalah kondisi di mana otak kesulitan menerima, mengorganisir, dan merespons informasi dari indra secara tepat. Bayangkan otak sebagai <strong>pengatur lalu lintas</strong> untuk semua informasi sensorik — pada anak dengan SPD, pengatur lalu lintas ini bekerja tidak teratur, menyebabkan "kemacetan" atau "kecelakaan" dalam pemrosesan.</p>
<p>SPD bisa berdiri sendiri atau menyertai kondisi lain seperti autisme, ADHD, atau gangguan perkembangan lainnya. Diperkirakan 5–16% anak mengalami SPD dalam berbagai tingkat keparahan.</p>

<h2>8 Sistem Sensorik Manusia</h2>
<p>Kebanyakan orang hanya mengenal 5 indra. Padahal ada 8 sistem sensorik yang semuanya bisa terdampak SPD:</p>
<ol>
<li><strong>Visual (penglihatan)</strong> — Memproses cahaya, warna, gerakan, kontras</li>
<li><strong>Auditori (pendengaran)</strong> — Memproses suara, volume, nada, arah</li>
<li><strong>Taktil (sentuhan)</strong> — Memproses tekanan, tekstur, suhu, rasa sakit</li>
<li><strong>Gustatori (pengecap)</strong> — Memproses rasa: manis, asin, pahit, asam, umami</li>
<li><strong>Olfaktori (penciuman)</strong> — Memproses bau</li>
<li><strong>Vestibular (keseimbangan)</strong> — Memproses posisi kepala, gravitasi, gerakan</li>
<li><strong>Proprioseptif (posisi tubuh)</strong> — Memproses informasi dari otot dan sendi tentang posisi tubuh</li>
<li><strong>Interoseptif (sinyal internal)</strong> — Memproses sinyal dari dalam tubuh: lapar, haus, perlu ke toilet, suhu tubuh</li>
</ol>

<h2>Dua Pola Utama SPD</h2>
<h3>1. Hipersensitif (Over-Responsive / Sensory Avoiding)</h3>
<p>Otak menerima sinyal sensorik secara <strong>berlebihan</strong>. Stimulus yang biasa terasa luar biasa intens.</p>
<p><strong>Tanda-tanda:</strong></p>
<ul>
<li>Menutup telinga di tempat ramai (suara yang bagi kita normal terasa menyakitkan bagi mereka)</li>
<li>Menolak pakaian tertentu — label baju terasa seperti "digaruk terus-menerus"</li>
<li>Sangat pilih-pilih makanan — menolak berdasarkan tekstur, bukan rasa</li>
<li>Menghindari disentuh, dicium, atau dipeluk</li>
<li>Sangat terganggu oleh bau yang orang lain bahkan tidak perhatikan</li>
<li>Menolak bermain di playground — takut ketinggian, gerakan, atau tekstur pasir</li>
<li>Meltdown di tempat ramai seperti mal atau pasar</li>
</ul>

<h3>2. Hiposensitif (Under-Responsive / Sensory Seeking)</h3>
<p>Otak <strong>kurang menerima</strong> sinyal sensorik, sehingga anak mencari stimulus lebih banyak.</p>
<p><strong>Tanda-tanda:</strong></p>
<ul>
<li>Tidak merespons saat dipanggil meskipun pendengaran normal</li>
<li>Ambang rasa sakit sangat tinggi — terjatuh dan berdarah tapi tidak menangis</li>
<li>Suka bertabrakan, melompat dari ketinggian, berputar tanpa pusing</li>
<li>Mengunyah kerah baju, pensil, atau benda non-makanan lainnya</li>
<li>Selalu menyentuh segala sesuatu dan semua orang</li>
<li>Suka suara keras, musik volume tinggi</li>
<li>Tidak menyadari wajah kotor atau hidung berair</li>
</ul>

<p><strong>Penting:</strong> Satu anak bisa hipersensitif di satu area dan hiposensitif di area lain. Misalnya, hipersensitif terhadap suara tapi hiposensitif terhadap sentuhan.</p>

<h2>Dampak SPD pada Kehidupan Sehari-hari</h2>
<h3>Di Rumah</h3>
<ul>
<li>Waktu makan jadi pertempuran karena masalah tekstur dan bau</li>
<li>Berpakaian memakan waktu lama karena anak menolak banyak jenis pakaian</li>
<li>Mandi bisa sangat menyenangkan (sensory seeking) atau sangat menakutkan (sensory avoiding)</li>
<li>Tidur terganggu — terlalu sensitif terhadap suara, cahaya, atau tekstur seprai</li>
</ul>

<h3>Di Sekolah</h3>
<ul>
<li>Sulit duduk diam di kelas (butuh input proprioseptif/vestibular)</li>
<li>Menghindari kegiatan seni yang melibatkan lem, cat, atau tekstur tertentu</li>
<li>Kantin sekolah terasa overwhelming — bau, suara, keramaian sekaligus</li>
<li>Kesulitan menulis karena masalah genggaman dan tekanan pensil</li>
</ul>

<h2>Strategi Sensori di Rumah</h2>
<h3>Untuk Anak Hipersensitif:</h3>
<ul>
<li><strong>Zona tenang</strong> — Siapkan sudut di rumah dengan pencahayaan redup, bantal, selimut tebal, dan headphone peredam</li>
<li><strong>Pakaian ramah sensorik</strong> — Tanpa label, berbahan lembut, jahitan halus, elastis</li>
<li><strong>Persiapkan sebelum situasi menantang</strong> — "Kita akan ke mal. Akan ramai dan berisik. Kamu boleh pakai headphone."</li>
<li><strong>Deep pressure</strong> — Pelukan kuat, selimut berbobot (weighted blanket), rolling dengan bola gym</li>
</ul>

<h3>Untuk Anak Hiposensitif (Sensory Seeking):</h3>
<ul>
<li><strong>Movement breaks</strong> — Jadwalkan waktu untuk lompat trampolin, berayun, atau berputar setiap 30–45 menit</li>
<li><strong>Chewy tools</strong> — Sediakan alat kunyah yang aman sebagai pengganti mengunyah benda sembarangan</li>
<li><strong>Heavy work</strong> — Aktivitas yang memberi input proprioseptif: mendorong gerobak, membawa ransel berisi buku, push-up di dinding</li>
<li><strong>Fidget tools</strong> — Squishy, putty, fidget spinner — bukan pengalih, tapi alat regulasi</li>
</ul>

<h2>Kapan Mencari Bantuan Profesional?</h2>
<p>Konsultasikan dengan <strong>terapis okupasi yang spesialisasi di integrasi sensorik</strong> jika:</p>
<ul>
<li>Masalah sensorik mengganggu aktivitas sehari-hari secara signifikan</li>
<li>Anak sering meltdown tanpa pemicu yang jelas</li>
<li>Anak menolak berpartisipasi dalam kegiatan sekolah</li>
<li>Pola makan sangat terbatas (kurang dari 20 jenis makanan)</li>
<li>Anak mengalami kesulitan tidur yang persisten</li>
</ul>
      `.trim(),
      type: "ARTICLE" as const,
      category: "SENSORY_PROCESSING" as const,
      isPremium: false,
      readTimeMins: 15,
      ageRangeMin: 1,
      ageRangeMax: 14,
    },
    {
      title: "Video: Aktivitas Terapi Sensorik yang Bisa Dilakukan di Rumah",
      slug: "video-terapi-sensori-anak-spd",
      excerpt: "Panduan video komprehensif berisi 15+ aktivitas terapi sensorik praktis yang dirancang terapis okupasi, aman dan mudah dilakukan di rumah dengan bahan sehari-hari.",
      content: `
<h2>Tentang Video Ini</h2>
<p>Video ini berisi panduan visual langkah demi langkah untuk <strong>15+ aktivitas terapi sensorik</strong> yang dirancang oleh terapis okupasi bersertifikat. Setiap aktivitas menggunakan bahan yang mudah ditemukan di rumah dan aman untuk anak-anak.</p>

<h2>Yang Akan Anda Pelajari</h2>
<h3>Bagian 1: Aktivitas Taktil (Sentuhan)</h3>
<ul>
<li>Membuat sensory bin dengan beras, pasta, dan biji-bijian</li>
<li>Bermain playdough dengan teknik terapeutik</li>
<li>Finger painting dengan variasi tekstur</li>
<li>Water play dengan suhu berbeda</li>
</ul>

<h3>Bagian 2: Aktivitas Vestibular (Keseimbangan & Gerakan)</h3>
<ul>
<li>Ayunan sederhana dari selimut (2 orang dewasa memegang ujung)</li>
<li>Obstacle course dari bantal dan selimut</li>
<li>Berguling di matras atau karpet tebal</li>
<li>Permainan keseimbangan di atas garis selotip</li>
</ul>

<h3>Bagian 3: Aktivitas Proprioseptif (Kerja Berat)</h3>
<ul>
<li>Animal walks — berjalan seperti beruang, kepiting, katak</li>
<li>Mendorong dan menarik kardus berisi beban</li>
<li>Membuat "burrito" dengan selimut — anak digulung erat lalu perlahan dibuka</li>
<li>Wall push-ups dan chair push-ups</li>
</ul>

<h3>Bagian 4: Calming Strategies (Teknik Menenangkan)</h3>
<ul>
<li>Deep breathing dengan gelembung sabun</li>
<li>Progressive muscle relaxation versi anak</li>
<li>Pijat bertekanan dalam dengan bola terapi</li>
<li>Membuat calming jar (botol glitter)</li>
</ul>

<h2>Penting untuk Diperhatikan</h2>
<ul>
<li>Selalu awasi anak selama aktivitas</li>
<li>Jangan memaksa anak melakukan aktivitas yang mereka tolak</li>
<li>Perkenalkan secara bertahap — mulai dari yang paling bisa diterima</li>
<li>Konsultasikan dengan terapis okupasi untuk program yang disesuaikan dengan kebutuhan spesifik anak Anda</li>
</ul>
      `.trim(),
      type: "VIDEO" as const,
      category: "SENSORY_PROCESSING" as const,
      isPremium: true,
      videoUrl: "https://www.youtube.com/embed/D1HAgOEcMDM",
      readTimeMins: 45,
      ageRangeMin: 2,
      ageRangeMax: 10,
    },

    // ─────────────────────────────────────────────
    // CATEGORY: PARENTING_TIPS (Tips Parenting)
    // ─────────────────────────────────────────────
    {
      title: "Mendampingi Anak Autisme: Panduan Praktis Sehari-hari dari Para Pakar",
      slug: "tips-parenting-anak-autisme",
      excerpt: "Dari rutinitas pagi hingga waktu tidur — panduan komprehensif berisi strategi yang telah terbukti untuk mendampingi anak di spektrum autisme dalam kehidupan sehari-hari.",
      content: `
<h2>Memahami Dunia Anak Autisme</h2>
<p>Autisme adalah spektrum — artinya setiap anak autis unik. Namun, ada benang merah yang sering muncul: <strong>kebutuhan akan prediktabilitas</strong>, <strong>cara pemrosesan sensorik yang berbeda</strong>, dan <strong>pola komunikasi sosial yang khas</strong>. Memahami ketiga hal ini adalah fondasi dari pendampingan yang efektif.</p>
<p>Penting untuk diingat: tujuan kita bukan membuat anak autis "terlihat normal," melainkan membantu mereka <strong>menavigasi dunia dengan lebih nyaman</strong> sambil tetap menghargai identitas dan keunikan mereka.</p>

<h2>Membangun Rutinitas yang Mendukung</h2>
<h3>Mengapa Rutinitas Sangat Penting?</h3>
<p>Bagi banyak anak autis, dunia terasa tidak terprediksi dan penuh ketidakpastian yang mencemaskan. Rutinitas memberikan <strong>rasa aman dan kendali</strong>. Ketika anak tahu apa yang akan terjadi selanjutnya, tingkat kecemasan menurun dan kemampuan untuk belajar serta berinteraksi meningkat.</p>

<h3>Tips Membangun Rutinitas:</h3>
<ul>
<li><strong>Jadwal visual</strong> — Gunakan foto atau ikon untuk setiap aktivitas. Tempel di tempat yang mudah dilihat</li>
<li><strong>First-Then board</strong> — "Pertama mandi, lalu bermain." Sederhana namun sangat efektif</li>
<li><strong>Konsistensi jadwal</strong> — Usahakan waktu makan, mandi, dan tidur sama setiap hari</li>
<li><strong>Persiapan untuk perubahan</strong> — Jika rutinitas harus berubah, beri tahu anak jauh-jauh hari. Gunakan countdown visual</li>
</ul>

<h2>Strategi Komunikasi yang Efektif</h2>
<h3>Sesuaikan Cara Anda Berbicara</h3>
<ul>
<li><strong>Gunakan kalimat pendek dan jelas</strong> — "Ambil sepatu" lebih mudah dipahami daripada "Ayo cepat ambil sepatunya, nanti kita terlambat loh"</li>
<li><strong>Tunggu</strong> — Berikan waktu pemrosesan 10–15 detik sebelum mengulangi instruksi</li>
<li><strong>Hindari bahasa kiasan</strong> — "Hujan kucing dan anjing" akan membingungkan. Gunakan bahasa literal</li>
<li><strong>Visual support</strong> — Sertai instruksi verbal dengan gambar atau gestur</li>
</ul>

<h3>Mendukung Komunikasi Anak</h3>
<ul>
<li>Terima semua bentuk komunikasi — bicara, menunjuk, menarik tangan, AAC, semua valid</li>
<li>Jangan paksa kontak mata — banyak anak autis justru lebih bisa memproses informasi saat tidak memaksakan kontak mata</li>
<li>Perhatikan komunikasi nonverbal mereka — perilaku sering kali adalah komunikasi</li>
</ul>

<h2>Menangani Situasi Sehari-hari</h2>
<h3>Waktu Makan</h3>
<ul>
<li>Banyak anak autis sangat selektif dengan makanan — ini bukan "pilih-pilih biasa" tapi berkaitan dengan sensitivitas sensorik</li>
<li>Jangan memaksa — tekanan justru meningkatkan penolakan</li>
<li>Perkenalkan makanan baru secara bertahap: lihat → sentuh → cium → cicipi ujung lidah → gigit kecil</li>
<li>Sajikan makanan baru bersamaan dengan makanan yang sudah diterima</li>
<li>Konsistensi piring, tempat duduk, dan jadwal makan membantu</li>
</ul>

<h3>Waktu Tidur</h3>
<ul>
<li>Buat ritual tidur yang konsisten — misalnya: mandi → baju tidur → sikat gigi → baca buku → lampu mati</li>
<li>Gunakan selimut berbobot (weighted blanket) jika anak menyukainya</li>
<li>Redupkan lampu 30 menit sebelum tidur</li>
<li>White noise machine bisa membantu anak yang sensitif terhadap suara</li>
<li>Hindari layar minimal 1 jam sebelum tidur</li>
</ul>

<h3>Pergi ke Tempat Baru</h3>
<ul>
<li>Tunjukkan foto tempat tujuan sebelum pergi</li>
<li>Jelaskan apa yang akan terjadi di sana</li>
<li>Bawa "survival kit" — headphone, snack favorit, fidget toy, benda transisi</li>
<li>Siapkan rencana keluar — ketahui di mana area tenang terdekat</li>
<li>Jangan memaksa tinggal jika anak sudah menunjukkan tanda-tanda overload</li>
</ul>

<h2>Mendukung Perkembangan Sosial</h2>
<ul>
<li><strong>Playdates terstruktur</strong> — Undang satu teman, siapkan aktivitas spesifik, batasi durasi</li>
<li><strong>Social stories</strong> — Cerita pendek tentang situasi sosial: "Ketika teman menyapa, aku bisa melambaikan tangan"</li>
<li><strong>Hargai minat khusus</strong> — Minat intens (special interests) bukan masalah yang harus dihilangkan. Justru bisa menjadi jembatan sosial — bergabung dengan komunitas atau klub yang sesuai minat anak</li>
<li><strong>Role-play</strong> — Berlatih skenario sosial di rumah sebelum menghadapinya di dunia nyata</li>
</ul>

<h2>Merawat Diri Anda sebagai Orang Tua</h2>
<p>Anda tidak bisa menuangkan dari gelas yang kosong. Merawat anak berkebutuhan khusus adalah maraton, bukan sprint.</p>
<ul>
<li><strong>Cari komunitas</strong> — Bergabunglah dengan grup orangtua anak autis. Berbagi dengan sesama yang memahami sangat membantu</li>
<li><strong>Tetapkan batasan</strong> — Tidak apa-apa untuk mengatakan "tidak" pada kewajiban tambahan</li>
<li><strong>Minta bantuan</strong> — Bukan tanda kelemahan, tapi kebijaksanaan</li>
<li><strong>Rayakan hal kecil</strong> — Kemajuan anak autis mungkin terlihat berbeda, tapi setiap langkah kecil layak dirayakan</li>
</ul>

<blockquote>
<p><strong>"Jika Anda bertemu satu anak autis, Anda baru bertemu satu anak autis."</strong> — Dr. Stephen Shore. Setiap anak unik. Kenali anak Anda, bukan label diagnosisnya.</p>
</blockquote>
      `.trim(),
      type: "ARTICLE" as const,
      category: "PARENTING_TIPS" as const,
      isPremium: false,
      readTimeMins: 14,
      ageRangeMin: 2,
      ageRangeMax: 16,
    },
    {
      title: "Self-Care untuk Orang Tua Anak Berkebutuhan Khusus: Bukan Egois, Tapi Esensial",
      slug: "self-care-orang-tua-abk",
      excerpt: "Burnout pada orang tua anak berkebutuhan khusus itu nyata. Kenali tandanya, pahami mengapa merawat diri sendiri bukan kemewahan tapi keharusan, dan pelajari strategi praktis untuk menjaga kesejahteraan Anda.",
      content: `
<h2>Realitas yang Jarang Dibicarakan</h2>
<p>Penelitian menunjukkan bahwa orang tua anak berkebutuhan khusus memiliki <strong>tingkat stres yang setara dengan tentara di zona perang</strong>. Ini bukan hiperbola — ini data dari studi kortisol (hormon stres) yang dipublikasikan di jurnal Health Psychology.</p>
<p>Anda mungkin mengenali diri sendiri dalam gambaran ini:</p>
<ul>
<li>Tidur yang selalu kurang dan tidak berkualitas</li>
<li>Rasa bersalah yang konstan — merasa selalu kurang berbuat</li>
<li>Isolasi sosial — teman-teman lama perlahan menjauh</li>
<li>Pasangan yang menjadi "rekan kerja" alih-alih partner romantis</li>
<li>Karier yang dikorbankan atau ditunda tanpa batas waktu</li>
<li>Kecemasan tentang masa depan anak yang tidak pernah berhenti</li>
</ul>

<h2>Mengenali Tanda-Tanda Burnout</h2>
<p>Burnout tidak datang tiba-tiba — ia menyelinap perlahan. Kenali tanda-tandanya:</p>
<ul>
<li><strong>Kelelahan emosional</strong> — Merasa "kosong," tidak bisa merasakan emosi apa pun</li>
<li><strong>Depersonalisasi</strong> — Merasa seperti robot yang menjalankan rutinitas tanpa kehadiran emosional</li>
<li><strong>Sinisme</strong> — Kehilangan harapan bahwa keadaan akan membaik</li>
<li><strong>Iritabilitas berlebihan</strong> — Meledak untuk hal-hal kecil yang biasanya tidak mengganggu</li>
<li><strong>Gejala fisik</strong> — Sakit kepala kronis, gangguan pencernaan, nyeri otot, sering sakit</li>
<li><strong>Penarikan diri</strong> — Menolak ajakan sosial, tidak menjawab telepon, menghindari percakapan</li>
</ul>

<h2>Mengapa Self-Care Bukan Egois</h2>
<p>Di pesawat, instruksi keselamatan selalu mengatakan: <strong>"Pasang masker oksigen Anda terlebih dahulu sebelum membantu orang lain."</strong> Prinsip yang sama berlaku di sini.</p>
<p>Ketika Anda kelelahan, kemampuan Anda untuk merespons kebutuhan anak secara tepat menurun drastis. Anda menjadi lebih reaktif, kurang sabar, dan tidak bisa menggunakan strategi-strategi yang seharusnya Anda terapkan. Self-care bukan tentang Anda mengorbankan waktu anak — ini tentang <strong>memastikan anak mendapatkan versi terbaik dari Anda</strong>.</p>

<h2>Strategi Self-Care yang Realistis</h2>
<h3>Level 1: Micro Self-Care (5 menit)</h3>
<p>Untuk hari-hari di mana Anda benar-benar tidak punya waktu:</p>
<ul>
<li>Tarik napas dalam 5 kali — inhale 4 detik, tahan 4 detik, exhale 6 detik</li>
<li>Minum segelas air dan sadari rasanya</li>
<li>Dengarkan satu lagu favorit dengan headphone</li>
<li>Tulis 3 hal yang berjalan baik hari ini, sekecil apapun</li>
</ul>

<h3>Level 2: Mini Self-Care (30–60 menit)</h3>
<ul>
<li>Mandi air hangat setelah anak tidur — benar-benar menikmati, bukan sekadar rutinitas</li>
<li>Telepon teman yang memahami situasi Anda</li>
<li>Berjalan kaki sendirian di sekitar kompleks</li>
<li>Baca buku atau tonton episode TV yang tidak berhubungan dengan ABK</li>
</ul>

<h3>Level 3: Proper Self-Care (setengah hari atau lebih)</h3>
<ul>
<li>Minta pasangan, keluarga, atau respite care untuk mengambil alih</li>
<li>Lakukan hobi yang sudah lama ditinggalkan</li>
<li>Temui teman untuk makan siang — bicarakan hal-hal selain anak</li>
<li>Ikuti kelas atau workshop untuk pengembangan diri</li>
</ul>

<h2>Membangun Support System</h2>
<h3>1. Pasangan (jika ada)</h3>
<ul>
<li>Jadwalkan "check-in" rutin — 15 menit per hari untuk bicara tentang hal selain anak</li>
<li>Bagi tanggung jawab secara adil — hindari satu orang menanggung semuanya</li>
<li>Cari konseling pasangan jika hubungan mulai merenggang — ini sangat normal dan bukan tanda kegagalan</li>
</ul>

<h3>2. Keluarga Besar</h3>
<ul>
<li>Edukasi mereka tentang kondisi anak Anda — banyak ketidakpahaman berakar dari kurangnya informasi</li>
<li>Berikan instruksi spesifik jika mereka ingin membantu — "Bisa jemput anak di sekolah setiap Rabu?" lebih baik dari "Tolong bantu ya"</li>
<li>Terima bahwa tidak semua orang akan memahami — dan itu tidak apa-apa</li>
</ul>

<h3>3. Komunitas Sesama Orang Tua ABK</h3>
<p>Ini mungkin support system paling berharga. Orang yang mengalami hal serupa memahami tanpa perlu banyak penjelasan. Cari komunitas melalui platform ini atau media sosial.</p>

<h2>Kapan Mencari Bantuan Profesional untuk Diri Sendiri</h2>
<p>Tidak ada yang salah dengan mencari bantuan. Pertimbangkan konseling atau terapi jika:</p>
<ul>
<li>Anda merasa sedih atau hampa hampir setiap hari selama lebih dari 2 minggu</li>
<li>Anda kesulitan bangun dari tempat tidur atau menjalankan fungsi dasar</li>
<li>Anda memiliki pikiran untuk menyakiti diri sendiri</li>
<li>Anda menggunakan alkohol atau zat lain untuk mengatasi stres</li>
<li>Hubungan Anda dengan pasangan atau anak-anak lain terganggu signifikan</li>
</ul>

<blockquote>
<p><strong>Anda melakukan pekerjaan yang luar biasa.</strong> Fakta bahwa Anda membaca artikel ini menunjukkan bahwa Anda peduli — pada anak Anda dan pada diri sendiri. Itu sudah langkah yang sangat besar.</p>
</blockquote>
      `.trim(),
      type: "ARTICLE" as const,
      category: "PARENTING_TIPS" as const,
      isPremium: false,
      readTimeMins: 11,
    },

    // ─────────────────────────────────────────────
    // CATEGORY: EXPERT_GUIDES (Panduan Pakar)
    // ─────────────────────────────────────────────
    {
      title: "Panduan Pakar: Memilih Terapi yang Tepat untuk Anak Anda",
      slug: "panduan-memilih-terapi-tepat-anak",
      excerpt: "Terapi wicara, terapi okupasi, ABA, floortime, sensory integration — banyak pilihan terapi bisa membingungkan. Panduan berbasis bukti ini membantu Anda memahami setiap jenis terapi dan memilih yang paling sesuai.",
      content: `
<h2>Lanskap Terapi untuk Anak Berkebutuhan Khusus</h2>
<p>Ketika anak Anda menerima diagnosis, Anda mungkin langsung dibanjiri rekomendasi berbagai jenis terapi. Jumlahnya bisa sangat overwhelming. Panduan ini akan membantu Anda memahami <strong>apa saja terapi berbasis bukti yang tersedia</strong>, untuk siapa, dan apa yang diharapkan.</p>

<h2>Terapi Berdasarkan Area Kebutuhan</h2>

<h3>1. Terapi Wicara (Speech-Language Therapy)</h3>
<p><strong>Untuk siapa:</strong> Anak dengan keterlambatan bicara, gangguan artikulasi, gangguan bahasa reseptif/ekspresif, gangguan pragmatik (penggunaan bahasa sosial), gagap, dan kebutuhan AAC.</p>
<p><strong>Apa yang dilakukan:</strong></p>
<ul>
<li>Melatih produksi bunyi yang benar</li>
<li>Membangun kosakata dan struktur kalimat</li>
<li>Mengajarkan pemahaman bahasa</li>
<li>Melatih keterampilan percakapan dan bahasa sosial</li>
<li>Memperkenalkan dan melatih sistem AAC jika diperlukan</li>
</ul>
<p><strong>Frekuensi umum:</strong> 1–3 sesi per minggu, masing-masing 30–60 menit</p>
<p><strong>Tingkat bukti:</strong> Sangat kuat — terapi wicara adalah salah satu intervensi dengan basis bukti paling solid</p>

<h3>2. Terapi Okupasi (Occupational Therapy / OT)</h3>
<p><strong>Untuk siapa:</strong> Anak dengan kesulitan motorik halus, gangguan pemrosesan sensorik, kesulitan dalam aktivitas sehari-hari (berpakaian, makan, menulis), gangguan koordinasi.</p>
<p><strong>Apa yang dilakukan:</strong></p>
<ul>
<li>Melatih keterampilan motorik halus (menulis, menggunting, mengancingkan)</li>
<li>Terapi integrasi sensorik</li>
<li>Mengembangkan kemandirian dalam aktivitas sehari-hari</li>
<li>Melatih regulasi emosi melalui strategi sensorik</li>
<li>Adaptasi lingkungan untuk mendukung partisipasi</li>
</ul>
<p><strong>Frekuensi umum:</strong> 1–2 sesi per minggu</p>
<p><strong>Tingkat bukti:</strong> Kuat, terutama untuk motorik halus dan kemandirian. Untuk integrasi sensorik, bukti berkembang positif</p>

<h3>3. Applied Behavior Analysis (ABA)</h3>
<p><strong>Untuk siapa:</strong> Terutama anak dengan Autism Spectrum Disorder, juga diterapkan untuk gangguan perilaku lainnya.</p>
<p><strong>Apa yang dilakukan:</strong></p>
<ul>
<li>Mengajarkan keterampilan baru secara sistematis dan terukur</li>
<li>Mengurangi perilaku yang menghambat pembelajaran</li>
<li>Membangun keterampilan komunikasi, sosial, dan akademik</li>
<li>Menggunakan penguatan positif sebagai prinsip utama</li>
</ul>
<p><strong>Catatan penting:</strong> ABA modern sangat berbeda dari ABA era 1970-an. ABA yang baik bersifat naturalistik, menghormati anak, dan tidak bertujuan menghapus perilaku yang merupakan ekspresi identitas. Pastikan terapis ABA Anda menggunakan pendekatan yang <strong>etis dan berpusat pada anak</strong>.</p>
<p><strong>Tingkat bukti:</strong> Kuat untuk pengembangan keterampilan dan komunikasi</p>

<h3>4. DIR/Floortime</h3>
<p><strong>Untuk siapa:</strong> Anak dengan ASD dan gangguan perkembangan lainnya, terutama yang memiliki kesulitan dalam hubungan emosional dan interaksi sosial.</p>
<p><strong>Apa yang dilakukan:</strong></p>
<ul>
<li>Mengikuti minat dan inisiatif anak (child-led)</li>
<li>Membangun hubungan emosional melalui bermain di lantai bersama</li>
<li>Mengembangkan kapasitas berpikir dan berkomunikasi melalui interaksi</li>
<li>Memperkuat "lingkaran komunikasi" — siklus memberi dan menerima respons</li>
</ul>
<p><strong>Tingkat bukti:</strong> Sedang — bukti berkembang positif, terutama untuk engagement sosial-emosional</p>

<h3>5. Fisioterapi (Physical Therapy)</h3>
<p><strong>Untuk siapa:</strong> Anak dengan gangguan motorik kasar, cerebral palsy, keterlambatan perkembangan motorik, gangguan keseimbangan dan koordinasi.</p>
<p><strong>Apa yang dilakukan:</strong></p>
<ul>
<li>Melatih kekuatan otot, keseimbangan, dan koordinasi</li>
<li>Meningkatkan mobilitas dan kemampuan berjalan</li>
<li>Mencegah deformitas muskuloskeletal</li>
<li>Penggunaan alat bantu mobilitas jika diperlukan</li>
</ul>

<h2>Cara Memilih Terapi yang Tepat</h2>
<h3>Langkah 1: Mulai dari Asesmen</h3>
<p>Sebelum memilih terapi, lakukan asesmen menyeluruh oleh tim profesional. Asesmen yang baik akan menghasilkan <strong>profil kekuatan dan kebutuhan</strong> anak Anda, bukan hanya daftar defisit.</p>

<h3>Langkah 2: Prioritaskan</h3>
<p>Anda tidak harus menjalani semua terapi sekaligus. Prioritaskan berdasarkan:</p>
<ul>
<li><strong>Keamanan</strong> — Apakah ada perilaku yang membahayakan yang perlu segera ditangani?</li>
<li><strong>Komunikasi</strong> — Apakah anak memiliki cara untuk mengkomunikasikan kebutuhannya?</li>
<li><strong>Kemandirian</strong> — Keterampilan apa yang paling meningkatkan kualitas hidup sehari-hari?</li>
</ul>

<h3>Langkah 3: Evaluasi Terapis</h3>
<p>Terapis yang baik harus:</p>
<ul>
<li>Memiliki lisensi dan sertifikasi yang valid</li>
<li>Bersedia menjelaskan pendekatan dan tujuan terapi kepada Anda</li>
<li>Melibatkan Anda dalam proses — memberikan strategi untuk di rumah</li>
<li>Menunjukkan data kemajuan secara berkala</li>
<li>Menghormati anak Anda sebagai individu</li>
<li>Terbuka terhadap umpan balik dan penyesuaian</li>
</ul>

<h2>Red Flags — Hindari Terapis yang:</h2>
<ul>
<li>Menjanjikan "kesembuhan" atau menghilangkan diagnosis</li>
<li>Menolak melibatkan orang tua atau menjelaskan metode yang digunakan</li>
<li>Menggunakan hukuman, kekerasan, atau teknik yang membuat anak ketakutan</li>
<li>Tidak bisa menunjukkan kemajuan setelah 3–6 bulan</li>
<li>Merekomendasikan terapi yang tidak memiliki basis bukti ilmiah</li>
</ul>

<blockquote>
<p><strong>Prinsip utama:</strong> Terapi terbaik adalah yang bekerja untuk anak Anda secara spesifik. Jangan membandingkan dengan anak lain. Percayai data dan observasi Anda sendiri.</p>
</blockquote>
      `.trim(),
      type: "MODULE" as const,
      category: "EXPERT_GUIDES" as const,
      isPremium: true,
      readTimeMins: 16,
      ageRangeMin: 0,
      ageRangeMax: 18,
    },
    {
      title: "Hak Pendidikan Anak Berkebutuhan Khusus di Indonesia: Yang Perlu Orang Tua Ketahui",
      slug: "hak-pendidikan-abk-indonesia",
      excerpt: "Anak Anda berhak mendapatkan pendidikan yang layak — ini dijamin undang-undang. Pahami regulasi, jenis layanan pendidikan yang tersedia, dan cara memperjuangkan hak anak Anda.",
      content: `
<h2>Landasan Hukum</h2>
<p>Hak pendidikan anak berkebutuhan khusus (ABK) di Indonesia dilindungi oleh beberapa regulasi kuat:</p>
<ul>
<li><strong>UUD 1945 Pasal 31</strong> — Setiap warga negara berhak mendapat pendidikan</li>
<li><strong>UU No. 20 Tahun 2003 tentang Sistem Pendidikan Nasional</strong> — Pasal 5 ayat (2): Warga negara yang memiliki kelainan fisik, emosional, mental, intelektual, dan/atau sosial berhak memperoleh pendidikan khusus</li>
<li><strong>UU No. 8 Tahun 2016 tentang Penyandang Disabilitas</strong> — Menjamin hak pendidikan inklusif di semua jenjang</li>
<li><strong>Permendiknas No. 70 Tahun 2009</strong> — Tentang Pendidikan Inklusif bagi peserta didik yang memiliki kelainan dan memiliki potensi kecerdasan dan/atau bakat istimewa</li>
</ul>

<h2>Pilihan Jalur Pendidikan</h2>
<h3>1. Sekolah Inklusif</h3>
<p>Sekolah reguler yang menerima dan mengakomodasi ABK bersama anak-anak pada umumnya.</p>
<p><strong>Kelebihan:</strong></p>
<ul>
<li>Interaksi sosial dengan teman sebaya yang beragam</li>
<li>Ekspektasi akademik yang menantang</li>
<li>Membangun pemahaman dan penerimaan di masyarakat</li>
</ul>
<p><strong>Yang perlu diperhatikan:</strong></p>
<ul>
<li>Apakah sekolah memiliki Guru Pembimbing Khusus (GPK)?</li>
<li>Apakah ada kebijakan akomodasi dan modifikasi kurikulum?</li>
<li>Bagaimana budaya sekolah terhadap perbedaan?</li>
</ul>

<h3>2. Sekolah Luar Biasa (SLB)</h3>
<p>Sekolah khusus yang dirancang untuk ABK dengan kurikulum dan metode yang disesuaikan.</p>
<p><strong>Jenis SLB:</strong></p>
<ul>
<li>SLB-A: Tunanetra</li>
<li>SLB-B: Tunarungu</li>
<li>SLB-C: Tunagrahita</li>
<li>SLB-D: Tunadaksa</li>
<li>SLB-E: Tunalaras</li>
<li>SLB-G: Tunaganda</li>
</ul>

<h3>3. Homeschooling</h3>
<p>Alternatif legal di Indonesia, terutama untuk anak yang memiliki kebutuhan sangat spesifik atau yang belum menemukan sekolah yang sesuai.</p>

<h2>Hak yang Bisa Anda Perjuangkan</h2>
<h3>Di Sekolah Inklusif</h3>
<ul>
<li><strong>Asesmen individual</strong> — Sekolah wajib melakukan identifikasi dan asesmen kebutuhan anak</li>
<li><strong>Program Pembelajaran Individual (PPI)</strong> — Rencana pembelajaran yang disesuaikan dengan kebutuhan anak</li>
<li><strong>Akomodasi ujian</strong> — Waktu tambahan, ruang terpisah, soal dimodifikasi, atau asesmen alternatif</li>
<li><strong>Guru Pembimbing Khusus</strong> — Sekolah inklusif seharusnya memiliki GPK atau shadow teacher</li>
<li><strong>Aksesibilitas fisik</strong> — Ramp, toilet aksesibel, ruang sensorik jika memungkinkan</li>
</ul>

<h3>Langkah Jika Hak Ditolak</h3>
<ol>
<li>Komunikasikan secara tertulis dengan pihak sekolah</li>
<li>Libatkan Dinas Pendidikan setempat</li>
<li>Konsultasikan dengan organisasi advokasi disabilitas</li>
<li>Laporkan ke Komisi Perlindungan Anak Indonesia (KPAI) jika ada penolakan</li>
</ol>

<h2>Tips Memilih Sekolah</h2>
<ol>
<li><strong>Kunjungi langsung</strong> — Amati bagaimana guru berinteraksi dengan anak, bukan hanya presentasi formal</li>
<li><strong>Tanyakan tentang pengalaman</strong> — Berapa banyak ABK yang sudah mereka terima? Apa tantangan yang dihadapi?</li>
<li><strong>Perhatikan sikap</strong> — Apakah mereka melihat anak Anda sebagai "masalah" atau "tanggung jawab bersama"?</li>
<li><strong>Cek rasio guru-murid</strong> — Semakin kecil, semakin baik untuk anak yang butuh perhatian ekstra</li>
<li><strong>Tanyakan tentang pelatihan guru</strong> — Apakah guru mendapat pelatihan tentang ABK secara berkala?</li>
<li><strong>Libatkan anak</strong> — Jika memungkinkan, bawa anak untuk trial class atau kunjungan</li>
</ol>

<blockquote>
<p><strong>Ingat:</strong> Tidak ada satu jawaban benar untuk semua anak. Jalur pendidikan terbaik adalah yang paling sesuai dengan kebutuhan, kekuatan, dan kebahagiaan anak Anda saat ini — dan ini bisa berubah seiring waktu.</p>
</blockquote>
      `.trim(),
      type: "ARTICLE" as const,
      category: "EXPERT_GUIDES" as const,
      isPremium: false,
      readTimeMins: 12,
    },

    // ─────────────────────────────────────────────
    // CATEGORY: CASE_STUDIES (Studi Kasus)
    // ─────────────────────────────────────────────
    {
      title: "Studi Kasus: Perjalanan Arif — Dari Nonverbal Menjadi Komunikator Handal dengan AAC",
      slug: "studi-kasus-arif-nonverbal-ke-aac",
      excerpt: "Kisah nyata seorang anak autis nonverbal berusia 4 tahun yang menemukan suaranya melalui AAC. Ikuti perjalanan 18 bulan intervensi yang mengubah hidupnya dan keluarganya.",
      content: `
<h2>Profil Awal</h2>
<p><strong>Nama:</strong> Arif (nama disamarkan)<br />
<strong>Usia saat dirujuk:</strong> 4 tahun 2 bulan<br />
<strong>Diagnosis:</strong> Autism Spectrum Disorder Level 3 (membutuhkan dukungan sangat substansial)<br />
<strong>Status komunikasi awal:</strong> Nonverbal — tidak ada kata yang bermakna, vokalisasi terbatas pada tangisan dan teriakan</p>

<h3>Gambaran Awal</h3>
<p>Ketika orang tuanya pertama kali datang ke klinik, Arif sama sekali tidak menggunakan kata-kata. Ia berkomunikasi dengan cara:</p>
<ul>
<li>Menarik tangan orang dewasa ke benda yang diinginkan</li>
<li>Menangis ketika kebutuhannya tidak terpenuhi</li>
<li>Kadang-kadang menunjuk, tapi tidak konsisten</li>
<li>Tidak ada kontak mata saat berkomunikasi</li>
</ul>
<p>Orang tuanya merasa frustrasi dan putus asa. Mereka sudah berkonsultasi ke 3 terapis berbeda, dan nasihat yang selalu didapat adalah: <em>"Latih terus bicaranya."</em> Namun setelah 1,5 tahun terapi wicara konvensional, tidak ada kemajuan yang berarti.</p>

<h2>Asesmen dan Perencanaan</h2>
<h3>Temuan Asesmen</h3>
<ul>
<li><strong>Bahasa reseptif:</strong> Usia fungsional sekitar 18–20 bulan — memahami beberapa instruksi sederhana dalam konteks</li>
<li><strong>Bahasa ekspresif:</strong> Usia fungsional di bawah 12 bulan — tidak ada kata bermakna</li>
<li><strong>Motorik halus:</strong> Cukup baik — bisa menunjuk dengan jari telunjuk, mengambil benda kecil</li>
<li><strong>Minat kuat:</strong> Dinosaurus, air, bola</li>
<li><strong>Profil sensorik:</strong> Seeking terhadap input vestibular dan proprioseptif</li>
</ul>

<h3>Keputusan Tim</h3>
<p>Tim terdiri dari terapis wicara, terapis okupasi, dan psikolog. Keputusan bersama:</p>
<ol>
<li>Memulai sistem AAC menggunakan <strong>PECS Phase I–III</strong> sebagai langkah awal</li>
<li>Transisi ke <strong>aplikasi AAC di tablet</strong> dalam 3–4 bulan</li>
<li>Terapi okupasi untuk regulasi sensorik (mendukung kesiapan belajar)</li>
<li>Pelatihan intensif untuk orang tua tentang modeling AAC</li>
</ol>

<h2>Perjalanan Intervensi</h2>
<h3>Bulan 1–3: PECS dan Fondasi</h3>
<p><strong>Minggu 1–2:</strong> Arif belajar menyerahkan kartu gambar "bola" untuk mendapatkan bola. Awalnya butuh bantuan fisik penuh (tangan terapis memandu tangan Arif). Dalam 5 hari, Arif bisa melakukannya mandiri.</p>
<p><strong>Minggu 3–6:</strong> Kosakata PECS bertambah: air, makan, dinosaurus, lagi, buka. Arif mulai mengambil kartu dari buku komunikasi dan menyerahkannya dengan antusias.</p>
<p><strong>Bulan 2–3:</strong> Arif mulai mengombinasikan 2 kartu: "Mau + bola," "Lagi + air." <strong>Momen breakthrough:</strong> Arif pertama kali menyerahkan kartu "toilet" sebelum ia buang air — komunikasi fungsional pertama yang proaktif.</p>

<h3>Bulan 4–6: Transisi ke Tablet</h3>
<p>Arif diperkenalkan dengan aplikasi AAC di tablet. Ia langsung tertarik dengan layar dan suara yang keluar saat tombol ditekan.</p>
<p><strong>Kosakata berkembang pesat:</strong> Dari 15 simbol menjadi 50+ simbol dalam 2 bulan. Arif mulai membuat kalimat 3 kata: "Aku mau main," "Buka video dinosaurus."</p>
<p><strong>Perubahan besar:</strong> Frekuensi tantrum turun drastis — dari rata-rata 8 kali per hari menjadi 2 kali per hari. Frustrasi komunikasi yang menjadi pemicu utama berkurang signifikan.</p>

<h3>Bulan 7–12: Ekspansi dan Generalisasi</h3>
<ul>
<li>Arif menggunakan tablet di rumah, sekolah, dan terapi</li>
<li>Mulai menggunakan kata sifat: "dinosaurus besar," "air dingin"</li>
<li>Mulai mengajukan pertanyaan sederhana menggunakan tombol "apa?" dan "di mana?"</li>
<li>Orang tua melaporkan: "Untuk pertama kalinya, kami bisa tahu apa yang dia rasakan"</li>
</ul>

<h3>Bulan 13–18: Kemunculan Bicara</h3>
<p>Hal yang tidak terduga terjadi: <strong>Arif mulai mengucapkan kata-kata secara verbal</strong>. Dimulai dari kata-kata yang paling sering ia gunakan di AAC: "agi" (lagi), "uka" (buka), "mau."</p>
<p>Pada bulan ke-18:</p>
<ul>
<li>Arif memiliki sekitar 30 kata verbal yang bermakna</li>
<li>Masih menggunakan AAC sebagai pendukung untuk kalimat yang lebih kompleks</li>
<li>Kombinasi bicara + AAC memungkinkan komunikasi yang jauh lebih kaya</li>
<li>Dapat mengekspresikan penolakan secara tepat ("tidak mau," "berhenti") alih-alih meltdown</li>
</ul>

<h2>Hasil dan Dampak</h2>
<table>
<thead>
<tr><th>Aspek</th><th>Sebelum Intervensi</th><th>Setelah 18 Bulan</th></tr>
</thead>
<tbody>
<tr><td>Kosakata ekspresif</td><td>0 kata</td><td>30 kata verbal + 200+ simbol AAC</td></tr>
<tr><td>Frekuensi tantrum</td><td>8× per hari</td><td>1–2× per minggu</td></tr>
<tr><td>Kemandirian toileting</td><td>Belum</td><td>Mandiri di siang hari</td></tr>
<tr><td>Interaksi sosial</td><td>Tidak ada inisiasi</td><td>Menginisiasi request dan kadang berbagi perhatian</td></tr>
<tr><td>Kualitas hidup keluarga</td><td>Orang tua: burnout berat</td><td>Orang tua: stres menurun, lebih percaya diri</td></tr>
</tbody>
</table>

<h2>Pelajaran dari Kasus Arif</h2>
<ol>
<li><strong>AAC tidak menghambat bicara</strong> — Justru pada kasus Arif, AAC menjadi jembatan menuju bicara verbal</li>
<li><strong>Jangan menunggu</strong> — 1,5 tahun terapi wicara konvensional tanpa AAC adalah waktu yang terbuang</li>
<li><strong>Peran orang tua krusial</strong> — Orang tua Arif berlatih modeling AAC setiap hari di rumah, dan ini menjadi faktor terpenting keberhasilan</li>
<li><strong>Tim multidisiplin</strong> — Kolaborasi terapis wicara, OT, dan psikolog menghasilkan pendekatan yang holistik</li>
<li><strong>Perilaku adalah komunikasi</strong> — Begitu Arif punya cara untuk berkomunikasi, tantrum menurun secara dramatis</li>
</ol>

<blockquote>
<p><strong>Catatan:</strong> Setiap anak unik. Hasil yang dialami Arif belum tentu sama dengan anak lain. Namun, prinsip-prinsip di balik keberhasilannya — intervensi dini, AAC, keterlibatan keluarga, dan pendekatan multidisiplin — berlaku universal.</p>
</blockquote>
      `.trim(),
      type: "ARTICLE" as const,
      category: "CASE_STUDIES" as const,
      isPremium: true,
      readTimeMins: 14,
      ageRangeMin: 2,
      ageRangeMax: 8,
    },
    {
      title: "Studi Kasus: Inklusi Berhasil — Bagaimana SD Harapan Bangsa Menjadi Model Sekolah Inklusif",
      slug: "studi-kasus-sekolah-inklusif-harapan-bangsa",
      excerpt: "Kisah transformasi sebuah SD reguler yang berhasil menjadi sekolah inklusif model. Pelajari strategi, tantangan, dan keberhasilan yang bisa ditiru oleh sekolah lain.",
      content: `
<h2>Latar Belakang</h2>
<p><strong>Sekolah:</strong> SD Harapan Bangsa (nama disamarkan)<br />
<strong>Lokasi:</strong> Kota sedang di Jawa Tengah<br />
<strong>Jumlah siswa:</strong> 420 siswa (kelas 1–6)<br />
<strong>ABK terdaftar:</strong> 28 siswa (6,7%) dengan berbagai diagnosis</p>

<p>Tiga tahun lalu, SD Harapan Bangsa adalah sekolah reguler biasa yang sesekali menolak pendaftaran anak berkebutuhan khusus dengan alasan "tidak memiliki fasilitas yang memadai." Saat ini, sekolah ini menjadi <strong>rujukan Dinas Pendidikan setempat</strong> sebagai model sekolah inklusif. Bagaimana transformasi ini terjadi?</p>

<h2>Titik Balik</h2>
<p>Semuanya bermula ketika Kepala Sekolah, Bu Ratna, memiliki cucu yang didiagnosis autism. Pengalaman pribadinya mencari sekolah yang mau menerima cucunya membuka matanya tentang betapa terbatasnya akses pendidikan bagi ABK.</p>
<p>"Saya mengerti rasa frustrasi orang tua yang bolak-balik dari satu sekolah ke sekolah lain, ditolak dengan sopan tapi pasti," kenangnya. "Saat itu saya memutuskan — sekolah kami harus berubah."</p>

<h2>Fase 1: Membangun Fondasi (6 Bulan Pertama)</h2>
<h3>Pelatihan Guru</h3>
<ul>
<li>Seluruh 24 guru mengikuti pelatihan dasar pendidikan inklusif selama 40 jam</li>
<li>4 guru dipilih menjadi Guru Pembimbing Khusus (GPK) dan mengikuti pelatihan lanjutan</li>
<li>Kerjasama dengan universitas setempat untuk pendampingan berkala</li>
</ul>

<h3>Perubahan Mindset</h3>
<p>Ini adalah tantangan terbesar. Banyak guru yang awalnya resistensi:</p>
<ul>
<li>"Saya tidak dilatih untuk mengajar anak-anak seperti itu"</li>
<li>"Nanti anak-anak lain terganggu"</li>
<li>"Ini menambah beban kerja saya"</li>
</ul>
<p>Bu Ratna mengatasi ini dengan mengundang orang tua ABK untuk berbicara langsung kepada guru. "Ketika guru mendengar langsung perjuangan keluarga, perspektif mereka berubah," katanya.</p>

<h3>Infrastruktur Dasar</h3>
<ul>
<li>Pembangunan ramp di semua pintu masuk</li>
<li>Satu ruang khusus dijadikan "ruang sensorik" dengan peralatan sederhana</li>
<li>Toilet aksesibel di lantai dasar</li>
<li>Sistem visual (jadwal, aturan, petunjuk) di setiap kelas</li>
</ul>

<h2>Fase 2: Implementasi (Tahun Pertama)</h2>
<h3>Sistem Asesmen dan PPI</h3>
<p>Setiap ABK yang mendaftar menjalani asesmen oleh GPK dan psikolog mitra. Berdasarkan asesmen, dibuat <strong>Program Pembelajaran Individual (PPI)</strong> yang berisi:</p>
<ul>
<li>Profil kekuatan dan kebutuhan anak</li>
<li>Tujuan pembelajaran per semester (terukur dan spesifik)</li>
<li>Akomodasi yang dibutuhkan di kelas</li>
<li>Strategi untuk guru kelas</li>
<li>Jadwal evaluasi dan review</li>
</ul>

<h3>Model Co-Teaching</h3>
<p>Di kelas-kelas dengan ABK, diterapkan model co-teaching:</p>
<ul>
<li>Guru kelas mengajar materi utama</li>
<li>GPK mendampingi di kelas, memberikan dukungan individual tanpa menarik anak keluar</li>
<li>Keduanya merencanakan pembelajaran bersama di awal minggu</li>
</ul>

<h3>Peer Support Program</h3>
<p>Program "Sahabat Kelas" melatih siswa reguler untuk menjadi buddy bagi teman-teman ABK mereka. Hasilnya mengejutkan — bukan hanya ABK yang berkembang, tapi siswa buddy juga menunjukkan peningkatan empati dan keterampilan sosial.</p>

<h2>Fase 3: Evaluasi dan Penyesuaian (Tahun Kedua–Ketiga)</h2>
<h3>Data Menunjukkan Keberhasilan</h3>
<table>
<thead>
<tr><th>Indikator</th><th>Sebelum</th><th>Setelah 2 Tahun</th></tr>
</thead>
<tbody>
<tr><td>Jumlah ABK terdaftar</td><td>3 siswa</td><td>28 siswa</td></tr>
<tr><td>Insiden bullying</td><td>12 kasus/semester</td><td>2 kasus/semester</td></tr>
<tr><td>Rata-rata nilai UN (non-ABK)</td><td>78,2</td><td>79,1 (tidak menurun)</td></tr>
<tr><td>Kepuasan orang tua ABK</td><td>Tidak terukur</td><td>92% puas/sangat puas</td></tr>
<tr><td>Guru yang merasa kompeten mengajar ABK</td><td>8%</td><td>71%</td></tr>
</tbody>
</table>

<h3>Fakta Penting</h3>
<p>Salah satu kekhawatiran terbesar — <strong>bahwa kehadiran ABK akan menurunkan prestasi siswa lain</strong> — terbukti tidak benar. Rata-rata nilai justru sedikit meningkat. Guru melaporkan bahwa persiapan mengajar yang lebih terstruktur (karena harus membuat akomodasi) justru meningkatkan kualitas pengajaran secara keseluruhan.</p>

<h2>Tantangan yang Dihadapi</h2>
<ul>
<li><strong>Beban administratif</strong> — Membuat dan memperbarui PPI membutuhkan waktu. Solusi: alokasi waktu khusus setiap bulan dan template yang efisien</li>
<li><strong>Resistensi sebagian orang tua siswa reguler</strong> — Diatasi dengan program edukasi rutin dan transparansi data</li>
<li><strong>Keterbatasan anggaran</strong> — Kreatif menggunakan dana BOS dan mencari mitra CSR</li>
<li><strong>Turnover GPK</strong> — Memastikan transfer pengetahuan dan melatih guru baru secara berkala</li>
</ul>

<h2>Pelajaran Utama</h2>
<ol>
<li><strong>Kepemimpinan adalah segalanya</strong> — Tanpa komitmen kuat dari kepala sekolah, inklusi hanya menjadi program di atas kertas</li>
<li><strong>Pelatihan guru harus berkelanjutan</strong> — Satu kali pelatihan tidak cukup. Butuh pendampingan, mentoring, dan komunitas belajar</li>
<li><strong>Data mengalahkan opini</strong> — Ketika ada data yang menunjukkan keberhasilan, resistensi berkurang</li>
<li><strong>Inklusi bukan hanya tentang ABK</strong> — Seluruh sekolah menjadi lebih baik: guru lebih terampil, siswa lebih empatik, budaya sekolah lebih positif</li>
<li><strong>Mulai dari yang ada</strong> — Tidak perlu menunggu fasilitas sempurna. Mulai dengan perubahan mindset dan akomodasi sederhana</li>
</ol>

<blockquote>
<p><strong>"Inklusi bukan tentang memasukkan anak berkebutuhan khusus ke sekolah reguler. Inklusi adalah tentang mengubah sekolah agar layak untuk semua anak."</strong> — Bu Ratna, Kepala SD Harapan Bangsa</p>
</blockquote>
      `.trim(),
      type: "ARTICLE" as const,
      category: "CASE_STUDIES" as const,
      isPremium: false,
      readTimeMins: 14,
    },
  ];

  for (const article of articles) {
    const data = {
      ...article,
      content: (article as any).content ?? null,
      videoUrl: (article as any).videoUrl ?? null,
      ageRangeMin: (article as any).ageRangeMin ?? null,
      ageRangeMax: (article as any).ageRangeMax ?? null,
    };
    await prisma.knowledgeContent.upsert({
      where: { slug: article.slug },
      update: {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        type: data.type,
        category: data.category,
        isPremium: data.isPremium,
        videoUrl: data.videoUrl,
        readTimeMins: data.readTimeMins,
        ageRangeMin: data.ageRangeMin,
        ageRangeMax: data.ageRangeMax,
      },
      create: {
        ...data,
        publishedAt: new Date(),
        viewCount: Math.floor(Math.random() * 5000) + 100,
      },
    });
  }

  // Communities
  const communities = [
    {
      name: "Yayasan Autisme Indonesia",
      slug: "yayasan-autisme-indonesia",
      description: "Organisasi terkemuka yang mendukung anak dan keluarga dengan autisme di seluruh Indonesia.",
      focusAreas: ["AUTISM", "GENERAL_ABK"] as any[],
      orgType: "FOUNDATION" as const,
      region: "Nasional",
      province: "DKI Jakarta",
      contactEmail: "info@autisme.or.id",
      website: "https://autisme.or.id",
      memberCount: 12500,
      isVerified: true,
    },
    {
      name: "Komunitas ADHD Indonesia",
      slug: "komunitas-adhd-indonesia",
      description: "Wadah dukungan bagi orang tua, guru, dan individu dengan ADHD untuk berbagi pengalaman.",
      focusAreas: ["ADHD"] as any[],
      orgType: "SUPPORT_GROUP" as const,
      region: "Nasional",
      province: "DKI Jakarta",
      contactEmail: "adhd.indonesia@gmail.com",
      memberCount: 8200,
      isVerified: true,
    },
    {
      name: "Sekolah Luar Biasa Pelita Bangsa",
      slug: "slb-pelita-bangsa-bandung",
      description: "Sekolah khusus ABK dengan kurikulum adaptif dan tenaga pengajar berpengalaman.",
      focusAreas: ["GENERAL_ABK", "INTELLECTUAL_DISABILITY"] as any[],
      orgType: "SCHOOL" as const,
      region: "Bandung",
      province: "Jawa Barat",
      contactEmail: "slbpelitabangsa@edu.id",
      contactPhone: "+62-22-1234567",
      memberCount: 250,
      isVerified: true,
    },
    {
      name: "Pusat Terapi Tumbuh Kembang Anak Surabaya",
      slug: "pusat-terapi-tumbuh-kembang-surabaya",
      description: "Pusat terapi terpadu dengan layanan OT, speech therapy, dan psikologi anak.",
      focusAreas: ["AUTISM", "CEREBRAL_PALSY", "DOWN_SYNDROME"] as any[],
      orgType: "THERAPY_CENTER" as const,
      region: "Surabaya",
      province: "Jawa Timur",
      contactPhone: "+62-31-9876543",
      memberCount: 420,
      isVerified: false,
    },
  ];

  for (const community of communities) {
    await prisma.community.upsert({
      where: { slug: community.slug },
      update: {},
      create: community,
    });
  }

  console.log("✅ Seeding completed!");
  console.log("─────────────────────────────────");
  console.log("Admin:    admin@ortoconnect.id / Admin@123456");
  console.log("Expert 1: siti.rahayu@ortoconnect.id / Expert@123456");
  console.log("─────────────────────────────────");
}
// test
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
