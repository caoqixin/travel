"use client";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TitleHeaderProps {
  title: string;
  description?: string;
}

export const TitleHeader = ({ title, description }: TitleHeaderProps) => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setRefreshing(false);
  };
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-gray-600 mt-1">{description}</p>}
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          刷新
        </Button>
        <Link href="/admin/flights/new">
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            添加航班
          </Button>
        </Link>
      </div>
    </div>
  );
};
