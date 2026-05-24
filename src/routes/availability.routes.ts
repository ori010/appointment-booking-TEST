import { Router } from "express";
import * as controller from "../controllers/availability.controller";
import { validate } from "../middleware/validateRequest";
import { availabilityQuerySchema } from "../validators/availability.validator";

const router = Router();

router.get("/", validate(availabilityQuerySchema, "query"), controller.getSlots);

export default router;
