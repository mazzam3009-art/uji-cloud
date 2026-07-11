import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data'; // 1. WAJIB IMPORT INI

// 2. MEMUAT DATA JSON KE MEMORI SECARA EFISIEN
const dataAkun = new SharedArray('daftar pengguna', function () {
  // Membaca file users.json dan mengambil properti array "users"
  return JSON.parse(open('./users.json')).users; 
});

export const options = {
  scenarios: {
    login_test: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 10,
      maxVUs: 50,
      stages: [
        { duration: '30s', target: 20 }, // Naik perlahan ke 20 request/detik
        { duration: '1m', target: 20 },  // Stabil di 20 request/detik selama 1 menit
        { duration: '10s', target: 0 },   // Menurunkan trafik kembali ke nol
      ],
    },
  },
};

export default function () {
  // 3. MENGAMBIL AKUN SECARA ACAK DARI FILE JSON
  const indeksAcak = Math.floor(Math.random() * dataAkun.length);
  const userTerpilih = dataAkun[indeksAcak];

  const url = 'https://modrinth.com'; 

  // Memasukkan data asli hasil pembacaan JSON ke dalam payload
  const payload = JSON.stringify({
    username: userTerpilih.username,
    password: userTerpilih.password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    timeout: '10s',
  };

  // Eksekusi request login
  const res = http.post(url, payload, params);

  // Validasi hasil login
  check(res, {
    'Login Berhasil (200)': (r) => r.status === 200,
    'Gagal Otentikasi (401)': (r) => r.status === 401,
    'Terkena Pembatasan (429)': (r) => r.status === 429,
  });

  sleep(Math.random() * 2 + 1);
}
