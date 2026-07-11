import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// 1. MEMUAT DATA AKUN ASLI DARI USERS.JSON
const dataAkun = new SharedArray('daftar pengguna', function () {
  return JSON.parse(open('./users.json')).users; 
});

// 2. KONFIGURASI SIMULASI SENYAP (ALUR KERJA PENGGUNA TUNGGAL)
export const options = {
  scenarios: {
    complete_user_journey: {
      executor: 'constant-vus',
      vus: 1,               
      duration: '2m',       
    },
  },
};

export default function () {
  const userTerpilih = dataAkun[0]; // Mengambil akun pertama dari users.json

  // Header standar browser agar menyerupai aktivitas manusia asli
  const baseHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

  sleep(Math.random() * 3 + 2); // Jeda berpikir

  if (!loginSukses) return;

  // ==========================================
  // ALUR 2: MELIHAT DATA PROFIL INTERNAL
  // ==========================================
  const profileUrl = 'https://modrinth.com'; 
  const profileRes = http.get(profileUrl, { headers: baseHeaders });

  check(profileRes, {
    '2. Sukses Muat Data Profil (200)': (r) => r.status === 200,
  });

  sleep(Math.random() * 4 + 3); // Jeda membaca profil

  // ==========================================
  // ALUR 3: SIMULASI MENCARI MOD (FITUR SEARCH)
  // ==========================================
  // Meniru manusia yang mengetik di kolom pencarian untuk mencari mod "Optimization"
  const searchUrl = 'https://modrinth.com';
  const searchRes = http.get(searchUrl, { headers: baseHeaders });

  check(searchRes, {
    '3. Sukses Mencari Mod Publik (200)': (r) => r.status === 200,
  });

  sleep(Math.random() * 5 + 4); // Jeda melihat hasil pencarian

  // ==========================================
  // ALUR 4: MEMBUKA KOTAK MASUK NOTIFIKASI AKUN
  // ==========================================
  // Membuka fitur internal untuk melihat apakah akun Anda punya notifikasi baru
  const notificationUrl = `https://modrinth.com/${userTerpilih.username}/notifications`;
  const notificationRes = http.get(notificationUrl, { headers: baseHeaders });

  check(notificationRes, {
    '4. Sukses Membuka Notifikasi Akun (200)': (r) => r.status === 200,
  });

  // Siklus selesai, istirahat sebelum perputaran berikutnya
  sleep(Math.random() * 10 + 15);
}
