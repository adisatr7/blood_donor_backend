import fs from "fs";
import { google, sheets_v4 } from "googleapis";
import https from "https";
import http from "http";
import path from "path";
import type { AppointmentStatus } from "../prisma/client";
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

      // 1. Ambil data inputan dari Google Sheets
      const newLocationsData = await this.readNewLocationsFromSheet(gsheetClient);
      await this.saveNewLocations(gsheetClient, newLocationsData);

      // 2. Pantau perubahan data appointment di sheet (jika ada)
      await this.updateAppointmentStatus(gsheetClient);

      // 3. Kosongkan semua kolom view
      await gsheetClient.spreadsheets.values.clear({
        spreadsheetId: this.SPREADSHEET_ID,
        range: "Lihat Daftar Akun!A1:T",
      });
      await gsheetClient.spreadsheets.values.clear({
        spreadsheetId: this.SPREADSHEET_ID,
        range: "Lihat Pendaftaran Donor!A1:I",
      });
      await gsheetClient.spreadsheets.values.clear({
        spreadsheetId: this.SPREADSHEET_ID,
        range: "Lihat Lokasi Donor!A1:H",
      });

      // 4. Siapkan dan kirim data untuk di-export ke Google Spreadsheet
      const userData = await this.prepareUserExport();
      const appointmentData = await this.prepareAppointmentExport();
      const locationData = await this.prepareLocationExport();

      await this.syncToGoogleSheets(
        gsheetClient,
        userData, // Data user
        "Lihat Daftar Akun!A1"
      );
      await this.syncToGoogleSheets(
        gsheetClient,
        appointmentData, // Data appointment
        "Lihat Pendaftaran Donor!A1"
      );
      await this.syncToGoogleSheets(
        gsheetClient,
        locationData, // Data lokasi
        "Lihat Lokasi Donor!A1"
      );

      // Tampilkan pesan berhasil jika semua proses selesai
      console.log("[GSHEET] Sinkronisasi ke Google Sheets berhasil.");
    } catch (err) {
      // Jika ada error, tampilkan pesan error
      console.error("[GSHEET] Terjadi kesalahan saat sinkronisasi ke Google Sheets:", err);
    }
  }

  /**
   * Filter untuk data user yang akan dikirim ke Google Sheets. Pastikan hanya mengambil field
   * yang diperlukan untuk menghindari data sensitif. Ditulis disini karena dipakai berulang
   * kali sambil menghindari menulisnya berulang-ulang.
   */
  private static USER_FILTERS = {
    id: true,
    nik: true,
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

    let credentials: any;
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
      // Jika ada GOOGLE_CREDENTIALS_JSON di `.env` pakai yang itu
      try {
        credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      } catch (err) {
        throw new Error("GOOGLE_CREDENTIALS_JSON is not valid JSON");
      }
    } else {
      // Jika tidak ada, cek directory `/credentials/google-credentials.json`
      const credentialsPath = path.join(
        __dirname,
        "../credentials/google-credentials.json"
      );
      credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
    }

    const scopes = ["https://www.googleapis.com/auth/spreadsheets"];
    const auth = new google.auth.GoogleAuth({ credentials, scopes });

    // Simpan client Google Sheets ke cache agar tidak perlu dibuat ulang
    this._gsheetClient = google.sheets({ version: "v4", auth });

    return this._gsheetClient;
  }

  /**
   * Ambil koordinat dari URL Google Maps. Jika URL adalah link pendek (shortened link),
   * resolve dulu ke URL lengkapnya, lalu ambil koordinatnya.
   */
  private static async extractLatLngFromGmapUrl(url: string): Promise<{ lat: number; lng: number } | null> {
    let fullUrl = url;

    // Jika URL adalah link pendek (shortened link), resolve dulu ke URL lengkapnya
    if (url.includes("maps.app.goo.gl") || url.includes("goo.gl")) {
      try {
        fullUrl = await this.resolveRedirectUrl(url);
      } catch (err) {
        console.error(`[GSHEET] Failed to resolve shortened URL: ${url}`, err);
        return null;
      }
    }

    // Ambil koordinat dari URL lengkap
    return this.parseCoordinatesFromUrl(fullUrl);
  }

  /**
   * Resolve URL pendek (shortened URL) menjadi URL lengkap.
   * Menggunakan HTTP/HTTPS request untuk mengikuti redirect.
   */
  private static async resolveRedirectUrl(shortUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const protocol = shortUrl.startsWith("https:") ? https : http;

      const req = protocol.get(shortUrl, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          resolve(res.headers.location);
        } else {
          reject(new Error(`Gagal mengalihkan ${shortUrl}`));
        }
      });

      req.on("error", reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });
    });
  }

  /**
   * Parse koordinat dari URL Google Maps.
   */
  private static parseCoordinatesFromUrl(url: string): { lat: number; lng: number } | null {
    // Metode 1: Coba match @lat,lng (contoh: https://maps.app.goo.gl/abc123@-6.123456,106.123456)
    const atMatch = url.match(this.AT_PATTERN);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    // Metode 2: Coba match ?q=lat,lng atau &q=lat,lng
    const qMatch = url.match(this.Q_PATTERN);
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }

    // Metode 3: Coba match URL nama tempat: /(-?\d+\.\d+),(-?\d+\.\d+)/
    const placeMatch = url.match(this.PLACE_PATTERN);
    if (placeMatch) {
      return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
    }

    // Jika semua metode gagal, return null
    return null;
  }

  /**
   * Baca data dari Google Sheets berdasarkan range yang diberikan.
   */
  static async readNewLocationsFromSheet(gsheetClient: sheets_v4.Sheets) {
    const response = await gsheetClient.spreadsheets.values.get({
      spreadsheetId: this.SPREADSHEET_ID,
      range: "Tambah Lokasi Donor!A3:F",
    });

    const rows = response.data.values || [];
    const result: any[] = [];

    for (const row of rows) {
      if (
        !row ||
        row.every((cell: any) => !cell || cell.toString().trim() === "")
      ) {
        break;
      }
      result.push(row);
    }

    return result;
  }

  /**
   * Simpan data lokasi baru ke database
   */
  private static async saveNewLocations(gsheetClient: sheets_v4.Sheets, newData: string[][]) {
    for (let i = 0; i < newData.length; i++) {
      const location = newData[i];

      const [
        name,
        latitudeRaw,
        longitudeRaw,
        mapLink,
        startTimeRaw,
        endTimeRaw,
      ] = location;

      let latitude: number | null = latitudeRaw
        ? parseFloat(latitudeRaw)
        : null;

      let longitude: number | null = longitudeRaw
        ? parseFloat(longitudeRaw)
        : null;

      if (!location[0] || !location[4] || !location[5]) {
        console.warn(
          `[GSHEET] Baris ${
            i + 1
          } tidak memiliki data yang lengkap. Lokasi akan diabaikan.`
        );
        continue;
      }

      // Coba ambil koordinat dari kolom ke-2 dan ke-3
      if (location[1] && location[2]) {
        latitude = parseFloat(location[1]);
        longitude = parseFloat(location[2]);
      }

      // Jika tidak ada, coba ambil dari kolom ke-4
      if ((!latitude || !longitude) && mapLink) {
        const coords = await this.extractLatLngFromGmapUrl(mapLink);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lng;
          console.log(`[GSHEET] Extracted coordinates from map link: ${latitude}, ${longitude}`);
        }
      }

      // Jika sama sekali tidak ada koordinat, skip lokasi ini
      if (!latitude || !longitude) {
        console.error(`[GSHEET] Lokasi "${name}" tidak memiliki koordinat yang valid. Lokasi akan diabaikan.`);
        continue;
      }

      // Convert objek dari ISO string ke Date yang dapat diterima oleh sistem
      const startTime =
        startTimeRaw && !isNaN(Date.parse(startTimeRaw))
          ? new Date(startTimeRaw)
          : "ERROR: Waktu Mulai Tidak Valid";

      const endTime =
        endTimeRaw && !isNaN(Date.parse(endTimeRaw))
          ? new Date(endTimeRaw)
          : "ERROR: Waktu Selesai Tidak Valid";

      // Jika semua data lengkap, simpan lokasi ke database
      await prisma.location.create({
        data: {
          name,
          latitude,
          longitude,
          startTime,
          endTime,
        },
      });

      // Jika data berhasil dibuat, hapus barisnya di Google Spreadsheet agar tidak ada duplikat
      await gsheetClient.spreadsheets.values.clear({
        spreadsheetId: this.SPREADSHEET_ID,
        range: `Tambah Lokasi Donor!A${i + 3}:F${i + 3}`,
      });

      console.log(`[GSHEET] Lokasi "${location[0]}" berhasil disimpan ke database.`);
    }
  }

  /**
   * Cek baris appointment yang di-edit (kolom A ada isinya), lalu update ke DB
   */
  private static async updateAppointmentStatus(gsheetClient: sheets_v4.Sheets) {
    // Ambil data dari sheet appointment
    const response = await gsheetClient.spreadsheets.values.get({
      spreadsheetId: this.SPREADSHEET_ID,
      range: "Lihat Pendaftaran Donor!A2:I",
    });
    const rows = response.data.values || [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Jika kolom A (Mode Edit) ada isinya (bisa TRUE, 1, atau apapun)
      if (row[0] && row[0].toString().trim() !== "") {
        const appointmentId = parseInt(row[2]); // C: ID Appointment
        const userId = parseInt(row[3]); // D: ID User
        const status = row[8]; // I: Status Donor

        // Siapkan data yang akan di-update
        const updateData: any = {};
        if (status) {
          const statusMapping: Record<string, AppointmentStatus> = {
            Terdaftar: "SCHEDULED",
            Hadir: "ATTENDED",
            "Tidak Hadir": "MISSED",
          };
          updateData.status = statusMapping[status] || "MISSED";
        }

        try {
          if (Object.keys(updateData).length > 0) {
            await prisma.appointment.update({
              where: { id: appointmentId, userId },
              data: updateData,
            });

            console.log(`[GSHEET] Status donor ID ${appointmentId} berhasil diperbarui`);
          } else {
            console.log(`[GSHEET] Tidak ada perubahan status untuk donor ID ${appointmentId}`);
          }
        } catch (err) {
          console.error(`[GSHEET] Gagal memperbarui status donor ID ${appointmentId}:`, err);
        }
      }
    }
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
   * Parse status appointment menjadi string yang lebih mudah dibaca
   * Misalnya: "PENDING" menjadi "Menunggu Konfirmasi"
   */
  private static parseStatus(status: AppointmentStatus) {
    switch (status) {
      case "SCHEDULED":
        return "Terdaftar";
      case "ATTENDED":
        return "Hadir";
      case "MISSED":
        return "Tidak Hadir";
      default:
        return "ERROR: Status Tidak Dikenal";
    }
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
            endTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Judul untuk header di atas
    const headers = [
      "Mode Edit",
      "No.",
      "ID Appointment",
      "ID User",
      "NIK",
      "Nama Lengkap Pendonor",
      "Tanggal Donor",
      "Lokasi Donor",
      "Status Donor",
    ];

    // Susun data sesuai urutan header
    const data = appointments.map((appt, idx) => [
      "",
      idx + 1,
      appt.id,
      appt.User.id,
      appt.User.nik || "",
      appt.User.name || "",
      appt.Location.endTime || "",
      appt.Location.name || "",
      this.parseStatus(appt.status),
    ]);

    return [headers, ...data];
  }

  private static formatDate(date: Date): string {
    return date.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  private static async prepareLocationExport() {
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        startTime: true,
        endTime: true,
        createdAt: true,
      },
      where: {
        deletedAt: null, // Pastikan hanya mengambil lokasi yang belum dihapus
      },
    });

    const headers = [
      "No.",
      "ID Lokasi",
      "Nama Lokasi",
      "Lattitude (Lintang)",
      "Longitude (Bujur)",
      "Waktu Mulai",
      "Waktu Selesai",
      "Tanggal Lokasi Ditambahkan",
    ];

    // Susun data sesuai urutan header
    const data = locations.map((loc, idx) => [
      idx + 1,
      loc.id,
      loc.name,
      loc.latitude ? loc.latitude.toFixed(6) : "",
      loc.longitude ? loc.longitude.toFixed(6) : "",
      loc.startTime ? this.formatDate(loc.startTime) : "",
      loc.endTime ? this.formatDate(loc.endTime) : "",
      loc.createdAt ? this.formatDate(loc.createdAt) : "",
    ]);

    return [headers, ...data];
  }

  private static async syncToGoogleSheets(
    gsheetClient: sheets_v4.Sheets,
    values: any,
    range: string
  ) {
    // Kirim data ke Google Sheets
    await gsheetClient.spreadsheets.values.update({
      spreadsheetId: this.SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: { values },
    });
  }
}
