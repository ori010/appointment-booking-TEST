import prisma from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { CreateCustomerInput } from "../validators/customers.validator";

export async function getAllCustomers() {
  return prisma.customer.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new AppError("Customer not found", 404);
  return customer;
}

export async function createCustomer(data: CreateCustomerInput) {
  const existing = await prisma.customer.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
  });

  if (existing) {
    throw new AppError("A customer with this email or phone already exists", 409);
  }

  return prisma.customer.create({ data });
}
