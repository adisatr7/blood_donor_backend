import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma/prismaClient";

// Secret keys diambil dari file `.env`
const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_EXPIRE = process.env.JWT_EXPIRE ?? "1h";

export default class AuthService {
  /**
   * Method untuk login user.
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil data login dari request body
      const { nik, password } = req.body;

      // Cek apakah ada user dengan NIK yang diberikan
      const user = await prisma.user.findUnique({ where: { nik } });

      // Jika tidak ada, kirim pesan error melalui response ke mobile app
      if (!user) {
        res
          .status(404)
          .json({ success: false, error: "NIK Anda belum terdaftar" });
        return;
      }

      // Jika ada user dengan NIK tersebut, cek password-nya
      const isPasswordValid = await bcrypt.compare(password, user.password);

      // Jika password salah, kirim pesan error melalui response ke mobile app
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: "Kata sandi yang Anda masukkan salah",
        });
        return;
      }

      // Jika password benar, buat token JWT agar dapat mengakses route yang wajib login
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE as any, // `as any` digunakan untuk menghindari warning pada TypeScript
      });

      // Kirimkan token JWT ke mobile app
      res.json({ success: true, token });
    } catch (error) {
      // Jika terjadi error, kirimkan pesan error melalui response ke mobile app
      next(error);
    }
  }

  /**
   * Method untuk registrasi user baru.
   */
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil data registrasi dari request body
      const { nik, password, ...userData } = req.body;

      // Cek apakah ada user dengan NIK yang diberikan
      const existingUser = await prisma.user.findUnique({ where: { nik } });

      // Jika NIK sudah terdaftar, kirim pesan error melalui response ke mobile app
      if (existingUser) {
        res.status(409).json({ success: false, error: "NIK sudah terdaftar" });
        return;
      }

      // Enkripsi password menggunakan bcrypt agar tidak mudah dibaca dan lebih aman
      const hashedPassword = await bcrypt.hash(password, 10);

      // Jika ada foto profil yang diupload, simpan di folder `public/uploads`
      let profilePictureUrl;
      if (req.file) {
        profilePictureUrl = `/public/uploads/${req.file.filename}`;
      }

      // Simpan data user baru ke database
      const newUser = await prisma.user.create({
        data: {
          nik,
          name: userData.name,
          password: hashedPassword, // Password yang disimpan adalah password yang sudah dienkripsi
          profilePicture: profilePictureUrl, // Simpan foto profil (jika ada)
          birthPlace: userData.birthPlace,
          birthDate: new Date(userData.birthDate), // Ubah format tanggal menjadi Date
          gender: userData.gender,
          job: userData.job,
          weightKg: userData.weightKg ? parseFloat(userData.weightKg) : 0.0,
          heightCm: userData.heightCm ? parseFloat(userData.heightCm) : 0.0,
          bloodType: userData.bloodType,
          rhesus: userData.rhesus,
          address: userData.address,
          noRt: userData.noRt ? parseInt(userData.noRt) : 0,
          noRw: userData.noRw ? parseInt(userData.noRw) : 0,
          village: userData.village,
          district: userData.district,
          city: userData.city,
          province: userData.province,
        },
      });

      // Jika berhasil, kirimkan ID user baru sebagai response ke mobile app
      res.status(201).json({ success: true, userId: newUser.id });
    } catch (error) {
      // Jika terjadi error, kirimkan pesan error melalui response ke mobile app
      next(error);
    }
  }
}
