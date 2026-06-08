import { prisma } from "@/lib/prisma";
import { PetrolSource } from "@prisma/client";
import { NextResponse } from "next/server";
import { getTodayIST } from "@/lib/utils";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let price: number | null = null;
  let source: PetrolSource = "API";

  try {
    if (!process.env.PETROL_API_KEY) {
      throw new Error("PETROL_API_KEY is not configured.");
    }
    const res = await fetch(
      "https://fuel.indianapi.in/live_fuel_price?fuel_type=petrol&location_type=city",
      {
        headers: {
          "x-api-key": process.env.PETROL_API_KEY,
        },
      }
    );
    if (!res.ok) throw new Error(`API responded with status ${res.status}`);
    const data = await res.json();
    const udupiData = data.find((item: any) => item.city?.toLowerCase() === "udupi");
    if (udupiData && udupiData.price) {
      price = parseFloat(udupiData.price);
      source = "API";
    } else {
      throw new Error("Udupi petrol price not found in API response");
    }
  } catch (err) {
    console.warn("External petrol API failed, using fallback:", err);
    // Fallback: use previous day's price
    const yesterday = await prisma.petrolPrice.findFirst({
      orderBy: { date: "desc" },
    });
    price = yesterday?.price ?? 0;
    source = "CACHE";
  }

  if (price === null) {
    price = 0;
    source = "CACHE";
  }

  const today = getTodayIST();

  await prisma.petrolPrice.upsert({
    where: { date: today },
    update: { price, source },
    create: { price, date: today, source },
  });

  return NextResponse.json({ success: true, price, source });
}
