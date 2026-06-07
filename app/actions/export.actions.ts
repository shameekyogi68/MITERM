"use server";

import { prisma } from "@/lib/prisma";
import { exportFormatSchema } from "@/lib/validations";

// ── EXPORT RIDES ─────────────────────────────────────────────────────────────
export async function exportRides(
  format: "json" | "csv",
): Promise<{ data: string; contentType: string; filename: string }> {
  const parsed = exportFormatSchema.safeParse(format);
  if (!parsed.success) {
    return {
      data: JSON.stringify({ error: "Invalid export format." }),
      contentType: "application/json",
      filename: "error.json",
    };
  }

  const rides = await prisma.ride.findMany({
    include: {
      attendees: { include: { member: true } },
      expenses: true,
    },
    orderBy: { date: "desc" },
  });

  const dateStr = new Date().toISOString().slice(0, 10);

  if (parsed.data === "json") {
    const exportData = rides.map((ride) => ({
      date: ride.date.toISOString().slice(0, 10),
      petrolPrice: ride.petrolPrice,
      fuelCost: ride.fuelCost,
      totalCost: ride.totalCost,
      status: ride.status,
      notes: ride.notes,
      attendees: ride.attendees.map((a) => ({
        name: a.member.name,
        share: a.share,
        weight: a.weight,
        status: a.status,
        paidAt: a.paidAt?.toISOString() ?? null,
      })),
      expenses: ride.expenses.map((e) => ({
        type: e.type,
        amount: e.amount,
        description: e.description,
      })),
    }));

    return {
      data: JSON.stringify(exportData, null, 2),
      contentType: "application/json",
      filename: `mite-rides-${dateStr}.json`,
    };
  }

  // CSV with proper escaping
  const escapeCSV = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    "RideDate",
    "PetrolPrice",
    "FuelCost",
    "TotalCost",
    "Status",
    "Member",
    "Share",
    "Weight",
    "PaymentStatus",
    "PaidAt",
  ];

  const rows: string[] = [headers.join(",")];
  for (const ride of rides) {
    for (const attendee of ride.attendees) {
      rows.push(
        [
          escapeCSV(ride.date.toISOString().slice(0, 10)),
          escapeCSV(ride.petrolPrice),
          escapeCSV(ride.fuelCost),
          escapeCSV(ride.totalCost),
          escapeCSV(ride.status),
          escapeCSV(attendee.member.name),
          escapeCSV(attendee.share),
          escapeCSV(attendee.weight),
          escapeCSV(attendee.status),
          escapeCSV(attendee.paidAt?.toISOString()),
        ].join(","),
      );
    }
  }

  return {
    data: rows.join("\n"),
    contentType: "text/csv",
    filename: `mite-rides-${dateStr}.csv`,
  };
}
