"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  settingKeySchema,
  memberDistanceSchema,
  petrolPriceSchema,
  exportFormatSchema,
} from "@/lib/validations";

// ── GET SETTING ──────────────────────────────────────────────────────────────
export async function getSetting(key: string) {
  const parsed = settingKeySchema.safeParse(key);
  if (!parsed.success) return null;

  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value ?? null;
}

// ── UPDATE SETTING ───────────────────────────────────────────────────────────
export async function updateSetting(
  key: string,
  value: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = settingKeySchema.safeParse(key);
    if (!parsed.success) {
      return { success: false, error: "Invalid setting key." };
    }

    // Type-safe value validation for known settings
    const numericSettings = ["mileage", "routeDistance"];
    if (numericSettings.includes(key)) {
      const num = Number(value);
      if (isNaN(num) || num <= 0 || num > 10000) {
        return { success: false, error: "Invalid numeric value for this setting." };
      }
      value = num;
    }

    await prisma.setting.upsert({
      where: { key },
      update: { value: value as any },
      create: { key, value: value as any },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("updateSetting error:", error);
    return { success: false, error: "Failed to update setting." };
  }
}

// ── GET TODAY'S PETROL PRICE ─────────────────────────────────────────────────
export async function getTodayPetrolPrice() {
  const latest = await prisma.petrolPrice.findFirst({
    orderBy: { date: "desc" },
  });
  return {
    price: latest?.price ?? 110,
    source: (latest?.source ?? "CACHE") as string,
    lastUpdated: latest?.date ?? new Date(),
  };
}

// ── UPDATE PETROL PRICE ──────────────────────────────────────────────────────
export async function updatePetrolPrice(
  price: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = petrolPriceSchema.safeParse({ price });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Invalid price." };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.petrolPrice.upsert({
      where: { date: today },
      update: { price: parsed.data.price, source: "MANUAL" },
      create: { price: parsed.data.price, date: today, source: "MANUAL" },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("updatePetrolPrice error:", error);
    return { success: false, error: "Failed to update petrol price." };
  }
}

// ── GET ALL SETTINGS ─────────────────────────────────────────────────────────
export async function getAllSettings() {
  const settings = await prisma.setting.findMany();
  return Object.fromEntries(
    settings.map((s) => [s.key, s.value]),
  );
}

// ── GET ALL MEMBERS ──────────────────────────────────────────────────────────
export async function getAllMembers() {
  return prisma.member.findMany({ orderBy: { name: "asc" } });
}

// ── UPDATE MEMBER DISTANCE ───────────────────────────────────────────────────
export async function updateMemberDistance(
  memberName: string,
  distance: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = memberDistanceSchema.safeParse({ name: memberName, distance });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Invalid input." };
    }

    const member = await prisma.member.findUnique({
      where: { name: parsed.data.name },
    });
    if (!member) {
      return { success: false, error: `Member "${memberName}" not found.` };
    }

    await prisma.member.update({
      where: { name: parsed.data.name },
      data: { distance: parsed.data.distance },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("updateMemberDistance error:", error);
    return { success: false, error: "Failed to update member distance." };
  }
}
