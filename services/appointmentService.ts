import type { NextFunction, Request, Response } from "express";
import type { Appointment } from "../prisma/client";
import prisma from "../prisma/prismaClient";

export default class AppointmentService {
  /**
   * Create a new appointment
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil data appointment baru dari request body
      const { locationId, status = "SCHEDULED" }: Appointment = req.body;

      // Ambil ID user yang sedang login
      const userId = req.user!.id;

      // Buat appointment baru di database
      const newAppointment = await prisma.appointment.create({
        data: {
          locationId,
          userId,
          status,
        },
      });

      // Kirimkan response dengan status 201 Created (sukses)
      res.status(201).json(newAppointment);
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  /**
   * Get all appointments for a user
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil ID user yang sedang login
      const userId = req.user!.id;

      // Ambil semua appointment milik user yang sedang login
      const appointments = await prisma.appointment.findMany({
        where: { userId },
        orderBy: { Location: { startTime: "desc" } },
      });

      // Jika ada, kirimkan semua appointment sebagai response ke aplikasi mobile
      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  /**
   * Get a specific appointment by ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil ID user yang sedang login dan ID appointment dari parameter URL
      const userId = req.user!.id;
      const appointmentId = parseInt(req.params.id);

      // Ambil appointment berdasarkan ID appointment dan ID user
      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, userId },
        include: {
          Questionnaire: true,
          Location: true,
        },
      });

      // Jika appointment tidak ditemukan, kirimkan response error 404
      if (!appointment) {
        res.status(404).json({
          success: false,
          message: "Anda belum memiliki appointment",
        });
        return;
      }

      // Jika appointment ditemukan, kirimkan appointment sebagai response ke aplikasi mobile
      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  /**
   * Update an appointment
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      // Ambil ID user yang sedang login dan ID appointment dari parameter URL
      const userId = req.user!.id;
      const appointmentId = parseInt(req.params.id);

      // Ubah data appointment sesuai request (hanya bisa ubah status dan/atau waktu)
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId, userId },
        data: { status: req.body.status },
      });

      // Jika berhasil, kirimkan appointment yang sudah di-update sebagai response
      res.status(200).json({
        success: true,
        data: updatedAppointment,
      });
    } catch (error) {
      // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
      next(error);
    }
  }

  // ? Method DELETE *sengaja tidak digunakan* karena appointment tidak seharusnya dapat dihapus
  // static async cancel(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     // Ambil ID user yang sedang login dan ID appointment dari parameter URL
  //     const userId = req.user!.id;
  //     const appointmentId = parseInt(req.params.id);

  //     // Hapus appointment berdasarkan ID appointment dan ID user
  //     await prisma.appointment.update({
  //       where: { id: appointmentId, userId },
  //       data: {
  //         status: "MISSED",
  //       },
  //     });

  //     // Kirimkan response sukses
  //     res.status(200).json({
  //       success: true,
  //       message: "Appointment berhasil dibatalkan",
  //     });
  //   } catch (error) {
  //     // Jika terjadi error, kirimkan response dengan pesan error yang sesuai
  //     next(error);
  //   }
  // }
}
