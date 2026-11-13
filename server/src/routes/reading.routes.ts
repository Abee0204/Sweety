import { Router } from "express";
import { create } from "../controllers/reading.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticate, create);

export default router;
