import { Router } from "express";
import * as controller from "../controllers/auth.controller";
import { validate } from "../middleware/validateRequest";
import { requireAuth } from "../middleware/requireAuth";
import { registerSchema, loginSchema } from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.get("/me", requireAuth, controller.me);

export default router;
