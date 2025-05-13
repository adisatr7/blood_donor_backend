import type { NextFunction, Request, Response } from "express";
import type { Location } from "../prisma/client";
import prisma from "../prisma/prismaClient";

export default class AppointmentService {
  /**
   * Create a new location
   */
  static async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { name, latitude, longitude, startTime, endTime }: Location =
        req.body;

      // Validate time format
      const startTimeDate = new Date(startTime);
      const endTimeDate = new Date(endTime);
      if (isNaN(startTimeDate.getTime()) || isNaN(endTimeDate.getTime())) {
        res.status(400).json({
          success: false,
          error: "Invalid time format. Please use ISO 8601 format.",
        });
        return;
      }

      // Validate that start time is before end time
      if (startTimeDate >= endTimeDate) {
        res.status(400).json({
          success: false,
          error: "Start time must be before end time.",
        });
        return;
      }

      // Validate that the start time is in the future
      const now = new Date();
      if (startTimeDate <= now) {
        res.status(400).json({
          success: false,
          error: "Start time must be in the future.",
        });
        return;
      }

      // Create the location
      const newLocation = await prisma.location.create({
        data: {
          name,
          latitude,
          longitude,
          startTime,
          endTime,
        },
      });

      res.status(201).json({
        success: true,
        data: newLocation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all locations
   */
  static async getAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const locations = await prisma.location.findMany({
        where: { deletedAt: null },
      });

      res.status(200).json({
        success: true,
        data: locations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a location by ID
   */
  static async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const locationId = parseInt(req.params.id);

      // Get the location by ID
      const location = await prisma.location.findUnique({
        where: { id: locationId },
      });

      // Check if the location exists
      if (!location) {
        res.status(404).json({ success: false, error: "Location not found" });
        return;
      }

      // Ensure the location is not deleted
      if (location.deletedAt) {
        res.status(410).json({
          success: false,
          error: "Location has been deleted",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: location,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a location
   */
  static async update(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const locationId = parseInt(req.params.id);

      const updatedLocation = await prisma.location.update({
        where: { id: locationId },
        data: {
          name: req.body.name,
          latitude: req.body.latitude,
          longitude: req.body.longitude,
          startTime: req.body.startTime,
          endTime: req.body.endTime,
          updatedAt: new Date(),
        },
      });

      res.status(200).json({
        success: true,
        data: updatedLocation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a location
   */
  static async delete(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const locationId = parseInt(req.params.id);

      await prisma.location.update({
        where: { id: locationId },
        data: { deletedAt: new Date() },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
