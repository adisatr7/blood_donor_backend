import cron from "node-cron";
import GoogleSheetService from "../services/googleSheetService";

// Atur seberapa sering sistem Backend harus mengirim data ke Google Sheets
const DURATION = "*/5 * * * *"; // 5 menit

// Otomatis jalankan sinkronisasi data dengan Google Sheets
cron.schedule(DURATION, () => {
  GoogleSheetService.perform();
});
