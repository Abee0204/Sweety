import { Router } from "express";
import { create, list } from "../controllers/reading.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticate, create);
router.get("/", authenticate, list);

export default router;
