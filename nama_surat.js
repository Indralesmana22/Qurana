// Nama surah & artinya dalam bahasa Indonesia (penulisan umum Kemenag). Bukan teks Al-Qur'an.
const SURAH_ID = [
["Al-Fatihah","Pembukaan"],["Al-Baqarah","Sapi Betina"],["Ali 'Imran","Keluarga 'Imran"],["An-Nisa'","Wanita"],["Al-Ma'idah","Hidangan"],
["Al-An'am","Binatang Ternak"],["Al-A'raf","Tempat Tertinggi"],["Al-Anfal","Rampasan Perang"],["At-Taubah","Pengampunan"],["Yunus","Nabi Yunus"],
["Hud","Nabi Hud"],["Yusuf","Nabi Yusuf"],["Ar-Ra'd","Guruh"],["Ibrahim","Nabi Ibrahim"],["Al-Hijr","Gunung Al-Hijr"],
["An-Nahl","Lebah"],["Al-Isra'","Perjalanan Malam"],["Al-Kahf","Penghuni-penghuni Gua"],["Maryam","Maryam"],["Taha","Taha"],
["Al-Anbiya'","Para Nabi"],["Al-Hajj","Haji"],["Al-Mu'minun","Orang-orang Mukmin"],["An-Nur","Cahaya"],["Al-Furqan","Pembeda"],
["Asy-Syu'ara'","Para Penyair"],["An-Naml","Semut"],["Al-Qasas","Kisah-kisah"],["Al-'Ankabut","Laba-laba"],["Ar-Rum","Bangsa Romawi"],
["Luqman","Luqman"],["As-Sajdah","Sujud"],["Al-Ahzab","Golongan-golongan yang Bersekutu"],["Saba'","Kaum Saba'"],["Fatir","Pencipta"],
["Yasin","Yasin"],["As-Saffat","Barisan-barisan"],["Sad","Sad"],["Az-Zumar","Rombongan-rombongan"],["Gafir","Maha Pengampun"],
["Fussilat","Yang Dijelaskan"],["Asy-Syura","Musyawarah"],["Az-Zukhruf","Perhiasan"],["Ad-Dukhan","Kabut"],["Al-Jasiyah","Yang Berlutut"],
["Al-Ahqaf","Bukit-bukit Pasir"],["Muhammad","Nabi Muhammad"],["Al-Fath","Kemenangan"],["Al-Hujurat","Kamar-kamar"],["Qaf","Qaf"],
["Az-Zariyat","Angin yang Menerbangkan"],["At-Tur","Bukit"],["An-Najm","Bintang"],["Al-Qamar","Bulan"],["Ar-Rahman","Yang Maha Pengasih"],
["Al-Waqi'ah","Hari Kiamat"],["Al-Hadid","Besi"],["Al-Mujadalah","Gugatan"],["Al-Hasyr","Pengusiran"],["Al-Mumtahanah","Wanita yang Diuji"],
["As-Saff","Barisan"],["Al-Jumu'ah","Hari Jumat"],["Al-Munafiqun","Orang-orang Munafik"],["At-Tagabun","Hari Dinampakkan Kesalahan-kesalahan"],["At-Talaq","Talak"],
["At-Tahrim","Pengharaman"],["Al-Mulk","Kerajaan"],["Al-Qalam","Pena"],["Al-Haqqah","Hari Kiamat"],["Al-Ma'arij","Tempat-tempat Naik"],
["Nuh","Nabi Nuh"],["Al-Jinn","Jin"],["Al-Muzzammil","Orang yang Berselimut"],["Al-Muddassir","Orang yang Berkemul"],["Al-Qiyamah","Hari Kiamat"],
["Al-Insan","Manusia"],["Al-Mursalat","Malaikat-malaikat yang Diutus"],["An-Naba'","Berita Besar"],["An-Nazi'at","Malaikat-malaikat yang Mencabut"],["'Abasa","Ia Bermuka Masam"],
["At-Takwir","Menggulung"],["Al-Infitar","Terbelah"],["Al-Mutaffifin","Orang-orang yang Curang"],["Al-Insyiqaq","Terbelah"],["Al-Buruj","Gugusan Bintang"],
["At-Tariq","Yang Datang di Malam Hari"],["Al-A'la","Yang Paling Tinggi"],["Al-Gasyiyah","Hari Pembalasan"],["Al-Fajr","Fajar"],["Al-Balad","Negeri"],
["Asy-Syams","Matahari"],["Al-Lail","Malam"],["Ad-Duha","Duha"],["Asy-Syarh","Kelapangan"],["At-Tin","Buah Tin"],
["Al-'Alaq","Segumpal Darah"],["Al-Qadr","Kemuliaan"],["Al-Bayyinah","Bukti Nyata"],["Az-Zalzalah","Guncangan"],["Al-'Adiyat","Kuda Perang yang Berlari Kencang"],
["Al-Qari'ah","Hari Kiamat"],["At-Takasur","Bermegah-megahan"],["Al-'Asr","Masa"],["Al-Humazah","Pengumpat"],["Al-Fil","Gajah"],
["Quraisy","Suku Quraisy"],["Al-Ma'un","Barang-barang yang Berguna"],["Al-Kausar","Nikmat yang Banyak"],["Al-Kafirun","Orang-orang Kafir"],["An-Nasr","Pertolongan"],
["Al-Lahab","Gejolak Api"],["Al-Ikhlas","Ikhlas"],["Al-Falaq","Waktu Subuh"],["An-Nas","Manusia"]
];
const sName = n => (SURAH_ID[n - 1] || [])[0] || ('Surah ' + n);
const sMean = n => (SURAH_ID[n - 1] || [])[1] || '';