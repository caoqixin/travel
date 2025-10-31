import { AdminLoginForm } from "@/components/AdminLoginForm";
import { Suspense } from "react";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
