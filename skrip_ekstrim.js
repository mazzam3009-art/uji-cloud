import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// 1. MEMUAT DATA AKUN ASLI DARI USERS.JSON
const dataAkun = new SharedArray('daftar pengguna', function () {
  return JSON.parse(open('./users.json')).users; 
});

// 2. KONFIGURASI EKSTREM TAPI SENYAP (Stealth Stress Testing)
export const options = {
  stages: [
    { duration: '30s', target: 5 },  // Langkah 1: 5 pengguna asli masuk bersamaan secara halus
    { duration: '1m', target: 15 },  // Langkah 2: Naik ke 15 pengguna paralel (Batas aman API publik)
    { duration: '30s', target: 0 },  // Langkah 3: Menurunkan trafik kembali ke nol
  ],
  discardResponseBodies: true, // Wajib true agar RAM server penguji tidak jebol
};

export default function () {
  // Mengambil data akun dari file JSON secara dinamis berdasarkan nomor VU
  const indeksAkun = __VU % dataAkun.length;
  const userTerpilih = dataAkun[indeksAkun];

  // 3. SIDIK JARI PERAMBAN (Bebas dari Deteksi Bot Cloudflare)
  const baseHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
  };

  // ==========================================
  // ALUR 1: PROSES LOGIN (JABAT TANGAN UTAMA)
  // ==========================================
  const loginUrl = 'https://modrinth.com'; 
  const loginPayload = JSON.stringify({
    username: userTerpilih.username,
    password: userTerpilih.password,
  });

  const loginRes = http.post(loginUrl, loginPayload, { headers: baseHeaders });

  const loginSukses = check(loginRes, {
    '1. Sukses Login Akun (200)': (r) => r.status === 200,
  });

  // Jeda mengetik/menunggu halaman beralih (Think Time)
  sleep(Math.random() * 2 + 2);

  if (!loginSukses) return;

  // ==========================================
  // ALUR 2: MELIHAT DATA PROFIL INTERNAL
  // ==========================================
  const profileUrl = 'https://modrinth.com'; 
  const profileRes = http.get(profileUrl, { headers: baseHeaders });

  check(profileRes, {
    '2. Sukses Muat Data Profil (200)': (r) => r.status === 200,
  });

  // Jeda membaca informasi profil
  sleep(Math.random() * 3 + 2);

  // ==========================================
  // ALUR 3: SIMULASI MENCARI MOD (FITUR SEARCH)
  // ==========================================
  const searchUrl = 'https://modrinth.com';
  const searchRes = http.get(searchUrl, { headers: baseHeaders });

  check(searchRes, {
    '3. Sukses Mencari Mod Publik (200)': (r) => r.status === 200,
  });

  // Jeda melihat hasil pencarian
  sleep(Math.random() * 4 + 3);

  // ==========================================
  // ALUR 4: MEMBUKA FITUR PROYEK AKUN PRIBADI (PASTI SUKSES)
  // ==========================================
  const projectsUrl = `https://modrinth.com/${userTerpilih.username}/projects`;
  const projectsRes = http.get(projectsUrl, { headers: baseHeaders });

  check(projectsRes, {
    '4. Sukses Membuka Daftar Proyek Akun (200)': (r) => r.status === 200,
  });

  // Siklus selesai. Jeda acak manusiawi sebelum perputaran berikutnya
  sleep(Math.random() * 5 + 10);
}
