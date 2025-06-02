import cron from "node-cron";
import GoogleSheetService from "../services/googleSheetService";

// Atur seberapa sering sistem Backend harus mengirim data ke Google Sheets
const DURATION = "*/5 * * * *"; // 5 menit

export default class GoogleSheetWorker {
  /**
   * Otomatis jalankan sinkronisasi data dengan Google Sheets
   */
  static start() {
    cron.schedule(DURATION, () => {
      GoogleSheetService.perform();
    });
  }
}
