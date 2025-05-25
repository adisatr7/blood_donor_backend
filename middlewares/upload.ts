import fs from "fs";
import multer from "multer";
import path from "path";

// 💡 Tentukan folder untuk menyimpan file yang diupload user
const uploadDir = path.join(__dirname, "../public/uploads");

// 🗂️ Jika folder belum ada, buat folder baru
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ⚙️ Konfigurasi multer untuk menyimpan file yang diupload ke folder `public/uploads`
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now().toString() + ext); // 👈 Nama file yang di-upload
  },
});

export default multer({ storage });
