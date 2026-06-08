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
    const numericSettings = ["mileage", "routeDistance", "petrolPriceOffset"];
    if (numericSettings.includes(key)) {
      const num = Number(value);
      if (key === "petrolPriceOffset") {
        if (isNaN(num) || num < -100 || num > 100) {
          return { success: false, error: "Petrol price offset must be between -100 and 100." };
        }
      } else if (isNaN(num) || num <= 0 || num > 10000) {
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
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if we already have today's price cached in the database
    let todayRecord = await prisma.petrolPrice.findUnique({
      where: { date: today },
    });

    const offsetSetting = await prisma.setting.findUnique({ where: { key: "petrolPriceOffset" } });
    const offset = offsetSetting?.value && typeof offsetSetting.value === "number" ? offsetSetting.value : 0;

    if (!todayRecord) {
      // If not cached today, attempt to fetch fresh from IndianAPI
      try {
        const apiKey = process.env.PETROL_API_KEY;
        if (apiKey) {
          const res = await fetch(
            "https://fuel.indianapi.in/live_fuel_price?fuel_type=petrol&location_type=city",
            {
              headers: {
                "x-api-key": apiKey,
              },
              next: { revalidate: 3600 } // cache for 1 hour in Next.js
            }
          );
          if (res.ok) {
            const data = await res.json();
            const udupiData = data.find((item: any) => item.city?.toLowerCase() === "udupi");
            if (udupiData && udupiData.price) {
              const priceVal = parseFloat(udupiData.price);
              todayRecord = await prisma.petrolPrice.upsert({
                where: { date: today },
                update: { price: priceVal, source: "API" },
                create: { price: priceVal, date: today, source: "API" },
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch fresh price from IndianAPI:", err);
      }
    }

    // Fallback to the latest available historical record in the database if API call failed
    if (!todayRecord) {
      todayRecord = await prisma.petrolPrice.findFirst({
        orderBy: { date: "desc" },
      });
    }

    const basePrice = todayRecord?.price ?? 0;
    return {
      price: basePrice > 0 ? basePrice + offset : 0,
      source: (todayRecord?.source ?? "ERROR") as string,
      lastUpdated: todayRecord?.date ?? new Date(),
    };
  } catch (error) {
    console.error("getTodayPetrolPrice error:", error);
    return {
      price: 0,
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
