import { Router } from "express";
import * as controller from "../controllers/services.controller";
import { validate } from "../middleware/validateRequest";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { createServiceSchema } from "../validators/services.validator";

const router = Router();

// Public: read services
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

// ADMIN only: create a service
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validate(createServiceSchema),
  controller.create
);

export default router;
