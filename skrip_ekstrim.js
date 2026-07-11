import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// 1. MEMUAT DATA AKUN ASLI DARI USERS.JSON
const dataAkun = new SharedArray('daftar pengguna', function () {
  return JSON.parse(open('./users.json')).users; 
});

// 2. KONFIGURASI SIMULASI SILUMAN (1 USER)
export const options = {
  scenarios: {
    cookie_auth_simulation: {
      executor: 'constant-vus',
      vus: 1,               
      duration: '1m',       
    },
  },
};

export default function () {
  // Mengambil data akun dari file json
  const userTerpilih = dataAkun[0]; 

  // Header standar browser agar tidak dicurigai sebagai bot
  const baseHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  // --- LANGKAH 1: PROSES LOGIN ---
  const loginUrl = 'https://modrinth.com'; 
  const loginPayload = JSON.stringify({
    username: userTerpilih.username,
    password: userTerpilih.password,
  });

  const loginRes = http.post(loginUrl, loginPayload, { headers: baseHeaders });

  // Validasi apakah login awal berhasil
  const loginSukses = check(loginRes, {
    '1. Berhasil Jabat Tangan Login (200)': (r) => r.status === 200,
  });

  // --- LANGKAH 2: LANGSUNG TEMBAK FITUR DALAM (Cookie Otomatis Berjalan) ---
  if (loginSukses) {
    // Alamat API untuk melihat profil pengguna yang sedang login
    const profileUrl = 'https://modrinth.com'; 
    
    // k6 otomatis mengirimkan Cookie Sesi di latar belakang, cukup gunakan baseHeaders
    const profileRes = http.get(profileUrl, { headers: baseHeaders });

    // Validasi apakah data profil internal berhasil diakses
    check(profileRes, {
      '2. Sukses Masuk Fitur Internal Akun (200)': (r) => r.status === 200,
    });
  }

  // Jeda waktu berpikir manusiawi (10 sampai 15 detik) agar tidak memicu alarm keamanan
  sleep(Math.random() * 5 + 10);
}
