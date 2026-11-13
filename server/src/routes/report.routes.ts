import { Router } from "express";
import { daily, monthly } from "../controllers/report.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/daily", authenticate, daily);
router.get("/monthly", authenticate, monthly);

export default router;
