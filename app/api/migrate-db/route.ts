import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

  return new Promise((resolve) => {
    exec(cmd, { env: { ...process.env } }, (error, stdout, stderr) => {
      resolve(
        NextResponse.json({
          command: cmd,
          success: !error,
          error: error ? error.message : null,
          stdout: stdout.toString(),
          stderr: stderr.toString(),
        })
      );
    });
  });
}
