import { Request, Response, NextFunction } from "express";
import * as availabilityService from "../services/availability.service";
import { AvailabilityQuery } from "../validators/availability.validator";

export async function getSlots(
  req: Request<object, object, object, AvailabilityQuery>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await availabilityService.getAvailableSlots(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
