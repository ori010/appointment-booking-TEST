import { Request, Response, NextFunction } from "express";
import * as servicesService from "../services/services.service";
import { CreateServiceInput } from "../validators/services.validator";

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const services = await servicesService.getAllServices();
    res.json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const service = await servicesService.getServiceById(req.params.id);
    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: Request<object, object, CreateServiceInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const service = await servicesService.createService(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
}
