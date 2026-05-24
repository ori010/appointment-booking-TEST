import { Router } from "express";
import * as controller from "../controllers/services.controller";
import { validate } from "../middleware/validateRequest";
import { createServiceSchema } from "../validators/services.validator";

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", validate(createServiceSchema), controller.create);

export default router;
