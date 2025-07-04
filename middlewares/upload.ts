import fs from "fs";
import multer from "multer";
import path from "path";

// 💡 Tentukan folder upload untuk foto dan PDF
const photosDir = path.join(__dirname, "../public/uploads/photos");
const pdfsDir = path.join(__dirname, "../public/uploads/pdfs");

// 🗂️ Pastikan folder upload sudah ada
[photosDir, pdfsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ⚙️ Konfigurasi multer untuk menyimpan file ke folder sesuai tipe file
const storage = multer.diskStorage({
  destination: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      // 📷 Simpan gambar ke folder photos
      cb(null, photosDir);
    } else if (file.mimetype === "application/pdf") {
      // 📄 Simpan PDF ke folder pdfs
      cb(null, pdfsDir);
    } else {
      // ❌ Jika bukan gambar atau PDF, tolak upload
      cb(new Error("Hanya file gambar dan PDF yang diperbolehkan"), "");
    }
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now().toString() + ext); // 👈 Nama file unik berdasarkan timestamp
  },
});

export default multer({ storage });
