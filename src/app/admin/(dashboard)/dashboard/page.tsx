import { Suspense } from "react";
import { DashboardContent } from "@/features/admin/dashboard/components/DashboardContent";
import { getServerSession } from "@/lib/auth";

export default async function AdminDashboard() {
  const session = await getServerSession();

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <DashboardContent username={session.user.name} />
      </Suspense>
    </div>
  );
}
