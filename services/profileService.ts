import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import type { BloodType, Gender, Rhesus } from "../prisma/client";
import prisma from "../prisma/prismaClient";
import UserValidation from "../utils/userValidation";

export default class ProfileService {
  /**
   * Filter user untuk digunakan di klausa `SELECT` untuk mengambil
   * semua data user kecuali password. Ini digunakan agar kita tidak
   * perlu menulis ulang apa saja yang ingin di-`SELECT` setiap kali
   * mengambil data user.
   */
  static SELECT_ALL_EXCLUDING_PASSWORD = {
    id: true,
    nik: true,
    name: true,
    profilePicture: true,
    birthPlace: true,
    birthDate: true,
    gender: true,
    job: true,
    phoneNumber: true,
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
  };

  /**
   * Ambil data user yang sedang login
   */
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil ID user yang sedang login
      const userId = req.user!.id;

      // Ambil data user dari database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: ProfileService.SELECT_ALL_EXCLUDING_PASSWORD,
      });

      // Jika tidak ada user dengan ID tersebut, kirimkan pesan error
      if (!user) {
        res.status(404).json({
          success: false,
          error: "ID user tidak ditemukan, harap login kembali",
        });
        return;
      }

      // Jika tidak ada masalah, kirimkan data user sebagai response ke aplikasi mobile
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  /**
   * Update user profile
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil ID user yang sedang login
      const userId = req.user!.id;

      // Cegah jangan sampai ada password di request body
      if (req.body.password) {
        // Jika ada password di request body, kirimkan pesan error
        res.status(400).json({
          success: false,
          error: "Anda tidak dapat mengubah password melalui endpoint ini",
        });
        return;
      }

      // Validasi data enum
      let gender: Gender | null = null;
      let bloodType: BloodType | null = null;
      let rhesus: Rhesus | null = null;
      try {
        gender = UserValidation.validateGender(req.body.gender);
        bloodType = UserValidation.validateBloodType(req.body.bloodType);
        rhesus = UserValidation.validateRhesus(req.body.rhesus);
      } catch (error) {
        // Jika validasi gagal, kirim pesan error melalui response ke mobile app
        res.status(400).json({
          success: false,
          error: "Format data tidak valid. Hubungi pihak developer untuk bantuan",
        });
        return;
      }

      // Ubah data user di database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          nik: req.body.nik,
          name: req.body.name,
          birthPlace: req.body.birthPlace,
          birthDate: req.body.birthDate,
          gender: gender,
          job: req.body.job,
          phoneNumber: req.body.phoneNumber,
          weightKg: req.body.weightKg,
          heightCm: req.body.heightCm,
          bloodType: bloodType,
          rhesus: rhesus,
          address: req.body.address,
          noRt: req.body.noRt,
          noRw: req.body.noRw,
          village: req.body.village,
          district: req.body.district,
          city: req.body.city,
          province: req.body.province,
        },
        select: ProfileService.SELECT_ALL_EXCLUDING_PASSWORD,
      });

      // Jika berhasil, kirimkan data user yang sudah di-update sebagai response
      res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  static async updateProfilePicture(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Ambil ID user yang sedang login
      const userId = req.user!.id;

      // Jika ada file foto profil yang diupload, simpan di folder `public/uploads`
      let profilePictureUrl: string | null = null;
      if (req.file) {
        // Simpan URL foto profil yang diupload
        profilePictureUrl = `/public/uploads/photos/${req.file.filename}`;
      }

      // Update foto profil di database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profilePicture: profilePictureUrl },
        select: ProfileService.SELECT_ALL_EXCLUDING_PASSWORD,
      });

      // Jika berhasil, kirimkan data user yang sudah di-update sebagai response
      res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  /**
   * Edit user password
   */
  static async editPassword(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil ID user yang sedang login
      const userId = req.user!.id;

      // Ambil password lama dan baru dari request body
      const { oldPassword, newPassword, confirmNewPassword } = req.body;

      // Pastikan password lama dan baru tidak sama
      if (oldPassword === newPassword) {
        res.status(400).json({
          success: false,
          error: "Kata sandi lama dan baru tidak boleh sama",
        });
        return;
      }

      // Ambil data user dari database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      // Jika tidak ada user dengan ID tersebut, kirimkan pesan error
      if (!user) {
        res.status(404).json({
          success: false,
          error: "User tidak ditemukan, harap login kembali",
        });
        return;
      }

      // Cek apakah password lama sesuai dengan yang ada di database
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

      // Jika password lama tidak sesuai, kirimkan pesan error
      if (!isPasswordValid) {
        res
          .status(401)
          .json({ success: false, error: "Kata sandi lama salah" });
        return;
      }

      // Pastikan password baru dan konfirmasi password baru sama
      // Dapat diabaikan karena sudah ada validasi di Frontend
      if (newPassword !== confirmNewPassword) {
        // Jika password baru dan konfirmasi tidak sama, kirimkan pesan error
        res.status(400).json({
          success: false,
          error: "Kata sandi baru dan konfirmasi harus sama",
        });
        return;
      }

      // Pastikan password baru memiliki panjang minimal 8 karakter
      // Juga ada validasi di Frontend
      if (newPassword.length < 8) {
        // Jika password baru kurang dari 8 karakter, kirimkan pesan error
        res.status(400).json({
          success: false,
          error: "Kata sandi baru harus memiliki minimal 8 karakter",
        });
        return;
      }

      // Enkripsi password baru menggunakan agar tidak mudah dibaca dan lebih aman
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Simpan password baru yang sudah dienkripsi ke database
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Jika berhasil, kirimkan pesan sukses
      res
        .status(200)
        .json({ success: true, message: "Kata sandi berhasil diubah" });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }
}
