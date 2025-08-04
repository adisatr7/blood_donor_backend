import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import type { BloodType, Gender, Rhesus } from "../../prisma/client";
import prisma from "../../prisma/prismaClient";
import UserValidation from "../../utils/userValidation";
import ProfileService from "../profileService";

export default class UserService {
  /**
   * Filter user untuk digunakan di klausa `SELECT` untuk mengambil
   * semua data user dan daftar appointment kecuali password.
   */
  static SELECT_FULL_USER_DATA = {
    ...ProfileService.SELECT_ALL_EXCLUDING_PASSWORD,
    Appointments: {
      select: {
        id: true,
        status: true,
        Location: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            startTime: true,
            endTime: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        pdfUrl: true,
        Questionnaire: {
          select: {
            number: true,
            question: true,
            answer: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    },
  };

  /**
   * Buat user baru
   */
  static async create(req: Request, res: Response, next: NextFunction) {
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
        profilePictureUrl = `/public/uploads/photos/${req.file.filename}`;
      }

      // Validasi data enum
      let gender: Gender | null = null;
      let bloodType: BloodType | null = null;
      let rhesus: Rhesus | null = null;
      try {
        gender = UserValidation.validateGender(userData.gender);
        bloodType = UserValidation.validateBloodType(userData.bloodType);
        rhesus = UserValidation.validateRhesus(userData.rhesus);
      } catch (error) {
        // Jika validasi gagal, kirim pesan error melalui response ke mobile app
        res.status(400).json({
          success: false,
          error:
            "Format data tidak valid. Hubungi pihak developer untuk bantuan",
        });
        return;
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
          gender: gender,
          job: userData.job,
          weightKg: userData.weightKg ? parseFloat(userData.weightKg) : 0.0,
          heightCm: userData.heightCm ? parseFloat(userData.heightCm) : 0.0,
          bloodType: bloodType,
          rhesus: rhesus,
          address: userData.address,
          noRt: userData.noRt ? parseInt(userData.noRt) : 0,
          noRw: userData.noRw ? parseInt(userData.noRw) : 0,
          village: userData.village,
          district: userData.district,
          city: userData.city,
          province: userData.province,
        },
        select: ProfileService.SELECT_ALL_EXCLUDING_PASSWORD,
      });

      res.status(200).json({
        success: true,
        data: newUser,
      });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  /**
   * Ambil semua user
   */
  static async getAll(_: Request, res: Response, next: NextFunction) {
    try {
      const result = await prisma.user.findMany({
        select: UserService.SELECT_FULL_USER_DATA,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ambil user berdasarkan ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.params?.id as string) ?? "ERROR";

      if (userId === "ERROR") {
        res.status(400).json({
          success: false,
          error: "ID user tidak boleh kosong",
        });
        return;
      }

      const result = await prisma.user.findUnique({
        select: UserService.SELECT_FULL_USER_DATA,
        where: {
          id: parseInt(userId),
        },
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user berdasarkan ID
   */
  static async updateById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.params?.id as string) ?? "ERROR";

      if (userId === "ERROR") {
        res.status(400).json({
          success: false,
          error: "ID user tidak boleh kosong",
        });
        return;
      }

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
          error:
            "Format data tidak valid. Hubungi pihak developer untuk bantuan",
        });
        return;
      }

      // Ubah data user di database
      const result = await prisma.user.update({
        where: { id: parseInt(userId) },
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

      // Jika berhasil, kirimkan user yang sudah di-update sebagai response
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload foto profil baru
   */
  static async uploadProfilePicture(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req.params?.id as string) ?? "ERROR";

      if (userId === "ERROR") {
        res.status(400).json({
          success: false,
          error: "ID user tidak boleh kosong",
        });
        return;
      }

      // Jika ada file foto profil yang diupload, simpan di folder `public/uploads`
      let profilePictureUrl: string | null = null;
      if (req.file) {
        // Simpan URL foto profil yang diupload
        profilePictureUrl = `/public/uploads/photos/${req.file.filename}`;
      }

      // Update foto profil di database
      const result = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { profilePicture: profilePictureUrl },
        select: ProfileService.SELECT_ALL_EXCLUDING_PASSWORD,
      });

      // Kirimkan response sukses
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
