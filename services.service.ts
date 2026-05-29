import { Request, Response, NextFunction } from "express";
import * as appointmentsService from "../services/appointments.service";
import { CreateAppointmentInput } from "../validators/appointments.validator";

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const appointments = await appointmentsService.getAllAppointments();
    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const appointment = await appointmentsService.getAppointmentById(req.params.id);
    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: Request<object, object, CreateAppointmentInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const appointment = await appointmentsService.createAppointment(req.body);
    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const appointment = await appointmentsService.cancelAppointment(req.params.id);
    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}
