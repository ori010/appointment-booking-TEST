import { Router } from "express";
import * as controller from "../controllers/appointments.controller";
import { validate } from "../middleware/validateRequest";
import { createAppointmentSchema } from "../validators/appointments.validator";

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", validate(createAppointmentSchema), controller.create);
router.patch("/:id/cancel", controller.cancel);

export default router;
