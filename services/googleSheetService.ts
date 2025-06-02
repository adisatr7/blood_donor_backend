import { google, sheets_v4 } from "googleapis";
import fs from "fs";
import path from "path";
import prisma from "../prisma/prismaClient";

export default class GoogleSheetService {
  private static _gsheetClient: sheets_v4.Sheets | null = null;

  /**
   * Ambil ID Spreadsheet dari file `.env` (pastikan sudah diisi!)
   */
  private static SPREADSHEET_ID = process.env.SPREADSHEET_ID!;

  /**
   * Jalankan proses sinkronisasi data ke Google Sheets. Panggil method ini di
   * dalam worker atau scheduler untuk mengirim/export data secara otomatis.
   */
  static async perform() {
    try {
      const gsheetClient = this.getSheetsClient();

      // Skip jika `SPREADSHEET_ID` kosong
      if (!this.SPREADSHEET_ID) {
        console.warn("[GSHEET] SPREADSHEET_ID tidak ditemukan, sinkronisasi dibatalkan.");
        return;
      }

      // Siapkan data user dan appointment yang akan dikirim
      const exportUserData = await this.prepareUserExport();
      const exportAppointmentData = await this.prepareAppointmentExport();

      // Kirim data ke Google Sheets
      await this.syncToGoogleSheets(gsheetClient, exportUserData, "User!A1");
      await this.syncToGoogleSheets(gsheetClient, exportAppointmentData, "Appointment!A1");

      // Tampilkan pesan berhasil jika semua proses selesai
      console.log("[GSHEET] Data berhasil dikirim ke Google Sheet!");
    } catch (err) {
      // Jika ada error, tampilkan pesan error
      console.error("[GSHEET] Gagal mengirim data ke Google Sheet:", err);
    }
  }

  /**
   * Filter untuk data user yang akan dikirim ke Google Sheets. Pastikan hanya mengambil field
   * yang diperlukan untuk menghindari data sensitif. Ditulis disini karena dipakai berulang
   * kali sambil menghindari menulisnya berulang-ulang.
   */
  private static USER_FILTERS = {
    id: true,
    name: true,
    profilePicture: true,
    birthPlace: true,
    birthDate: true,
    gender: true,
    job: true,
    weightKg: true,
    heightCm: true,
    bloodType: true,
    rhesus: true,
    address: true,
    noRt: true,
    noRw: true,
    village: true,
    district: true,
    city: true,
    province: true,
    createdAt: true,
    updatedAt: true,
  };

  /**
   * Autentikasi dengan Google Sheets API menggunakan service account
   */
  private static getSheetsClient() {
    // Jika gsheetClient sudah dibuat sebelumnya, gunakan yang sudah ada
    if (this._gsheetClient) {
      return this._gsheetClient;
    }

    const credentialsPath = path.join(__dirname, "../credentials/google-credentials.json");
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
    const scopes = ["https://www.googleapis.com/auth/spreadsheets"];
    const auth = new google.auth.GoogleAuth({ credentials, scopes });

    // Simpan client Google Sheets ke cache agar tidak perlu dibuat ulang
    this._gsheetClient = google.sheets({ version: "v4", auth });

    return this._gsheetClient;
  }

  /**
   * Persiapkan data User untuk diekspor ke Google Sheets
   */
  private static async prepareUserExport() {
    // Ambil data user dari database sesuai konstanta USER_FILTERS di atas
    const users = await prisma.user.findMany({
      select: this.USER_FILTERS,
    });

    // Header untuk Google Sheets
    const headers = [
      "ID",
      "Nama Lengkap",
      "URL Foto Profil",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Jenis Kelamin",
      "Pekerjaan",
      "Berat Badan (Kg)",
      "Tinggi Badan (Cm)",
      "Tipe Darah",
      "Rhesus",
      "Alamat",
      "No. RT",
      "No. RW",
      "Desa/Kelurahan",
      "Kecamatan",
      "Kabupaten/Kota",
      "Provinsi",
      "Mendaftar Pada",
      "Terakhir Diperbarui",
    ];

    // Susun data sesuai urutan header
    const data = users.map((user) => [
      user.id,
      user.name,
      user.profilePicture || "",
      user.birthPlace,
      user.birthDate ? user.birthDate.toISOString().split("T")[0] : "",
      user.gender === `MALE` ? "Laki-laki" : "Perempuan",
      user.job || "",
      user.weightKg ? user.weightKg.toString() : "0",
      user.heightCm ? user.heightCm.toString() : "0",
      user.bloodType || "",
      user.rhesus === "POSITIVE" ? "Positif" : "Negatif",
      user.address || "",
      user.noRt ? user.noRt.toString() : "0",
      user.noRw ? user.noRw.toString() : "0",
      user.village || "",
      user.district || "",
      user.city || "",
      user.province || "",
      user.createdAt ? user.createdAt.toISOString() : "",
      user.updatedAt ? user.updatedAt.toISOString() : "",
    ]);

    return [headers, ...data];
  }

  /**
   * Persiapkan data Appointment untuk diekspor ke Google Sheets
   */
  private static async prepareAppointmentExport() {
    // Ambil data appointment dari database
    const appointments = await prisma.appointment.findMany({
      include: {
        User: {
          select: this.USER_FILTERS,
        },
        Location: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Judul untuk header di atas
    const headers = [
      "No",
      "Nama Lokasi",
      "Nama Lengkap Pendonor",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Jenis Kelamin",
      "Pekerjaan",
      "Berat Badan (Kg)",
      "Tinggi Badan (Cm)",
      "Tipe Darah",
      "Rhesus",
      "Alamat",
      "No. RT",
      "No. RW",
      "Desa/Kelurahan",
      "Kecamatan",
      "Kabupaten/Kota",
      "Provinsi",
      "User Mendaftar Pada",
      "User Terakhir Diperbarui",
      "Status Appointment",
      "Tanggal Appointment",
    ];

    // Susun data sesuai urutan header
    const data = appointments.map((appt, idx) => [
      idx + 1,
      appt.Location?.name || "",
      appt.User?.name || "",
      appt.User?.birthPlace || "",
      appt.User?.birthDate
        ? appt.User.birthDate.toISOString().split("T")[0]
        : "",
      appt.User?.gender === "MALE" ? "Laki-laki" : "Perempuan",
      appt.User?.job || "",
      appt.User?.weightKg ? appt.User.weightKg.toString() : "0",
      appt.User?.heightCm ? appt.User.heightCm.toString() : "0",
      appt.User?.bloodType || "",
      appt.User?.rhesus === "POSITIVE" ? "Positif" : "Negatif",
      appt.User?.address || "",
      appt.User?.noRt ? appt.User.noRt.toString() : "0",
      appt.User?.noRw ? appt.User.noRw.toString() : "0",
      appt.User?.village || "",
      appt.User?.district || "",
      appt.User?.city || "",
      appt.User?.province || "",
      appt.User?.createdAt ? appt.User.createdAt.toISOString() : "",
      appt.User?.updatedAt ? appt.User.updatedAt.toISOString() : "",
      appt.status,
      appt.createdAt ? appt.createdAt.toISOString().split("T")[0] : "",
    ]);

    return [headers, ...data];
  }

  private static async syncToGoogleSheets(gsheetClient: sheets_v4.Sheets, values: any, range: string) {
    // Kirim data ke Google Sheets
    await gsheetClient.spreadsheets.values.update({
      spreadsheetId: this.SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: { values },
    });
  }
}
