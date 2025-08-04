import express from "express";
import adminOnly from "../../middlewares/adminOnly";
import AppointmentController from "../appointmentController";
import LocationController from "../locationController";
import UserController from "./userController";
import AdminService from "../../services/admin/adminService"

const router = express.Router();

router.post("/create-admin", AdminService.createAdmin); // Buat admin baru

router.use("/users", UserController);
router.use("/locations", adminOnly, LocationController);
router.use("/appointments", adminOnly, AppointmentController);

export default router;
