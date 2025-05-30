import type { NextFunction, Request, Response } from "express";
import type { Location } from "../prisma/client";
import prisma from "../prisma/prismaClient";

export default class AppointmentService {
  /**
   * Method untuk membuat lokasi baru (tidak dapat dilakukan melalui mobile app)
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil data lokasi baru dari request body
      const { name, latitude, longitude, startTime, endTime }: Location =
        req.body;

      // Validasi format waktu
      const startTimeDate = new Date(startTime);
      const endTimeDate = new Date(endTime);
      if (isNaN(startTimeDate.getTime()) || isNaN(endTimeDate.getTime())) {
        // Jika format waktu tidak valid, kirimkan pesan error
        res.status(400).json({
          success: false,
          error:
            "Format waktu tidak valid. Gunakan format YYYY-MM-DDTHH:mm:ssZ.",
        });
        return;
      }

      // Pastikan bahwa waktu mulai tidak lebih akhir dari waktu selesai
      // (misalnya, waktu mulai jam 10 pagi dan waktu selesai jam 8 pagi)
      if (startTimeDate >= endTimeDate) {
        // Jika waktu mulai lebih akhir dari waktu selesai, kirimkan pesan error
        res.status(400).json({
          success: false,
          error: "`startTime` harus sebelum `endTime`.",
        });
        return;
      }

      // Pastikan bahwa waktu mulai tidak lebih awal dari waktu sekarang
      const now = new Date();
      if (startTimeDate <= now) {
        // Jika waktu mulai lebih awal dari waktu sekarang, kirimkan pesan error
        res.status(400).json({
          success: false,
          error: "Start time must be in the future.",
        });
        return;
      }

      // Simpan lokasi baru ke database
      const newLocation = await prisma.location.create({
        data: {
          name,
          latitude,
          longitude,
          startTime,
          endTime,
        },
      });

      // Jika berhasil, kirimkan response berisi data lokasi yang baru ditambahkan
      res.status(201).json({
        success: true,
        data: newLocation,
      });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  /**
   * Method untuk mendapatkan semua lokasi
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const locations = await prisma.location.findMany({
        where: {
          deletedAt: null, // Pastikan lokasi tidak dihapus
          endTime: { gte: new Date() }, // Pastikan acara di lokasi tsb belum berakhir
        },
      });

      // Kirimkan semua lokasi sebagai response ke aplikasi mobile
      res.status(200).json({
        success: true,
        data: locations,
      });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  /**
   * Method untuk mendapatkan lokasi detail berdasarkan ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil ID lokasi dari parameter URL
      const locationId = parseInt(req.params.id);

      // Ambil lokasi dari database
      const location = await prisma.location.findUnique({
        where: { id: locationId },
      });

      // Jika tidak ada lokasi dengan ID tersebut, kirimkan pesan error
      if (!location) {
        res.status(404).json({ success: false, error: "Lokasi tidak ditemukan" });
        return;
      }

      // Jika lokasi sudah dihapus, kirimkan pesan error
      if (location.deletedAt) {
        res.status(410).json({
          success: false,
          error: "Lokasi telah dihapus",
        });
        return;
      }

      // Jika acara di lokasi sudah berakhir, kirimkan pesan error
      if (location.endTime < new Date()) {
        res.status(410).json({
          success: false,
          error: "Acara donor darah di lokasi ini sudah berakhir",
        });
        return;
      }

      // Jika tidak ada masalah, kirimkan lokasi sebagai response ke aplikasi mobile
      res.status(200).json({
        success: true,
        data: location,
      });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  /**
   * Perbarui lokasi berdasarkan ID (tidak dapat dilakukan melalui mobile app)
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil ID lokasi dari parameter URL
      const locationId = parseInt(req.params.id);

      // Ubah data lokasi di database
      const updatedLocation = await prisma.location.update({
        where: { id: locationId },
        data: {
          name: req.body.name,
          latitude: req.body.latitude,
          longitude: req.body.longitude,
          startTime: req.body.startTime,
          endTime: req.body.endTime,
        },
      });

      // Jika berhasil, kirimkan lokasi yang sudah di-update sebagai response
      res.status(200).json({
        success: true,
        data: updatedLocation,
      });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  /**
   * Method untuk menghapus lokasi berdasarkan ID (tidak dapat dilakukan melalui mobile app)
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil ID lokasi dari parameter URL
      const locationId = parseInt(req.params.id);

      // Hapus lokasi dari database dengan mengubah deletedAt menjadi waktu sekarang
      // (data masih ada di database, tapi tidak akan dikirim ke mobile app)
      await prisma.location.update({
        where: { id: locationId },
        data: { deletedAt: new Date() },
      });

      // Jika tidak ada masalah, kirimkan response sukses
      res.status(204).send();
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }
}
