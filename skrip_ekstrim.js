import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// 1. MEMUAT DATA AKUN ASLI DARI USERS.JSON
const dataAkun = new SharedArray('daftar pengguna', function () {
  return JSON.parse(open('./users.json')).users; 
});

// 2. KONFIGURASI SIMULASI SENYAP (1 USER AGAR TIDAK DI-BLOKIR)
export const options = {
  scenarios: {
    token_chaining_simulation: {
      executor: 'constant-vus',
      vus: 1,               
      duration: '1m',       
    },
  },
};

export default function () {
  // Mengambil 1 data akun yang ada di dalam users.json
  const userTerpilih = dataAkun[0]; 

  // --- LANGKAH 1: PROSES LOGIN UNTUK MENDAPATKAN TOKEN ---
  const loginUrl = 'https://modrinth.com'; 
  const loginPayload = JSON.stringify({
    username: userTerpilih.username,
    password: userTerpilih.password,
  });

  const baseHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  const loginRes = http.post(loginUrl, loginPayload, { headers: baseHeaders });

  // Validasi apakah proses masuk log awal berhasil
  const loginSukses = check(loginRes, {
    '1. Berhasil Jabat Tangan Login (200)': (r) => r.status === 200,
  });

  // --- LANGKAH 2: EKSTRAKSI & PENGGUNAAN TOKEN SECARA OTOMATIS ---
  if (loginSukses) {
    // Membaca isi body JSON dari server dan mengambil string tokennya
    // Catatan: Jika Modrinth mengembalikan field bernama 'token', gunakan .token
    // Jika namanya 'access_token' (OAuth), ganti menjadi .access_token
    const tokenKunci = loginRes.json().token || loginRes.json().access_token; 

    if (tokenKunci) {
      // Menyusun header baru yang sudah disisipi "Kunci Digital" Token Anda
      const authenticatedHeaders = Object.assign({}, baseHeaders, {
        'Authorization': `Bearer ${tokenKunci}`, // <--- Menempelkan kunci digital
      });

      // --- LANGKAH 3: MENEMBAK FITUR DI DALAM AKUN (CONTOH: CEK PROFIL USER) ---
      const profileUrl = 'https://modrinth.com'; 
      const profileRes = http.get(profileUrl, { headers: authenticatedHeaders });

      // Validasi apakah server mengenali kunci digital yang kita bawa
      check(profileRes, {
        '2. Sukses Masuk Fitur Internal Akun (200)': (r) => r.status === 200,
      });
    }
  }

  // Jeda waktu berpikir manusiawi agar server tidak mendeteksi aktivitas bot massal
  sleep(Math.random() * 5 + 10);
}
