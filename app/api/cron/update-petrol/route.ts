import { prisma } from "@/lib/prisma";
import { PetrolSource } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let price: number | null = null;
  let source: PetrolSource = "API";

  try {
    // Attempt external petrol price API (placeholder — replace with real API key)
    // const res = await fetch(`https://api.data.gov.in/resource/...?api-key=${process.env.PETROL_API_KEY}&format=json`);
    // const data = await res.json();
    // price = data?.records?.[0]?.price;
    throw new Error("No API configured — using fallback");
  } catch {
    // Fallback: use previous day's price
    const yesterday = await prisma.petrolPrice.findFirst({
      orderBy: { date: "desc" },
    });
    price = yesterday?.price ?? 110;
    source = "CACHE";
  }

  if (price === null) {
    price = 110;
    source = "CACHE";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.petrolPrice.upsert({
    where: { date: today },
    update: { price, source },
    create: { price, date: today, source },
  });

  return NextResponse.json({ success: true, price, source });
}
