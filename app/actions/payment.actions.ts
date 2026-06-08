"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateRideStatus } from "./ride.actions";
import { paymentSchema, type PaymentInput } from "@/lib/validations";

// ── MARK PAYMENT (user) → status = VERIFICATION ──────────────────────────────
export async function markPayment(
  raw: PaymentInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = paymentSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Invalid input." };
    }

    const { rideId, memberName } = parsed.data;

    const member = await prisma.member.findUnique({
      where: { name: memberName },
    });
    if (!member) return { success: false, error: `Member "${memberName}" not found.` };

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) return { success: false, error: "Ride not found." };

    const attendee = await prisma.rideAttendee.findUnique({
      where: { rideId_memberId: { rideId, memberId: member.id } },
    });
    if (!attendee) {
      return { success: false, error: `${memberName} is not an attendee of this ride.` };
    }

    if (attendee.status === "PAID") {
      return { success: false, error: "Payment is already verified." };
    }

    await prisma.rideAttendee.update({
      where: { rideId_memberId: { rideId, memberId: member.id } },
      data: { status: "VERIFICATION", updatedAt: new Date() },
    });

    await prisma.paymentLog.create({
      data: {
        rideId,
        memberId: member.id,
        action: "MARKED_PAID",
        performedBy: "user",
        metadata: parsed.data.screenshotName ? {
          screenshotName: parsed.data.screenshotName,
          screenshotData: parsed.data.screenshotData,
        } : undefined,
      },
    });

    await updateRideStatus(rideId);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("markPayment error:", error);
    return { success: false, error: "Failed to mark payment." };
  }
}

// ── VERIFY PAYMENT (admin) → status = PAID ───────────────────────────────────
export async function verifyPayment(
  raw: PaymentInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = paymentSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Invalid input." };
    }

    const { rideId, memberName } = parsed.data;

    const member = await prisma.member.findUnique({
      where: { name: memberName },
    });
    if (!member) return { success: false, error: `Member "${memberName}" not found.` };

    const attendee = await prisma.rideAttendee.findUnique({
      where: { rideId_memberId: { rideId, memberId: member.id } },
    });
    if (!attendee) {
      return { success: false, error: `${memberName} is not an attendee of this ride.` };
    }

    if (attendee.status === "PAID") {
      return { success: false, error: "Payment is already verified." };
    }

    await prisma.rideAttendee.update({
      where: { rideId_memberId: { rideId, memberId: member.id } },
      data: { status: "PAID", paidAt: new Date(), verifiedAt: new Date() },
    });

    await prisma.paymentLog.create({
      data: {
        rideId,
        memberId: member.id,
        action: "VERIFIED",
        performedBy: "admin",
      },
    });

    await updateRideStatus(rideId);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("verifyPayment error:", error);
    return { success: false, error: "Failed to verify payment." };
  }
}

// ── ADMIN: MARK PAID DIRECTLY ────────────────────────────────────────────────
export async function adminMarkPaid(
  raw: PaymentInput,
): Promise<{ success: boolean; error?: string }> {
  return verifyPayment(raw);
}

// ── UNMARK PAYMENT (admin) → revert to PENDING ──────────────────────────────
export async function unmarkPayment(
  raw: PaymentInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = paymentSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Invalid input." };
    }

    const { rideId, memberName } = parsed.data;

    const member = await prisma.member.findUnique({
      where: { name: memberName },
    });
    if (!member) return { success: false, error: `Member "${memberName}" not found.` };

    const attendee = await prisma.rideAttendee.findUnique({
      where: { rideId_memberId: { rideId, memberId: member.id } },
    });
    if (!attendee) {
      return { success: false, error: `${memberName} is not an attendee of this ride.` };
    }

    await prisma.rideAttendee.update({
      where: { rideId_memberId: { rideId, memberId: member.id } },
      data: { status: "PENDING", paidAt: null, verifiedAt: null },
    });

    await prisma.paymentLog.create({
      data: {
        rideId,
        memberId: member.id,
        action: "MARKED_UNPAID",
        performedBy: "admin",
      },
    });

    await updateRideStatus(rideId);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("unmarkPayment error:", error);
    return { success: false, error: "Failed to revert payment." };
  }
}
