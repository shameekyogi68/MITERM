import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const prismaUrl = process.env.POSTGRES_PRISMA_URL;
  const directUrl = process.env.DIRECT_URL;
  const nonPoolingUrl = process.env.POSTGRES_URL_NON_POOLING;

  const maskUrl = (url: string | undefined) => {
    if (!url) return "undefined/empty";
    return url.replace(/:[^@]+@/, ":***@");
  };

  let dbConnectionResult = "";
  let dbConnectionError = null;

  const connectionString = prismaUrl || dbUrl;
  if (connectionString) {
    const pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 5000,
    });
    try {
      const client = await pool.connect();
      const res = await client.query("SELECT 1 as test");
      dbConnectionResult = `Success! Query result: ${JSON.stringify(res.rows)}`;
      client.release();
    } catch (err: any) {
      dbConnectionError = {
        message: err.message,
        code: err.code,
        stack: err.stack,
      };
    } finally {
      await pool.end();
    }
  } else {
    dbConnectionResult = "No database connection string available to test.";
  }

  return NextResponse.json({
    DATABASE_URL: maskUrl(dbUrl),
    POSTGRES_PRISMA_URL: maskUrl(prismaUrl),
    DIRECT_URL: maskUrl(directUrl),
    POSTGRES_URL_NON_POOLING: maskUrl(nonPoolingUrl),
    NODE_ENV: process.env.NODE_ENV,
    dbConnectionResult,
    dbConnectionError,
  });
}
