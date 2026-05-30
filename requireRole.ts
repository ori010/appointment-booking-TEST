import { Request, Response, NextFunction } from "express";
import * as appointmentsService from "../services/appointments.service";
import { CreateAppointmentInput } from "../validators/appointments.validator";
import { UserRole } from "../types/auth";

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
    // Pass the authenticated user's ID so the booking is linked to them
    const appointment = await appointmentsService.createAppointment(
      req.body,
      req.user?.id
    );
    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    // requireAuth guarantees req.user exists on this route
    const requester = { id: req.user!.id, role: req.user!.role as UserRole };
    const appointment = await appointmentsService.cancelAppointment(
      req.params.id,
      requester
    );
    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
}
