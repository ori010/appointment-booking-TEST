import { Request, Response, NextFunction } from "express";
import * as customersService from "../services/customers.service";
import { CreateCustomerInput } from "../validators/customers.validator";

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const customers = await customersService.getAllCustomers();
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await customersService.getCustomerById(req.params.id);
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: Request<object, object, CreateCustomerInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const customer = await customersService.createCustomer(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
}
