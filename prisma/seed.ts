import bcrypt from "bcryptjs";

// Access Prisma via any since User model requires regenerated client
// Run `npm run db:generate` after `npm run db:migrate` before seeding.
import prisma from "../src/db/prisma";
const db = prisma as any;

const BCRYPT_ROUNDS = 10;

async function main() {
  console.log("🌱 Seeding database...");

  // Clear all data (order matters for foreign keys)
  await db.appointment.deleteMany();
  await db.customer.deleteMany();
  await db.service.deleteMany();
  await db.user.deleteMany();

  // ─── Users (auth) ──────────────────────────────────────────────────────
  // Demo passwords are intentionally simple and documented here only.
  // Never use these in production.

  const [adminUser, staffUser, customerUser] = await Promise.all([
    db.user.create({
      data: {
        name: "Admin User",
        email: "admin@example.com",
        passwordHash: await bcrypt.hash("admin1234", BCRYPT_ROUNDS),
        role: "ADMIN",
      },
    }),
    db.user.create({
      data: {
        name: "Staff User",
        email: "staff@example.com",
        passwordHash: await bcrypt.hash("staff1234", BCRYPT_ROUNDS),
        role: "STAFF",
      },
    }),
    db.user.create({
      data: {
        name: "Alice Johnson",
        email: "alice@example.com",
        passwordHash: await bcrypt.hash("alice1234", BCRYPT_ROUNDS),
        role: "CUSTOMER",
      },
    }),
  ]);

  // ─── Customers (booking profiles) ──────────────────────────────────────
  const [alice, bob] = await Promise.all([
    db.customer.create({
      data: {
        name: "Alice Johnson",
        phone: "+1-555-0101",
        email: "alice@example.com",
      },
    }),
    db.customer.create({
      data: {
        name: "Bob Smith",
        phone: "+1-555-0102",
        email: "bob@example.com",
      },
    }),
  ]);

  // ─── Services ──────────────────────────────────────────────────────────
  const [haircut, coloring, beardTrim] = await Promise.all([
    db.service.create({
      data: { name: "Haircut", durationMinutes: 30, price: 25.0, isActive: true },
    }),
    db.service.create({
      data: { name: "Hair Coloring", durationMinutes: 90, price: 80.0, isActive: true },
    }),
    db.service.create({
      data: { name: "Beard Trim", durationMinutes: 20, price: 15.0, isActive: true },
    }),
  ]);

  // ─── Appointments (tomorrow) ────────────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(9, 0, 0, 0);

  const appt1Start = new Date(tomorrow);
  const appt1End = new Date(appt1Start.getTime() + haircut.durationMinutes * 60_000);

  const appt2Start = new Date(tomorrow);
  appt2Start.setUTCHours(11, 0, 0, 0);
  const appt2End = new Date(appt2Start.getTime() + coloring.durationMinutes * 60_000);

  await Promise.all([
    db.appointment.create({
      data: {
        customerId: alice.id,
        serviceId: haircut.id,
        bookedById: customerUser.id,
        startTime: appt1Start,
        endTime: appt1End,
        status: "scheduled",
      },
    }),
    db.appointment.create({
      data: {
        customerId: bob.id,
        serviceId: coloring.id,
        bookedById: null, // seeded directly — no linked user account
        startTime: appt2Start,
        endTime: appt2End,
        status: "scheduled",
      },
    }),
  ]);

  console.log("✅ Seed complete!");
  console.log("");
  console.log("Demo accounts (for testing only — do not use in production):");
  console.log("  ADMIN    admin@example.com   / admin1234");
  console.log("  STAFF    staff@example.com   / staff1234");
  console.log("  CUSTOMER alice@example.com   / alice1234");
  console.log("");
  console.log("Seeded: 3 users, 2 customers, 3 services, 2 appointments");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
