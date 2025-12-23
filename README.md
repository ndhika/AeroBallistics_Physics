# 🚀 AeroBallistics Physics Engine

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Canvas API](https://img.shields.io/badge/Canvas_API-orange?style=for-the-badge&logo=html5)
![Physics](https://img.shields.io/badge/Physics-RK4_Integrator-blueviolet?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**AeroBallistics** adalah simulator fisika proyektil presisi tinggi berbasis web. Proyek ini mengimplementasikan metode numerik canggih untuk memvisualisasikan gerak benda di bawah pengaruh gravitasi, hambatan udara (*drag*), dan topografi miring secara real-time.

---

## ✨ Fitur Unggulan (Core Capabilities)

Berdasarkan *engine* yang dibangun, berikut adalah kemampuan utama sistem ini:

### 🧠 1. Advanced Physics Solver
* **Runge-Kutta 4 (RK4) Integration:** Tidak menggunakan metode Euler biasa yang tidak akurat. Engine ini menggunakan RK4 untuk memprediksi posisi benda dengan presisi laboratorium.
* **Adaptive Timestep:** Sistem secara cerdas menyesuaikan `dt` (delta time). Saat benda bergerak sangat cepat atau mengalami akselerasi tinggi, simulasi memperlambat waktu hitung untuk mencegah *tunneling* (benda tembus tanah).
* **Aerodynamic Drag:** Simulasi gesekan udara kuadratik ($F \propto v^2$) yang menghasilkan kurva balistik realistis (bukan parabola sempurna).

### 🎨 2. Smart Visualization
* **Dynamic Grid System:** Garis grid (penggaris) otomatis berskala (1m, 5m, 10m, 50m) menyesuaikan level *zoom* kamera.
* **Trajectory Ghosting:** Menampilkan jejak lintasan tembakan sebelumnya (garis putus-putus) untuk perbandingan A/B testing.
* **High-Point Indicators:** Otomatis mendeteksi dan memberi label teks pada titik tertinggi ($H_{max}$) lintasan.

### 🎮 3. Interactive Viewport
* **Infinite Pan & Zoom:** Navigasi bebas menggunakan Mouse Wheel atau *Pinch gesture* (layar sentuh).
* **Terrain Slope Support:** Simulasi mendukung penembakan di tanah miring/lereng, dengan deteksi tabrakan yang diinterpolasi secara akurat.
* **Vector Aiming:** Mengarahkan meriam dengan mouse/touch dengan *clamping* sudut yang aman.

---

## 📐 Di Balik Layar: Model Matematika

Simulasi ini menangani perhitungan berikut:

### Metode Integrasi Numerik (RK4)
Posisi dan kecepatan dihitung menggunakan rata-rata terbobot dari 4 kemiringan (slopes):

$$k_1 = f(t_n, y_n)$$
$$k_2 = f(t_n + \frac{h}{2}, y_n + h\frac{k_1}{2})$$
$$k_3 = f(t_n + \frac{h}{2}, y_n + h\frac{k_2}{2})$$
$$k_4 = f(t_n + h, y_n + h k_3)$$

$$y_{n+1} = y_n + \frac{1}{6}(k_1 + 2k_2 + 2k_3 + k_4)h$$

*Metode ini memberikan error yang jauh lebih kecil dibandingkan metode standar, sangat krusial untuk simulasi jarak jauh dengan hambatan udara.*

### Gaya Hambat (Air Resistance)
Gaya pengereman dihitung setiap frame:
$$F_d = - \frac{1}{2} C_d A \rho v^2$$
Diimplementasikan dalam kode sebagai `F = k * v * v`.

### Deteksi Tumbukan (Collision)
Saat proyektil menyentuh tanah, engine melakukan **Sub-step Linear Interpolation** untuk menemukan titik pendaratan yang tepat, mencegah bola terlihat "tenggelam" ke dalam garis tanah miring.

---

## 💻 Instalasi & Menjalankan Lokal

Pastikan Anda memiliki [Node.js](https://nodejs.org/) terinstall.

1.  **Clone Repositori**
    ```bash
    git clone [https://github.com/ndhika/AeroBallistics_Physics.git](https://github.com/ndhika/AeroBallistics_Physics.git)
    cd AeroBallistics_Physics
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # atau
    yarn install
    ```

3.  **Jalankan Server Development**
    ```bash
    npm run dev
    ```

4.  Buka browser di `http://localhost:5173` (atau port yang ditampilkan).

---

## 🤝 Kontribusi

Jika Anda ingin menambahkan fitur seperti:
* Efek Magnus (Spin pada bola).
* Angin dinamis (Wind vector).
* Material proyektil yang berbeda.

Silakan fork dan buat Pull Request!

---

**Author:** [ndhika](https://github.com/ndhika)
**License:** MIT
