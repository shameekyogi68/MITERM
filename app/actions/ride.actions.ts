"use server";

import { prisma } from "@/lib/prisma";
import { calculateShares } from "@/lib/calculations";
import { revalidatePath } from "next/cache";
import {
  createRideSchema,
  type CreateRideInput,
} from "@/lib/validations";

// ── CREATE RIDE ──────────────────────────────────────────────────────────────
export async function createRide(
  raw: CreateRideInput & { forceDuplicate?: boolean },
): Promise<{ success: boolean; rideId?: string; error?: string }> {
  try {
    const parsed = createRideSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Invalid input." };
    }

    const data = parsed.data;

    // Check for duplicate ride on same date
    const startOfDay = new Date(data.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data.date);
    endOfDay.setHours(23, 59, 59, 999);

    if (!raw.forceDuplicate) {
      const existing = await prisma.ride.findFirst({
        where: { date: { gte: startOfDay, lte: endOfDay } },
      });
      if (existing) {
        return { success: false, error: `DUPLICATE:${existing.id}` };
      }
    }

    const calc = calculateShares({
      attendees: data.attendees,
      petrolPrice: data.petrolPrice,
      additionalExpenses: data.additionalExpenses.map((e) => ({
        type: e.type,
        amount: e.amount,
      })),
    });

    const members = await prisma.member.findMany({
      where: { name: { in: data.attendees } },
    });
    const memberMap = Object.fromEntries(
      members.map((m) => [m.name, m.id]),
    );

    // Verify all members exist
    for (const name of data.attendees) {
      if (!memberMap[name]) {
        return { success: false, error: `Member "${name}" not found in database.` };
      }
    }

    const ride = await prisma.$transaction(async (tx) => {
      const newRide = await tx.ride.create({
        data: {
          date: data.date,
          petrolPrice: data.petrolPrice,
          fuelCost: calc.fuelCost,
          totalCost: calc.totalCost,
          notes: data.notes,
          status: "ACTIVE",
        },
      });

      await tx.rideAttendee.createMany({
        data: data.attendees.map((name) => ({
          rideId: newRide.id,
          memberId: memberMap[name],
          weight: calc.weights[name],
          share: calc.finalShares[name],
          status: "PENDING" as const,
        })),
      });

      const validExpenses = data.additionalExpenses.filter((e) => e.amount > 0);
      if (validExpenses.length > 0) {
        await tx.expense.createMany({
          data: validExpenses.map((exp) => ({
            rideId: newRide.id,
            type: exp.type,
            amount: exp.amount,
            description: exp.description,
          })),
        });
      }

      return newRide;
    });

    revalidatePath("/");
    return { success: true, rideId: ride.id };
  } catch (error) {
    console.error("createRide error:", error);
    return {
      success: false,
      error: "Failed to create ride. Please try again.",
    };
  }
}

// ── GET RIDES (paginated) ────────────────────────────────────────────────────
export async function getRides(
  options: {
    page?: number;
    limit?: number;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
  } = {},
) {
  const { page = 1, limit = 10, status, fromDate, toDate } = options;
  const where: Record<string, unknown> = {};

  if (status) {
    const validStatus = ["ACTIVE", "COMPLETED", "CANCELLED"];
    if (validStatus.includes(status)) {
      where.status = status;
    }
  }
  if (fromDate || toDate) {
    where.date = {};
    if (fromDate) (where.date as Record<string, Date>).gte = fromDate;
    if (toDate) (where.date as Record<string, Date>).lte = toDate;
  }

  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  const [rides, total] = await Promise.all([
    prisma.ride.findMany({
      where,
      include: {
        attendees: {
          include: { member: true },
          orderBy: { member: { name: "asc" } },
        },
        expenses: true,
      },
      orderBy: { date: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
    prisma.ride.count({ where }),
  ]);

  return { rides, total, page: safePage, limit: safeLimit };
}

// ── GET SINGLE RIDE ──────────────────────────────────────────────────────────
export async function getRide(rideId: string) {
  if (!rideId || typeof rideId !== "string") return null;

  return prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      attendees: {
        include: { member: true },
        orderBy: { member: { name: "asc" } },
      },
      expenses: true,
    },
  });
}

// ── UPDATE RIDE STATUS ───────────────────────────────────────────────────────
export async function updateRideStatus(rideId: string) {
  if (!rideId || typeof rideId !== "string") return;

  const attendees = await prisma.rideAttendee.findMany({
    where: { rideId },
  });

  const allPaid = attendees.every((a) => a.status === "PAID");
  const newStatus = allPaid ? "COMPLETED" : "ACTIVE";

  await prisma.ride.update({
    where: { id: rideId },
    data: { status: newStatus },
  });
}

// ── DELETE RIDE ──────────────────────────────────────────────────────────────
export async function deleteRide(
  rideId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!rideId || typeof rideId !== "string") {
    return { success: false, error: "Invalid ride ID." };
  }

  const paidCount = await prisma.rideAttendee.count({
    where: { rideId, status: { in: ["PAID", "VERIFICATION"] } },
  });

  if (paidCount > 0) {
    return {
      success: false,
      error: "Cannot delete ride with existing payments. Revert payments first.",
    };
  }

  await prisma.ride.delete({ where: { id: rideId } });
  revalidatePath("/");
  return { success: true };
}

// ── DUPLICATE RIDE ───────────────────────────────────────────────────────────
export async function duplicateRide(
  rideId: string,
  newDate: Date,
): Promise<{ success: boolean; rideId?: string; error?: string }> {
  if (!rideId || typeof rideId !== "string") {
    return { success: false, error: "Invalid ride ID." };
  }

  const original = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      attendees: { include: { member: true } },
      expenses: true,
    },
  });

  if (!original) return { success: false, error: "Ride not found." };

  const attendeeNames = original.attendees.map((a) => a.member.name);
  const expenses = original.expenses.map((e) => ({
    type: e.type as "TOLL" | "PARKING" | "MAINTENANCE" | "FASTAG" | "OTHER",
    amount: e.amount,
    description: e.description ?? undefined,
  } as const));

  return createRide({
    date: newDate,
    petrolPrice: original.petrolPrice,
    attendees: attendeeNames,
    additionalExpenses: expenses,
    notes: original.notes ?? undefined,
    forceDuplicate: true,
  });
}
