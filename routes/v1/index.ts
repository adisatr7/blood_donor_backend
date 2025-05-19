import express from "express";
import AppointmentController from "../../controllers/appointmentController";
import AuthController from "../../controllers/authController";
import HealthController from "../../controllers/healthController";
import LocationController from "../../controllers/locationController";
import ProfileController from "../../controllers/profileController";
import ReadinessController from "../../controllers/readinessController";
import protectedRoute from "../../middlewares/protectedRoute";

const router = express.Router();

router.use("/", ReadinessController);
router.use("/health-check", HealthController);
router.use("/auth", AuthController);
router.use("/profile", protectedRoute, ProfileController);
router.use("/locations", protectedRoute, LocationController);
router.use("/appointments", protectedRoute, AppointmentController);

export default router;
