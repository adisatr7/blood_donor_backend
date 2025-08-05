import express from "express";
import validateRequestBody from "../../middlewares/validateRequestBody";
import BloodStorageService from "../../services/admin/bloodStorageService";

const router = express.Router();

const requiredParams = ["type", "rhesus", "quantity"];

router.post("/", validateRequestBody(requiredParams), BloodStorageService.set);
router.get("/", BloodStorageService.get);

export default router;