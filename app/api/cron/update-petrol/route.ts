import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const priceSetting = await prisma.setting.findUnique({ where: { key: "petrolPrice" } });
    const price = priceSetting?.value && typeof priceSetting.value === "number" ? priceSetting.value : 110.80;

    return NextResponse.json({
      success: true,
      message: "Petrol API is disabled. Manual price is used.",
      price,
    });
  } catch (error) {
    console.error("Cron update-petrol error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to read petrol price setting." },
      { status: 500 },
    );
  }
}
