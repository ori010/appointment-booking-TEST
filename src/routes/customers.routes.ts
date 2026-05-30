import { Router } from "express";
import * as controller from "../controllers/customers.controller";
import { validate } from "../middleware/validateRequest";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { createCustomerSchema } from "../validators/customers.validator";

const router = Router();

// ADMIN + STAFF: manage customers
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), controller.getAll);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), controller.getById);
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STAFF"),
  validate(createCustomerSchema),
  controller.create
);

export default router;
