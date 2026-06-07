import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const prismaUrl = process.env.POSTGRES_PRISMA_URL;
  const directUrl = process.env.DIRECT_URL;
  const nonPoolingUrl = process.env.POSTGRES_URL_NON_POOLING;

  const maskUrl = (url: string | undefined) => {
    if (!url) return "undefined/empty";
    try {
      // Remove credentials from display for safety
      const cleaned = url.replace(/:[^@]+@/, ":***@");
      return cleaned;
    } catch {
      return "invalid URL format";
    }
  };

  return NextResponse.json({
    DATABASE_URL: maskUrl(dbUrl),
    POSTGRES_PRISMA_URL: maskUrl(prismaUrl),
    DIRECT_URL: maskUrl(directUrl),
    POSTGRES_URL_NON_POOLING: maskUrl(nonPoolingUrl),
    NODE_ENV: process.env.NODE_ENV,
  });
}
