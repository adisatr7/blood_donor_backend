import express from "express";
import ReadinessService from "../services/readiness";

const router = express.Router();

router.get("/", ReadinessService.isReady);

export default router;
