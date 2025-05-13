import express from "express";
import HealthCheckService from "../services/healthcheck";

const router = express.Router();

router.get("/", HealthCheckService.isHealthy);

export default router;
