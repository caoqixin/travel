import { ResponsiveDashboardLayout } from "@/components/layout/ResponsiveDashboardLayout";
import { getServerSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    return null;
  }

  return (
    <ResponsiveDashboardLayout user={session.user}>
      {children}
    </ResponsiveDashboardLayout>
  );
}
