import express from "express";
import validateRequestBody from "../middlewares/validateRequestBody";
import LocationService from "../services/location";

const router = express.Router();

// Required fields for creating a location
const createParams = ["name", "latitude", "longitude", "startTime", "endTime"];

router.get("/:id", LocationService.getById);
router.patch("/:id", validateRequestBody(), LocationService.update);
router.delete("/:id", LocationService.delete);

router.post("/", validateRequestBody(createParams), LocationService.create);
router.get("/", LocationService.getAll);

export default router;
