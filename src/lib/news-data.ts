/**
 * Kurasi berita Grebeg Suro 2026 & Volunteer Grebeg Suro dari berbagai kanal media
 * (April–Juni 2026). Konten & foto adalah hak cipta masing-masing penerbit;
 * setiap kartu berita menaut langsung ke artikel aslinya.
 *
 * Foto berita diambil dari og:image artikel sumber melalui /api/news/image
 * (lihat src/app/api/news/image/route.ts) dengan fallback ilustrasi lokal.
 */

export type NewsCategory =
  | "Volunteer"
  | "Festival & Reog"
  | "Tradisi"
  | "Persiapan"
  | "Pariwisata"
  | "Ekonomi Kreatif";

export interface NewsArticle {
  /** Slug unik — juga dipakai sebagai kunci /api/news/image?id= */
  id: string;
  title: string;
  /** Nama kanal/penerbit untuk kredit sumber */
  source: string;
  /** Tautan artikel asli */
  url: string;
  /** Tanggal untuk atribut <time> & pengurutan (perkiraan bila harinya tidak pasti) */
  dateISO: string;
  /** Tanggal tampilan — sengaja dibiarkan "Juni 2026" bila hari pastinya tidak diketahui */
  displayDate: string;
  category: NewsCategory;
  excerpt: string;
  /** Artikel utama (lead story) halaman berita */
  featured?: boolean;
}

