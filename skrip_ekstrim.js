import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. KONFIGURASI BEBAN MANUSIAWI (Aman dari Blokir DDoS Detection)
export const options = {
  scenarios: {
    safe_intensity_load: {
      executor: 'ramping-arrival-rate',
      startRate: 2,            // Mulai sangat santai: 2 request/detik
      timeUnit: '1s',
      preAllocatedVUs: 10,     // Alokasi awal kecil di RAM
      maxVUs: 50,              // Batas maksimal dibatasi agar tidak dikira serangan DDoS
      stages: [
        { duration: '30s', target: 10 },  // Naik perlahan ke 10 request/detik dalam 30 detik
        { duration: '1m', target: 25 },   // Puncak stabil di 25 request/detik selama 1 menit
        { duration: '30s', target: 0 },    // Menurunkan trafik kembali ke nol
      ],
    },
  },
  discardResponseBodies: true, 
};

// 2. OPTIMASI PAYLOAD
function buatDataCepat() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

export default function () {
  // <--- GANTI LINK INI DENGAN ENDPOINT TARGET LOKAL ANDA (Misal: http://localhost:8080/api/v1/register) --->
  const url = 'https://modrinth.com'; 

  const payload = JSON.stringify({
    username: `user_${buatDataCepat()}`,
    password: 'SecurePassword123!',
    email: `test_${buatDataCepat()}@local.dev`,
    phone: `0812${buatDataCepat()}`
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
      // MENYAMARKAN IDENTITAS: Agar server mengira ini trafik dari browser Chrome asli, bukan k6 bot
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    timeout: '30s', // LONGGARKAN TIMEOUT: Memberi waktu server merespons saat antrean padat
  };

  // Eksekusi pengiriman data
  const res = http.post(url, payload, params);

  // Validasi respons
  check(res, {
    'Respon Sukses (2xx)': (r) => r.status >= 200 && r.status < 300,
    'Terkena Rate Limit (429)': (r) => r.status === 429,
    'Server Kewalahan (5xx)': (r) => r.status >= 500,
  });

  // JEDA MANUSIAWI: Memberikan jeda acak antara 1 sampai 3 detik sebelum request berikutnya
  // Ini sangat krusial agar pola trafik tidak terbaca sebagai bot kaku
  sleep(Math.random() * 2 + 1);
}
