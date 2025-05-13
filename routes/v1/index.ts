import express from "express";
import AppointmentController from "../../controllers/appointment";
import AuthController from "../../controllers/auth";
import HealthcheckController from "../../controllers/healthcheck";
import LocationController from "../../controllers/location";
import ProfileController from "../../controllers/profile";
import ReadinessController from "../../controllers/readiness";
import protectedRoute from "../../middlewares/protectedRoute";

const router = express.Router();

router.use("/", ReadinessController);
router.use("/health-check", HealthcheckController);
router.use("/auth", AuthController);
router.use("/profile", protectedRoute, ProfileController);
router.use("/locations", protectedRoute, LocationController);
router.use("/appointments", protectedRoute, AppointmentController);

export default router;