export const NEWS_ARTICLES: NewsArticle[] = [
  // ===== Pembukaan & festival (Juni 2026) =====
  {
    id: "antara-resmi-dibuka",
    title: "Rangkaian Grebeg Suro Ponorogo 2026 Resmi Dibuka",
    source: "ANTARA News Jawa Timur",
    url: "https://jatim.antaranews.com/berita/1071728/rangkaian-grebeg-suro-ponorogo-2026-resmi-dibuka",
    dateISO: "2026-06-07",
    displayDate: "7 Juni 2026",
    category: "Festival & Reog",
    featured: true,
    excerpt:
      "Pemkab Ponorogo resmi membuka rangkaian Grebeg Suro 2026 di panggung utama Alun-alun Ponorogo, Sabtu (6/6) malam. Pembukaan bertema “Reogvolution” ini menandai dimulainya Festival Nasional Reog Ponorogo (FNRP) ke-31 dan Festival Reog Remaja (FRR) ke-22, dengan total 29 agenda religi, budaya, hingga komunitas hobi yang bergulir sampai pertengahan Juli.",
  },
  {
    id: "pemkab-pembukaan",
    title: "Pembukaan Grebeg Suro 2026, Buktikan Reog Ponorogo Tak Lekang Dimakan Zaman",
    source: "Pemkab Ponorogo",
    url: "https://ponorogo.go.id/2026/06/07/pembukaan-grebeg-suro-2026-buktikan-reog-ponorogo-tak-lekang-dimakan-zaman/",
    dateISO: "2026-06-07",
    displayDate: "7 Juni 2026",
    category: "Festival & Reog",
    excerpt:
      "Mengusung tema Reogvolution, pembukaan Grebeg Suro 2026 digelar meriah di Alun-alun Ponorogo dan dibuka langsung oleh Plt Bupati Ponorogo, Bunda Lisdyarita. Gelaran tahun ini menjadi pembuktian bahwa Reog Ponorogo terus hidup dan relevan lintas generasi.",
  },
  {
    id: "beritajatim-kota-budaya",
    title: "Grebeg Suro 2026 Resmi Dibuka, Ponorogo Tegaskan Posisi sebagai Kota Budaya Kelas Dunia",
    source: "beritajatim.com",
    url: "https://beritajatim.com/grebeg-suro-2026-resmi-dibuka-ponorogo-tegaskan-posisi-sebagai-kota-budaya-kelas-dunia",
    dateISO: "2026-06-07",
    displayDate: "Juni 2026",
    category: "Festival & Reog",
    excerpt:
      "Setelah Reog Ponorogo ditetapkan sebagai warisan budaya tak benda dunia dan Ponorogo masuk jaringan Kota Kreatif UNESCO, Grebeg Suro 2026 menjadi panggung penegasan posisi Ponorogo sebagai kota budaya kelas dunia.",
  },
  {
    id: "intijatim-reogvolution",
    title: "Grebeg Suro 2026 Resmi Dibuka, Usung Tema “Reogvolution” Menuju Panggung Dunia",
    source: "Inti Jatim",
    url: "https://intijatim.id/grebeg-suro-2026-resmi-dibuka-usung-tema-reogvolution-menuju-panggung-dunia/",
    dateISO: "2026-06-07",
    displayDate: "Juni 2026",
    category: "Festival & Reog",
    excerpt:
      "Tema “Reogvolution” dipilih sebagai simbol tradisi yang dinamis dan terus berevolusi mengikuti zaman — dari alun-alun Ponorogo menuju panggung dunia.",
  },
  {
    id: "detik-wapres",
    title: "Grebeg Suro 2026 Diproyeksikan Bertaraf Nasional, Wapres Dikabarkan Hadir",
    source: "detikJatim",
    url: "https://www.detik.com/jatim/budaya/d-8520358/grebeg-suro-2026-diproyeksikan-bertaraf-nasional-wapres-dikabarkan-hadir",
    dateISO: "2026-06-05",
    displayDate: "Juni 2026",
    category: "Festival & Reog",
    excerpt:
      "Grebeg Suro 2026 dikonsep bertaraf nasional. Wakil Presiden dikabarkan telah mengonfirmasi kesiapan hadir, disusul konfirmasi sejumlah kementerian — menandai naiknya kelas event budaya kebanggaan Ponorogo ini.",
  },
  {
    id: "detik-31-grup-reog",
    title: "31 Grup Reog Siap Adu Atraksi di Grebeg Suro 2026 Ponorogo",
    source: "detikJatim",
    url: "https://www.detik.com/jatim/budaya/d-8517531/31-grup-reog-siap-adu-atraksi-di-grebeg-suro-2026-ponorogo",
    dateISO: "2026-06-04",
    displayDate: "Juni 2026",
    category: "Festival & Reog",
    excerpt:
      "Festival Nasional Reog Ponorogo (FNRP) XXXI dan Festival Reog Remaja (FRR) XXII diikuti puluhan grup reog dari berbagai daerah — dari Surabaya, Wonogiri, Nganjuk, Surakarta, hingga Palembang — yang siap adu atraksi terbaiknya.",
  },
  {
    id: "sinyal-fnrp-tahta",
    title: "Tahta Kosong FNRP XXXI/2026 Bikin Persaingan Memanas, Regenerasi Reog Kian Terlihat",
    source: "Sinyal Ponorogo",
    url: "https://www.sinyalponorogo.com/2026/06/tahta-kosong-fnrp-xxxi2026-bikin.html",
    dateISO: "2026-06-10",
    displayDate: "Juni 2026",
    category: "Festival & Reog",
    excerpt:
      "Persaingan Festival Nasional Reog Ponorogo XXXI memanas. Tahta juara yang kosong membuat kontingen berlomba tampil maksimal, sementara regenerasi seniman reog muda kian terlihat di panggung utama.",
  },
  {
    id: "kompas-jadwal-lengkap",
    title: "Jadwal Lengkap Perayaan Grebeg Suro Ponorogo 2026, Ada Festival Nasional Reog",
    source: "Kompas.com",
    url: "https://surabaya.kompas.com/read/2026/06/05/184808078/jadwal-lengkap-perayaan-grebeg-suro-ponorogo-2026-ada-festival-nasional",
    dateISO: "2026-06-05",
    displayDate: "5 Juni 2026",
    category: "Festival & Reog",
    excerpt:
      "Pembukaan 6 Juni di Alun-alun Ponorogo, Festival Reog Remaja 7–10 Juni, FNRP XXXI 11–14 Juni, lalu puncak Kirab Pusaka 15 Juni dan Larungan Telaga Ngebel 16 Juni — inilah peta lengkap perayaan Grebeg Suro 2026.",
  },
  {
    id: "detik-jadwal",
    title: "Jadwal Grebeg Suro Ponorogo 2026, Ini Agenda yang Paling Ditunggu!",
    source: "detikJatim",
    url: "https://www.detik.com/jatim/wisata/d-8499664/jadwal-grebeg-suro-ponorogo-2026-ini-agenda-yang-paling-ditunggu",
    dateISO: "2026-05-26",
    displayDate: "Mei 2026",
    category: "Festival & Reog",
    excerpt:
      "Dari Festival Nasional Reog Ponorogo, kirab pusaka, hingga Larungan Telaga Ngebel — detikJatim merangkum agenda-agenda Grebeg Suro 2026 yang paling ditunggu wisatawan.",
  },
  {
    id: "tribun-29-acara",
    title: "Daftar Lengkap 29 Acara Grebeg Suro Ponorogo 2026, Jadwal Festival Nasional Reog dan Lokasinya",
    source: "TribunJatim",
    url: "https://jatim.tribunnews.com/jatim/547485/daftar-lengkap-29-acara-grebeg-suro-ponorogo-2026-jadwal-festival-nasional-reog-dan-lokasinya",
    dateISO: "2026-06-05",
    displayDate: "Juni 2026",
    category: "Festival & Reog",
    excerpt:
      "29 acara memeriahkan Grebeg Suro 2026: festival macapat pelajar, festival lukisan, pagelaran pusaka, vespakultural, parade sepeda unto, grebeg bonsai, hingga keroncong 24 jam — lengkap dengan jadwal dan lokasinya.",
  },
  {
    id: "gemasurya-pembukaan",
    title: "Pembukaan Grebeg Suro Dijadwalkan 6 Juni 2026, FNRP dan FRR Diikuti Puluhan Grup Reog",
    source: "Gema Surya FM",
    url: "https://gemasuryafm.com/2026/06/02/pembukaan-grebeg-suro-dijadwalkan-6-juni-2026-fnrp-dan-frr-diikuti-puluhan-grup-reog/",
    dateISO: "2026-06-02",
    displayDate: "2 Juni 2026",
    category: "Festival & Reog",
    excerpt:
      "Panitia memastikan upacara pembukaan Grebeg Suro digelar 6 Juni 2026 di panggung utama Alun-alun Ponorogo, dengan FNRP dan Festival Reog Remaja sebagai magnet utama yang diikuti puluhan grup reog.",
  },

  // ===== Volunteer Grebeg Suro =====
  {
    id: "pemkab-volunteer-seleksi",
    title: "1.000 Lebih Pendaftar Volunteer Grebeg Suro 2026, Sekitar 100 yang Lolos Seleksi",
    source: "Pemkab Ponorogo",
    url: "https://ponorogo.go.id/2026/06/04/1-000-lebih-pendaftar-volunteer-grebeg-suro-2026-sekitar-100-yang-lolos-seleksi/",
    dateISO: "2026-06-04",
    displayDate: "4 Juni 2026",
    category: "Volunteer",
    featured: true,
    excerpt:
      "Antusiasme anak muda Ponorogo luar biasa: lebih dari 1.000 orang mendaftar sebagai volunteer Grebeg Suro 2026 dan hanya sekitar 100 yang lolos seleksi. Mereka ditempatkan di divisi administrasi, humas, naradamping, layanan pengunjung, manajemen panggung, hingga keamanan, dan bertugas sepanjang 6–15 Juni 2026.",
  },
  {
    id: "times-lantik-volunteer",
    title: "Gerakkan Pemuda, Plt Bupati Ponorogo Lisdyarita Lantik 141 Volunteer Grebeg Suro 2026",
    source: "TIMES Indonesia",
    url: "https://timesindonesia.co.id/peristiwa-daerah/593186/gerakkan-pemuda-plt-bupati-ponorogo-lisdyarita-lantik-141-volunteer-grebeg-suro-2026",
    dateISO: "2026-06-03",
    displayDate: "3 Juni 2026",
    category: "Volunteer",
    excerpt:
      "Plt Bupati Ponorogo Lisdyarita melantik para volunteer Grebeg Suro 2026 di Pendopo Agung, Rabu (3/6/2026). Berasal dari kalangan pelajar, mahasiswa, hingga masyarakat umum, mereka menjadi motor penggerak muda di balik gelaran budaya terbesar Ponorogo.",
  },
  {
    id: "sinyal-volunteer-dilantik",
    title: "125 Volunteer Grebeg Suro 2026 Resmi Dilantik, Bunda Lisdyarita: Ini Bukan Sekadar Event, Tapi Wujud Cinta Budaya",
    source: "Sinyal Ponorogo",
    url: "https://www.sinyalponorogo.com/2026/06/125-volunteer-grebeg-suro-2026-resmi.html",
    dateISO: "2026-06-03",
    displayDate: "Juni 2026",
    category: "Volunteer",
    excerpt:
      "Sebelum resmi bertugas, para volunteer dibekali dua tahap bimbingan teknis — termasuk materi manajerial event Grebeg Suro. Pesan Bunda Lisdyarita: menjadi volunteer bukan sekadar membantu panitia, melainkan wujud cinta pada budaya sendiri.",
  },
  {
    id: "spektroom-volunteer-unesco",
    title: "Sambut Status UNESCO, 100 Volunteer Siap Sukseskan Grebeg Suro Ponorogo 2026",
    source: "Spektroom",
    url: "https://spektroom.co.id/sambut-status-unesco-100-volunteer-siap-sukseskan-grebeg-suro-ponorogo-2026/",
    dateISO: "2026-06-04",
    displayDate: "Juni 2026",
    category: "Volunteer",
    excerpt:
      "Grebeg Suro tahun ini istimewa: digelar setelah Reog Ponorogo diakui sebagai warisan budaya tak benda UNESCO dan Ponorogo masuk jaringan kota kreatif dunia. Seratus volunteer terpilih siap mengawal momentum tersebut di lapangan.",
  },
  {
    id: "serayu-relawan-duta",
    title: "Plt Bupati Ponorogo Kukuhkan 100 Relawan Grebeg Suro 2026, Siap Jadi Duta Budaya Daerah",
    source: "Serayu Nusantara",
    url: "https://serayunusantara.com/plt-bupati-ponorogo-kukuhkan-100-relawan-grebeg-suro-2026-siap-jadi-duta-budaya-daerah/",
    dateISO: "2026-06-04",
    displayDate: "Juni 2026",
    category: "Volunteer",
    excerpt:
      "Para relawan yang dikukuhkan tidak hanya menjalankan tugas teknis membantu panitia penyelenggara, tetapi juga memikul tanggung jawab sebagai duta budaya daerah selama Grebeg Suro 2026 berlangsung.",
  },
  {
    id: "kominfo-volunteer-kukuhkan",
    title: "Plt Bupati Ponorogo Lisdyarita Kukuhkan 100 Volunteer Grebeg Suro 2026",
    source: "Kominfo Jatim",
    url: "https://kominfo.jatimprov.go.id/berita/plt-bupati-ponorogo-lisdyarita-kukuhkan-100-volunteer-grebeg-suro-2026",
    dateISO: "2026-06-04",
    displayDate: "Juni 2026",
    category: "Volunteer",
    excerpt:
      "Pemerintah Provinsi Jawa Timur turut menyoroti pengukuhan volunteer Grebeg Suro 2026 — bukti keterlibatan generasi muda dalam penyelenggaraan event budaya berskala nasional di Ponorogo.",
  },
  {
    id: "prokopim-volunteer-penggerak",
    title: "Jadi Penggerak Event, Volunteer Siap Sukseskan Grebeg Suro 2026",
    source: "Prokopim Ponorogo",
    url: "https://prokopim.ponorogo.go.id/2026/06/jadi-penggerak-event-volunteer-siap-sukseskan-grebeg-suro-2026/",
    dateISO: "2026-06-05",
    displayDate: "Juni 2026",
    category: "Volunteer",
    excerpt:
      "Volunteer Grebeg Suro 2026 diminta memberikan pelayanan yang ramah dan santun kepada seluruh pengunjung demi membangun citra positif Ponorogo — dari layanan informasi hingga pendampingan tamu dan kontingen.",
  },

  // ===== Tradisi & pariwisata =====
  {
    id: "tribun-gibran-kirab",
    title: "Wapres Gibran Siap Hadir di Grebeg Suro Ponorogo 2026, Intip Jadwal Kirab Pusaka dan Larung Ngebel",
    source: "TribunJatim",
    url: "https://jatim.tribunnews.com/jatim/547536/wapres-gibran-siap-hadir-di-grebeg-suro-ponorogo-2026-intip-jadwal-kirab-pusaka-dan-larung-ngebel",
    dateISO: "2026-06-06",
    displayDate: "Juni 2026",
    category: "Tradisi",
    excerpt:
      "Puncak tradisi Grebeg Suro 2026: Bedol Pusaka pada malam 14 Juni, Kirab Pusaka dan Pawai Lintas Sejarah dari Kota Lama ke Paseban pada 15 Juni, lalu Larungan Risalah Doa di Telaga Ngebel pada 16 Juni pagi.",
  },
  {
    id: "radar-1100-bregada",
    title: "1.100 Bregada Meriahkan Kirab Pusaka Grebeg Suro 2026, Reka Ulang Sejarah Ponorogo",
    source: "Radar Madiun (Jawa Pos)",
    url: "https://radarmadiun.jawapos.com/ponorogo/2606070026/1100-bregada-meriahkan-kirab-pusaka-grebeg-suro-2026-reka-ulang-sejarah-ponorogo",
    dateISO: "2026-06-07",
    displayDate: "7 Juni 2026",
    category: "Tradisi",
    excerpt:
      "Sebanyak 1.100 bregada akan mengiringi Bedhol dan Kirab Pusaka Grebeg Suro 2026 — sebuah rekonstruksi kolosal perpindahan pusat pemerintahan Ponorogo dari Kota Lama menuju pusat kota saat ini.",
  },
  {
    id: "surya-wisman-serbu",
    title: "Grebeg Suro 2026 Resmi Dimulai, Wisatawan Amerika hingga Korea Serbu Ponorogo",
    source: "Surya (Tribunnews)",
    url: "https://surabaya.tribunnews.com/jawa-timur/1941359/grebeg-suro-2026-resmi-dimulai-wisatawan-amerika-hingga-korea-serbu-ponorogo",
    dateISO: "2026-06-07",
    displayDate: "7 Juni 2026",
    category: "Pariwisata",
    excerpt:
      "Pembukaan Grebeg Suro 2026 menyedot ribuan penonton, termasuk wisatawan mancanegara dari Amerika Serikat, Jepang, Korea Selatan, hingga Eropa yang memadati Alun-alun Ponorogo.",
  },
  {
    id: "surabayapagi-reogvolution",
    title: "Sukses Pikat Turis Asing, Spirit Reogevolution di Grebeg Suro 2026 Dobrak Stigma Tari Jawa",
    source: "Surabaya Pagi",
    url: "https://surabayapagi.com/news-268303-sukses-pikat-turis-asing-spirit-reogevolution-di-grebeg-suro-2026-dobrak-stigma-tari-jawa",
    dateISO: "2026-06-08",
    displayDate: "Juni 2026",
    category: "Pariwisata",
    excerpt:
      "Turis dari New York hingga Paris terpukau: berbeda dari stereotip tari Jawa yang lembut dan pelan, Reog tampil enerjik dan bertenaga. Spirit “Reogvolution” dinilai berhasil mendobrak stigma sekaligus memikat penonton dunia.",
  },
  {
    id: "mediaponorogo-wisman",
    title: "Pesona Grebeg Suro 2026 Tarik Animo Wisatawan Mancanegara, Bukti Ponorogo Kota Kreatif Dunia",
    source: "Media Ponorogo",
    url: "https://mediaponorogo.com/2026/06/07/pesona-grebeg-suro-2026-tarik-animo-wisatawan-mancanegara-bukti-ponorogo-kota-kreatif-dunia/",
    dateISO: "2026-06-07",
    displayDate: "7 Juni 2026",
    category: "Pariwisata",
    excerpt:
      "Animo wisatawan mancanegara terhadap Grebeg Suro 2026 menjadi bukti nyata status Ponorogo sebagai bagian dari jaringan Kota Kreatif Dunia UNESCO.",
  },

  // ===== Ekonomi kreatif =====
  {
    id: "koranjakarta-umkm",
    title: "Jadwal Lengkap Grebeg Suro Ponorogo 2026: Momentum Dongkrak Omzet UMKM Kreatif, Resmi Dibuka!",
    source: "Koran Jakarta",
    url: "https://koran-jakarta.com/2026-06-07/jadwal-lengkap-grebeg-suro-ponorogo-2026-momentum-dongkrak-omzet-umkm-kreatif-resmi-dibuka",
    dateISO: "2026-06-07",
    displayDate: "7 Juni 2026",
    category: "Ekonomi Kreatif",
    excerpt:
      "Lebih dari sekadar festival budaya, Grebeg Suro 2026 menjadi momentum mendongkrak omzet UMKM dan pelaku ekonomi kreatif Ponorogo — dari kuliner, kriya, hingga merchandise reog.",
  },
  {
    id: "prokopim-etalase",
    title: "Grebeg Suro 2026 Jadi Etalase Budaya dan Industri Kreatif Ponorogo",
    source: "Prokopim Ponorogo",
    url: "https://prokopim.ponorogo.go.id/2026/06/grebeg-suro-2026-jadi-etalase-budaya-dan-industri-kreatif-ponorogo/",
    dateISO: "2026-06-08",
    displayDate: "Juni 2026",
    category: "Ekonomi Kreatif",
    excerpt:
      "Pemkab Ponorogo memosisikan Grebeg Suro 2026 sebagai etalase budaya sekaligus industri kreatif daerah — memamerkan karya seniman, perajin, dan komunitas kreatif Bumi Reog kepada wisatawan nusantara dan mancanegara.",
  },
  {
    id: "antara-anggaran",
    title: "Pemkab Ponorogo Anggarkan Rp500 Juta untuk Grebeg Suro 2026",
    source: "ANTARA News Jawa Timur",
    url: "https://jatim.antaranews.com/berita/1070848/pemkab-ponorogo-anggarkan-rp500-juta-untuk-grebeg-suro-2026",
    dateISO: "2026-06-03",
    displayDate: "Juni 2026",
    category: "Ekonomi Kreatif",
    excerpt:
      "Pemkab Ponorogo mengalokasikan lebih dari Rp500 juta APBD untuk Grebeg Suro 2026, ditambah dukungan sponsor. Sekda Agus Sugiarto menyebut agenda tahunan yang masuk Karisma Event Nusantara (KEN) ini diharapkan mengungkit kunjungan wisata dan ekonomi warga.",
  },
  {
    id: "kompas-anggaran",
    title: "Pemkab Ponorogo Siapkan Rp 500 Juta untuk Grebeg Suro 2026, Digelar Mulai 6 Juni",
    source: "Kompas.com",
    url: "https://surabaya.kompas.com/read/2026/06/04/065219778/pemkab-ponorogo-siapkan-rp-500-juta-untuk-grebeg-suro-2026-digelar-mulai-6",
    dateISO: "2026-06-04",
    displayDate: "4 Juni 2026",
    category: "Ekonomi Kreatif",
    excerpt:
      "Dengan dukungan APBD Rp500 juta dan sponsor, Grebeg Suro 2026 digelar mulai 6 Juni. Salah satu agenda utamanya adalah Festival Reog Remaja ke-22 dan Festival Nasional Reog Ponorogo ke-31 yang diikuti 31 grup reog dari berbagai daerah.",
  },

  // ===== Persiapan (April–Mei 2026) =====
  {
    id: "radar-dimajukan",
    title: "Grebeg Suro 2026 Dimajukan, Event Digelar Mei hingga Juli",
    source: "Radar Madiun (Jawa Pos)",
    url: "https://radarmadiun.jawapos.com/ponorogo/2604190037/grebeg-suro-2026-dimajukan-event-digelar-mei-hingga-juli",
    dateISO: "2026-04-19",
    displayDate: "19 April 2026",
    category: "Persiapan",
    excerpt:
      "Mengikuti pergeseran kalender 1 Suro, jadwal Grebeg Suro 2026 dimajukan: rangkaian event digelar mulai Mei hingga Juli dengan pembukaan utama pada awal Juni.",
  },
  {
    id: "disbudparpora-koordinasi",
    title: "Persiapan Menuju Grebeg Suro 2026, Pemerintah Matangkan Koordinasi Lintas Sektor",
    source: "Disbudparpora Ponorogo",
    url: "https://disbudparpora.ponorogo.go.id/persiapan-menuju-grebeg-suro-2026-pemerintah-matangkan-koordinasi-lintas-sektor/",
    dateISO: "2026-04-14",
    displayDate: "April 2026",
    category: "Persiapan",
    excerpt:
      "Panitia penyelenggara menggelar rapat pleno di Ruang Bantarangin, Graha Bakti Praja (14/4), mematangkan koordinasi lintas sektor agar seluruh rangkaian Grebeg Suro 2026 berjalan lancar, aman, dan sukses.",
  },
  {
    id: "radar-sebulan-lebih",
    title: "Grebeg Suro 2026 Ponorogo Digelar Sebulan Lebih, Ada FNRP dan Larungan",
    source: "Radar Madiun (Jawa Pos)",
    url: "https://radarmadiun.jawapos.com/ponorogo/2605040078/grebeg-suro-2026-ponorogo-digelar-sebulan-lebih-ada-fnrp-dan-larungan",
    dateISO: "2026-05-04",
    displayDate: "4 Mei 2026",
    category: "Persiapan",
    excerpt:
      "Grebeg Suro 2026 digelar lebih dari sebulan penuh — memuat Festival Nasional Reog Ponorogo, festival reog remaja, hingga Larungan Telaga Ngebel sebagai penutup rangkaian.",
  },
  {
    id: "pemkab-durasi",
    title: "Berhitung Durasi Event, Grebeg Suro di Ponorogo Tidak Ada Tandingannya",
    source: "Pemkab Ponorogo",
    url: "https://ponorogo.go.id/2026/05/06/berhitung-durasi-event-grebeg-suro-di-ponorogo-tidak-ada-tandingannya/",
    dateISO: "2026-05-06",
    displayDate: "6 Mei 2026",
    category: "Persiapan",
    excerpt:
      "Dari sisi durasi dan kekayaan agenda, Pemkab menyebut Grebeg Suro tak ada tandingannya di antara event budaya daerah: berlangsung berminggu-minggu dengan puluhan mata acara religi, seni, dan hiburan rakyat.",
  },
  {
    id: "aswaja-jadwal",
    title: "Jadwal Grebeg Suro Ponorogo 2026 Lengkap, Festival Reog hingga Larungan Telaga Ngebel",
    source: "AswajaNews",
    url: "https://aswajanews.isnuponorogo.org/2026/05/24/jadwal-grebeg-suro-ponorogo-2026-lengkap-festival-reog-hingga-larungan-telaga-ngebel/",
    dateISO: "2026-05-24",
    displayDate: "24 Mei 2026",
    category: "Persiapan",
    excerpt:
      "Rangkuman jadwal resmi Grebeg Suro 2026: Simaan Al-Qur’an dan Festival Pencak Silat “Jawara Bumi Warok” pada Mei, pembukaan 6 Juni, FNRP 11–14 Juni, hingga Larungan Telaga Ngebel 16 Juni.",
  },
  {
    id: "pemkab-side-event",
    title: "Panitia Besar Grebeg Suro Pastikan 30 Side Event Siap Gelar, Festival Reog Jadi Magnet",
    source: "Pemkab Ponorogo",
    url: "https://ponorogo.go.id/2026/05/30/panitia-besar-grebeg-suro-pastikan-30-side-event-siap-gelar-festival-reog-jadi-magnet/",
    dateISO: "2026-05-30",
    displayDate: "30 Mei 2026",
    category: "Persiapan",
    excerpt:
      "Persiapan memasuki tahap akhir: panitia besar bentukan Pemkab Ponorogo memastikan 30 side event siap digelar, dengan festival reog tetap menjadi magnet utama penarik wisatawan.",
  },
  {
    id: "surabayapagi-parkir",
    title: "Jelang Grebeg Suro 2026, Dishub Ponorogo Siapkan Sejumlah Kantong Parkir",
    source: "Surabaya Pagi",
    url: "https://surabayapagi.com/news-268376-jelang-grebeg-suro-2026-dishub-ponorogo-siapkan-sejumlah-kantong-parkir",
    dateISO: "2026-06-05",
    displayDate: "Juni 2026",
    category: "Persiapan",
    excerpt:
      "Mengantisipasi lonjakan pengunjung dari berbagai daerah, Dinas Perhubungan Ponorogo menyiapkan sejumlah kantong parkir di sekitar pusat kota selama rangkaian Grebeg Suro 2026.",
  },
];

/** Artikel terurut terbaru → terlama */
export const NEWS_SORTED = [...NEWS_ARTICLES].sort((a, b) =>
  b.dateISO.localeCompare(a.dateISO)
);

export function getNewsArticle(id: string): NewsArticle | undefined {
  return NEWS_ARTICLES.find((a) => a.id === id);
}

export function byCategory(category: NewsCategory): NewsArticle[] {
  return NEWS_SORTED.filter((a) => a.category === category);
}
