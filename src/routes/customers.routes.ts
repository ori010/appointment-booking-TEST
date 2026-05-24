import { Router } from "express";
import * as controller from "../controllers/customers.controller";
import { validate } from "../middleware/validateRequest";
import { createCustomerSchema } from "../validators/customers.validator";

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", validate(createCustomerSchema), controller.create);

export default router;
