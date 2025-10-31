import { ResponsiveDashboardLayout } from "@/components/layout/ResponsiveDashboardLayout";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <ResponsiveDashboardLayout user={session.user}>
      {children}
    </ResponsiveDashboardLayout>
  );
}
