import express from "express";
import adminOnly from "../../middlewares/adminOnly";
import AdminService from "../../services/admin/adminService";
import BloodStorageController from "./bloodStorageController";
import AppointmentController from "../appointmentController";
import LocationController from "../locationController";
import UserController from "./userController";

const router = express.Router();

router.post("/create-admin", AdminService.createAdmin); // Buat admin baru

router.use("/blood-storage", adminOnly, BloodStorageController);
router.use("/users", adminOnly, UserController);
router.use("/locations", adminOnly, LocationController);
router.use("/appointments", adminOnly, AppointmentController);

export default router;
