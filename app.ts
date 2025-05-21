import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import errorHandler from "./middlewares/errorHandler";
import routes from "./routes/v1/index";

dotenv.config(); // Ambil konfigurasi dari file `.env`

const app = express(); // Inisialisasi server Backend

// 🛠️ Import berbagai middleware pihak ketiga:
app.use(morgan("combined")); // Untuk mencatat semua aktivitas request ke console
app.use(express.json()); // Agar server bisa menerima request dengan format JSON
app.use(cors()); // Agar server bisa diakses dari aplikasi mobile (CORS)

// 🔗 Import semua controllers ke server Backend agar bisa digunakan
app.use("/api/v1/", routes);

// ⛔️ Sistem penanganan error otomatis (agar tidak ribet menulis try-catch di *setiap* controller)
app.use(errorHandler);

// 🚀 Jalankan server Backend
app.listen(process.env.BACKEND_PORT, () => {
  console.log(`Backend server is running on port ${process.env.BACKEND_PORT}!`);
});
