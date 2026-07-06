"use client";

import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Dashboard } from "@/components/Dashboard";
import { IconBack } from "@/components/icons";

export default function MetricsPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-[1400px] px-4 py-5">
        <div className="mb-4 flex items-center gap-3">
          <Link href="/" className="btn-ghost">
            <IconBack width={16} height={16} /> Voltar
          </Link>
          <h1 className="text-xl font-bold">Métricas &amp; padrões</h1>
        </div>
        <Dashboard />
      </main>
    </div>
  );
}
