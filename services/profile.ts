import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import prisma from "../prisma/prismaClient";

export default class UserService {
  /**
   * Get user profile
   */
  static async get(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id; // Route is protected, thus it's ensured the value won't be null

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
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
        },
      });

      if (!user) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  static async update(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id; // Route is protected, thus it's ensured the value won't be null

      // If there is a password in request body, warn the user
      if (req.body.password) {
        res.status(400).json({
          success: false,
          error: "Password updates are not allowed in this operation.",
        });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          nik: req.body.nik,
          name: req.body.name,
          profilePicture: req.body.profilePicture,
          birthPlace: req.body.birthPlace,
          birthDate: req.body.birthDate,
          gender: req.body.gender,
          job: req.body.job,
          weightKg: req.body.weightKg,
          heightCm: req.body.heightCm,
          bloodType: req.body.bloodType,
          rhesus: req.body.rhesus,
          address: req.body.address,
          noRt: req.body.noRt,
          noRw: req.body.noRw,
          village: req.body.village,
          district: req.body.district,
          city: req.body.city,
          province: req.body.province,
          updatedAt: new Date(),
        },
      });

      res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Edit user password
   */
  static async editPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id; // Route is protected, thus it's ensured the value won't be null
      const { oldPassword, newPassword, confirmNewPassword } = req.body;

      // Ensure old and new passwords are different
      if (oldPassword === newPassword) {
        res.status(400).json({
          success: false,
          error: "New password must be different from the old password",
        });
        return;
      }

      // Check for password
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found. Please logout and login again.",
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

      // If password is invalid
      if (!isPasswordValid) {
        res
          .status(401)
          .json({ success: false, error: "Password is incorrect" });
        return;
      }

      // Validate password confirmation
      if (newPassword !== confirmNewPassword) {
        res.status(400).json({
          success: false,
          error: "New password and confirmation do not match",
        });
        return;
      }

      // Ensure new password length is at least 8 characters
      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          error: "New password must be at least 8 characters long",
        });
        return;
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the password in the database
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      res.status(200).json({ success: true, message: "Password updated" });
    } catch (error) {
      next(error);
    }
  }
}
