import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// 1. MEMUAT DATA AKUN ASLI
const dataAkun = new SharedArray('daftar pengguna', function () {
  return JSON.parse(open('./users.json')).users; 
});

// 2. KONFIGURASI SIMULASI MANUSIA ASLI (Sangat Santai & Natural)
export const options = {
  scenarios: {
    human_behavior_simulation: {
      executor: 'constant-vus',
      vus: 1,               // Cukup 1 sampai 2 Virtual User saja (seolah-olah Anda sendiri yang pakai)
      duration: '2m',       // Jalankan simulasi selama 2 menit
    },
  },
};

export default function () {
  // Mengambil data akun
  const userTerpilih = dataAkun[0]; 

  const url = 'https://modrinth.com'; 

  const payload = JSON.stringify({
    username: userTerpilih.username,
    password: userTerpilih.password,
  });

  // 3. MENYUSUN HEADER PERAMBAN YANG SEMPURNA
  const params = {
    headers: {
      'Content-Type': 'application/json',
      // Meniru browser Google Chrome versi terbaru di Windows 11
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
    },
    timeout: '15s',
  };

  // Eksekusi request login
  const res = http.post(url, payload, params);

  // Validasi hasil
  check(res, {
    'Sukses Masuk (200)': (r) => r.status === 200,
    'Diblokir Sistem (429)': (r) => r.status === 429,
  });

  // 4. "THINK TIME" (JEDA ACAK MANUSIAWI)
  // Manusia tidak mungkin login setiap 1 detik sekali. 
  // Kita beri jeda acak yang panjang antara 8 sampai 15 detik sebelum mencoba lagi.
  const waktuBerpikirManusia = Math.random() * 7 + 8; 
  sleep(waktuBerpikirManusia);
}
