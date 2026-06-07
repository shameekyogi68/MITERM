import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "migrate";

  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  let cmd = "";

  if (action === "migrate") {
    cmd = `npx prisma migrate deploy --schema="${schemaPath}"`;
  } else if (action === "seed") {
    cmd = `npx tsx prisma/seed.ts`;
  } else if (action === "push") {
    cmd = `npx prisma db push --accept-data-loss --schema="${schemaPath}"`;
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const { stdout, stderr } = await execAsync(cmd, { env: { ...process.env } });
    return NextResponse.json({
      command: cmd,
      success: true,
      stdout,
      stderr,
    });
  } catch (error: any) {
    return NextResponse.json({
      command: cmd,
      success: false,
      error: error.message,
      stdout: error.stdout || "",
      stderr: error.stderr || "",
    });
  }
}
