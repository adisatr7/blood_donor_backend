import type { NextFunction, Request, Response } from "express";
import type { Appointment } from "../prisma/client";
import prisma from "../prisma/prismaClient";

export default class AppointmentService {
  /**
   * Create a new appointment
   */
  static async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { locationId, status = "SCHEDULED", time }: Appointment = req.body;
      const userId = req.user!.id; // Route is protected, thus it's ensured the value won't be null

      // Check if the appointment time is in the past
      const currentTime = new Date();
      if (new Date(time) < currentTime) {
        res.status(400).json({
          success: false,
          message: "Appointment time cannot be in the past",
        });
        return;
      }

      const newAppointment = await prisma.appointment.create({
        data: {
          locationId,
          userId,
          status,
          time,
        },
      });

      res.status(201).json(newAppointment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all appointments for a user
   */
  static async getAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id; // Route is protected, thus it's ensured the value won't be null

      const appointments = await prisma.appointment.findMany({
        where: { userId },
        orderBy: { time: "desc" },
      });

      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific appointment by ID
   */
  static async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id; // Route is protected, thus it's ensured the value won't be null
      const appointmentId = parseInt(req.params.id);

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId, userId },
        include: {
          Questionnaire: true,
          Location: true,
        },
      });

      if (!appointment) {
        res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an appointment
   */
  static async update(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id; // Route is protected, thus it's ensured the value won't be null
      const appointmentId = parseInt(req.params.id);

      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId, userId },
        data: {
          status: req.body.status,
          time: req.body.time,
        },
      });

      res.status(200).json({
        success: true,
        data: updatedAppointment,
      });
    } catch (error) {
      next(error);
    }
  }
}
