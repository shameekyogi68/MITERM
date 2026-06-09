"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  settingKeySchema,
  memberDistanceSchema,
  petrolPriceSchema,
} from "@/lib/validations";

// ── GET SETTING ──────────────────────────────────────────────────────────────
export async function getSetting(key: string) {
  try {
    const parsed = settingKeySchema.safeParse(key);
    if (!parsed.success) return null;

    const setting = await prisma.setting.findUnique({ where: { key } });
    return setting?.value ?? null;
  } catch (error) {
    console.error("getSetting error:", error);
    return null;
  }
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
    const numericSettings = ["mileage", "routeDistance", "petrolPrice"];
    if (numericSettings.includes(key)) {
      const num = Number(value);
      if (key === "petrolPrice") {
        if (isNaN(num) || num <= 0 || num > 500) {
          return { success: false, error: "Petrol price must be between 0 and 500." };
        }
      } else if (isNaN(num) || num <= 0 || num > 10000) {
        return { success: false, error: "Invalid numeric value for this setting." };
      }
      value = num;
    }

    await prisma.setting.upsert({
      where: { key },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: { value: value as any },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  try {
    const priceSetting = await prisma.setting.findUnique({ where: { key: "petrolPrice" } });
    const price = priceSetting?.value && typeof priceSetting.value === "number" ? priceSetting.value : 102.41;

    return {
      price,
      source: "MANUAL" as string,
      lastUpdated: priceSetting?.updatedAt ?? new Date(),
    };
  } catch (error) {
    console.error("getTodayPetrolPrice error:", error);
    return {
      price: 102.41,
      source: "ERROR",
      lastUpdated: new Date(),
    };
  }
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

    await prisma.setting.upsert({
      where: { key: "petrolPrice" },
      update: { value: parsed.data.price },
      create: { key: "petrolPrice", value: parsed.data.price },
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
  try {
    const settings = await prisma.setting.findMany();
    return Object.fromEntries(
      settings.map((s) => [s.key, s.value]),
    );
  } catch (error) {
    console.error("getAllSettings error:", error);
    return {};
  }
}

// ── GET ALL MEMBERS ──────────────────────────────────────────────────────────
export async function getAllMembers() {
  try {
    return await prisma.member.findMany({ orderBy: { name: "asc" } });
  } catch (error) {
    console.error("getAllMembers error:", error);
    return [];
  }
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
