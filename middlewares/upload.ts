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

// ⚙️ Konfigurasi multer untuk menyimpan file ke folder sesuai ekstensi file
const storage = multer.diskStorage({
  destination: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".heic"];
    const pdfExts = [".pdf"];

    if (imageExts.includes(ext)) {
      cb(null, photosDir);
    } else if (pdfExts.includes(ext)) {
      cb(null, pdfsDir);
    } else {
      cb(new Error("Hanya file gambar dan PDF yang diperbolehkan"), "");
    }
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now().toString() + ext); // 👈 Nama file unik berdasarkan timestamp
  },
});

export default multer({ storage });
