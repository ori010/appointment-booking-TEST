import prisma from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { CreateServiceInput } from "../validators/services.validator";

export async function getAllServices() {
  return prisma.service.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getServiceById(id: string) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw new AppError("Service not found", 404);
  return service;
}

export async function createService(data: CreateServiceInput) {
  return prisma.service.create({ data });
}
