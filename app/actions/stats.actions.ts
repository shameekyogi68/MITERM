"use server";

import { prisma } from "@/lib/prisma";
import { isOverdue } from "@/lib/utils";
import { getTodayPetrolPrice } from "./settings.actions";

export async function getDashboardStats() {
  const [allAttendees, petrolPriceData, mileageSetting, routeDistanceSetting] = await Promise.all([
    prisma.rideAttendee.findMany({
      include: { member: true, ride: true },
    }),
    getTodayPetrolPrice(),
    prisma.setting.findUnique({ where: { key: "mileage" } }),
    prisma.setting.findUnique({ where: { key: "routeDistance" } }),
  ]);

  const mileage = mileageSetting?.value && typeof mileageSetting.value === "number" ? mileageSetting.value : 16;
  const routeDistance = routeDistanceSetting?.value && typeof routeDistanceSetting.value === "number" ? routeDistanceSetting.value : 252;

  const pending = allAttendees.filter(
    (a: any) => a.status === "PENDING" || a.status === "VERIFICATION",
  );
  const overdue = pending.filter((a: any) => isOverdue(a.createdAt));
  const paid = allAttendees.filter((a: any) => a.status === "PAID");

  const totalPending = pending.reduce((s: number, a: any) => s + a.share, 0);
  const totalCollected = paid.reduce((s: number, a: any) => s + a.share, 0);
  const totalFuelCost = allAttendees.reduce(
    (s: number, a: any) => (a.status === "PAID" ? s + a.ride.fuelCost / a.ride.attendees.length : s),
    0,
  );

  const overdueByMember: Record<string, number> = {};
  for (const a of overdue) {
    overdueByMember[a.member.name] = (overdueByMember[a.member.name] ?? 0) + 1;
  }
  const defaulterEntry = Object.entries(overdueByMember).sort((a, b) => b[1] - a[1])[0];
  const mostFrequentDefaulter = defaulterEntry
    ? { name: defaulterEntry[0], count: defaulterEntry[1] }
    : null;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const recentRides = await prisma.ride.findMany({
    where: { date: { gte: sixMonthsAgo } },
    orderBy: { date: "asc" },
  });

  const currentPrice = petrolPriceData.price;
  const todayFuelCost = (routeDistance / mileage) * currentPrice;
  const totalRides = await prisma.ride.count();

  const memberAttendance: Record<string, { attended: number; totalSpent: number }> = {};
  for (const a of allAttendees) {
    if (!memberAttendance[a.member.name]) {
      memberAttendance[a.member.name] = { attended: 0, totalSpent: 0 };
    }
    memberAttendance[a.member.name].attended++;
    if (a.status === "PAID") {
      memberAttendance[a.member.name].totalSpent += a.share;
    }
  }

  return {
    totalPending,
    totalCollected,
    totalFuelCost,
    totalRides,
    pendingCount: pending.length,
    paidCount: paid.length,
    overdueCount: overdue.length,
    monthlyFuelSpend: recentRides.map((r: any) => ({
      month: r.date.toISOString().slice(0, 7),
      amount: r.fuelCost,
    })),
    averageCostPerRide: recentRides.length
      ? recentRides.reduce((s: number, r: any) => s + r.totalCost, 0) / recentRides.length
      : 0,
    averageCostPerPerson: paid.length ? totalCollected / paid.length : 0,
    mostFrequentDefaulter,
    todayPetrolPrice: currentPrice,
    todayFuelCost,
    memberAttendance,
    mileage,
    routeDistance,
  };
}

export async function getPendingPayments() {
  const attendees = await prisma.rideAttendee.findMany({
    where: { status: { in: ["PENDING", "OVERDUE", "VERIFICATION"] } },
    include: { member: true, ride: true },
    orderBy: { ride: { date: "desc" } },
  });

  for (const a of attendees) {
    if (a.status === "PENDING" && isOverdue(a.createdAt)) {
      await prisma.rideAttendee.update({
        where: { id: a.id },
        data: { status: "OVERDUE" },
      });
      a.status = "OVERDUE";
    }
  }

  return attendees;
}

export async function getPaymentHistory(options: {
  fromDate?: Date;
  toDate?: Date;
  memberName?: string;
} = {}) {
  const where: Record<string, unknown> = { status: "PAID" };
  if (options.memberName) {
    const member = await prisma.member.findUnique({
      where: { name: options.memberName },
    });
    if (member) where.memberId = member.id;
  }
  if (options.fromDate || options.toDate) {
    where.paidAt = {};
    if (options.fromDate) (where.paidAt as Record<string, Date>).gte = options.fromDate;
    if (options.toDate) (where.paidAt as Record<string, Date>).lte = options.toDate;
  }

  return prisma.rideAttendee.findMany({
    where,
    include: { member: true, ride: true },
    orderBy: { paidAt: "desc" },
  });
}
