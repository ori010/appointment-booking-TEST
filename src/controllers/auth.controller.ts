import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { RegisterInput, LoginInput } from "../validators/auth.validator";

export async function register(
  req: Request<object, object, RegisterInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const { user, token } = await authService.register(req.body);
    res.status(201).json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request<object, object, LoginInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const { user, token } = await authService.login(req.body);
    res.json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    // req.user is guaranteed by requireAuth middleware
    const user = await authService.getMe(req.user!.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}
