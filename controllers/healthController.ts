import express from "express";
import HealthService from "../services/healthService";

const router = express.Router();

router.get("/", HealthService.healthCheck);

export default router;
