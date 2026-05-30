import { Router } from "express";
import * as controller from "../controllers/appointments.controller";
import { validate } from "../middleware/validateRequest";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { createAppointmentSchema } from "../validators/appointments.validator";

const router = Router();

// ADMIN + STAFF: view all appointments
router.get("/", requireAuth, requireRole("ADMIN", "STAFF"), controller.getAll);
router.get("/:id", requireAuth, requireRole("ADMIN", "STAFF"), controller.getById);

// CUSTOMER + ADMIN: book an appointment
router.post(
  "/",
  requireAuth,
  requireRole("CUSTOMER", "ADMIN"),
  validate(createAppointmentSchema),
  controller.create
);

// CUSTOMER (own) + ADMIN (any): cancel — ownership enforced inside service
router.patch("/:id/cancel", requireAuth, requireRole("CUSTOMER", "ADMIN"), controller.cancel);

export default router;
