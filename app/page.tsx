import { Suspense } from "react";
import AppShell from "@/components/shared/AppShell";
import TabRouter from "./tab-router";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string }>;
}) {
  const params = await searchParams;
  const adminSecret = process.env.ADMIN_SECRET || "shameekyogi68";
  const isAdmin = params.admin === adminSecret;

  return (
    <AppShell isAdmin={isAdmin}>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      >
        <TabRouter isAdmin={isAdmin} adminToken={params.admin ?? null} />
      </Suspense>
    </AppShell>
  );
}
