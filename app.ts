import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import errorHandler from "./middlewares/errorHandler";
import routes from "./routes/v1/index";
import swaggerDocs from "./swagger/swaggerConfig";
import GoogleSheetWorker from "./workers/googleSheetWorker";

dotenv.config(); // Ambil konfigurasi dari file `.env`

const app = express(); // Inisialisasi server Backend

// 🛠️ Import berbagai middleware pihak ketiga:
app.use(morgan("combined")); // Untuk mencatat semua aktivitas request ke console
app.use(express.json()); // Agar server bisa menerima request dengan format JSON
app.use(cors()); // Agar server bisa diakses dari aplikasi mobile (CORS)
app.use("/public", express.static("public")); // Untuk menghandle upload foto

// 🛠️ Jalankan worker untuk Google Sheets
GoogleSheetWorker.start(); // Sinkronisasi data ke Google Sheets setiap 5 menit

// 🔗 Import semua controllers ke server Backend agar bisa digunakan
app.use("/api/v1/", routes);

// 📖 Setup Swagger untuk dokumentasi API
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ⛔️ Sistem penanganan error otomatis (agar tidak ribet menulis try-catch di *setiap* controller)
app.use(errorHandler);

// 🚀 Jalankan server Backend
app.listen(process.env.BACKEND_PORT, () => {
  console.log(`Backend server is running on port ${process.env.BACKEND_PORT}!`);
});
