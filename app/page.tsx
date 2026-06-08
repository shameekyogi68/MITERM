import { Suspense } from "react";
import { cookies } from "next/headers";
import AppShell from "@/components/shared/AppShell";
import TabRouter from "./tab-router";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const adminSecret = process.env.ADMIN_SECRET || "shameekyogi68";
  
  let isAdmin = false;
  let adminToken = params.admin ?? null;

  if (params.admin === adminSecret) {
    isAdmin = true;
  } else {
    const token = cookieStore.get("admin_token")?.value;
    if (token === adminSecret) {
      isAdmin = true;
      adminToken = token;
    }
  }

  return (
    <AppShell isAdmin={isAdmin}>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      >
        <TabRouter isAdmin={isAdmin} adminToken={adminToken} />
      </Suspense>
    </AppShell>
  );
}
