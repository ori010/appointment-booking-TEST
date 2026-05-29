import { PrismaClient } from "@prisma/client";

const AppointmentStatus = {
  scheduled: "scheduled",
  cancelled: "cancelled",
  completed: "completed",
} as const;

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.customer.deleteMany();

  // Create customers
  const alice = await prisma.customer.create({
    data: {
      name: "Alice Johnson",
      phone: "+1-555-0101",
      email: "alice@example.com",
    },
  });

  const bob = await prisma.customer.create({
    data: {
      name: "Bob Smith",
      phone: "+1-555-0102",
      email: "bob@example.com",
    },
  });

  // Create services
  const haircut = await prisma.service.create({
    data: {
      name: "Haircut",
      durationMinutes: 30,
      price: 25.0,
      isActive: true,
    },
  });

  const coloring = await prisma.service.create({
    data: {
      name: "Hair Coloring",
      durationMinutes: 90,
      price: 80.0,
      isActive: true,
    },
  });

  await prisma.service.create({
    data: {
      name: "Beard Trim",
      durationMinutes: 20,
      price: 15.0,
      isActive: true,
    },
  });

  // Create appointments for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const appointment1Start = new Date(tomorrow);
  const appointment1End = new Date(tomorrow);
  appointment1End.setMinutes(appointment1End.getMinutes() + haircut.durationMinutes);

  await prisma.appointment.create({
    data: {
      customerId: alice.id,
      serviceId: haircut.id,
      startTime: appointment1Start,
      endTime: appointment1End,
      status: AppointmentStatus.scheduled,
    },
  });

  const appointment2Start = new Date(tomorrow);
  appointment2Start.setHours(11, 0, 0, 0);
  const appointment2End = new Date(appointment2Start);
  appointment2End.setMinutes(appointment2End.getMinutes() + coloring.durationMinutes);

  await prisma.appointment.create({
    data: {
      customerId: bob.id,
      serviceId: coloring.id,
      startTime: appointment2Start,
      endTime: appointment2End,
      status: AppointmentStatus.scheduled,
    },
  });

  console.log("✅ Seed complete!");
  console.log(`   Customers: Alice Johnson, Bob Smith`);
  console.log(`   Services:  Haircut (30min), Hair Coloring (90min), Beard Trim (20min)`);
  console.log(`   Appointments: 2 scheduled for tomorrow`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
