const express = require('express');
const path = require('path');
const app = express();
const PORT = 3009;

// Sajikan file statis dari folder public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API placeholder untuk testing frontend/backend integration nanti
app.post('/api/merge-placeholder', (req, res) => {
  res.json({ success: true, message: 'API mockup berhasil dipanggil!' });
});

// Jalankan server lokal HANYA jika tidak berjalan di Vercel (Hobby Serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Aplikasi berjalan di http://localhost:${PORT}`);
    console.log(`==================================================\n`);
  });
}

// Ekspor app agar bisa dikenali oleh Vercel
module.exports = app;
