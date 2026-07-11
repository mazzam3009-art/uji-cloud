import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. KONFIGURASI BEBAN EKSTREM (Meningkatkan VUs Konkuren)
export const options = {
  scenarios: {
    high_intensity_load: {
      executor: 'ramping-arrival-rate',
      startRate: 50,           // Detik awal langsung memompa 50 request/detik
      timeUnit: '1s',
      preAllocatedVUs: 200,    // Menyiapkan 200 Virtual Users awal di memori RAM
      maxVUs: 2000,            // Batas maksimal hingga 2000 Virtual Users paralel
      stages: [
        { duration: '30s', target: 500 },  // Naik cepat ke 500 request/detik dalam 30 detik
        { duration: '1m', target: 1200 },  // Hantaman Maksimal: 1200 request/detik selama 1 menit!
        { duration: '30s', target: 0 },    // Menurunkan trafik kembali ke nol
      ],
    },
  },
  discardResponseBodies: true, // WAJIB TRUE: Menghemat RAM agar k6 tidak crash saat menerima ribuan respons
};

// 2. OPTIMASI PAYLOAD: Menggunakan generator angka cepat agar komputasi k6 ringan
function buatDataCepat() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

export default function () {
  // <--- GANTI LINK INI DENGAN ENDPOINT TARGET LOKAL ANDA (Misal: http://localhost:8080/api/v1/register) --->
  const url = 'https://modrinth.com'; 

  // Struktur data dibuat konstan dan dioptimalkan agar eksekusi per milidetik tidak membebani CPU penguji
  const payload = JSON.stringify({
    username: `user_${buatDataCepat()}`,
    password: 'SecurePassword123!',
    email: `test_${buatDataCepat()}@local.dev`,
    phone: `0812${buatDataCepat()}`
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive', // Memaksa penggunaan ulang soket TCP agar throughput maksimal
    },
    timeout: '3s', // Batasi 3 detik; jika server lokal melambat, langsung catat sebagai timeout
  };

  // Eksekusi pengiriman data dengan performa maksimal
  const res = http.post(url, payload, params);

  // Validasi ketahanan aplikasi backend Anda
  check(res, {
    'Respon Sukses (2xx)': (r) => r.status >= 200 && r.status < 300,
    'Server Mulai Kewalahan (5xx)': (r) => r.status >= 500,
  });

  // Jeda sangat tipis (Jitter minimal) untuk menjaga kestabilan antrean koneksi
  sleep(Math.random() * 0.05 + 0.01);
}
