import express from "express";
import validateRequestBody from "../middlewares/validateRequestBody";
import AppointmentService from "../services/appointment";

// Required fields for creating an appointment
const createParams = ["id", "locationId", "time"];

const router = express.Router();

router.get("/:id", AppointmentService.getById);
router.patch("/:id", validateRequestBody(), AppointmentService.update);

router.post("/", validateRequestBody(createParams), AppointmentService.create);
router.get("/", AppointmentService.getAll);

export default router;
