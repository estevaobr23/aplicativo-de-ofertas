"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { useTheme } from "./ThemeProvider";
import {
  IconVault,
  IconSearch,
  IconSun,
  IconMoon,
  IconChart,
  IconClock,
} from "./icons";
import { ImportExport } from "./ImportExport";

export function AppHeader({
  onNewOffer,
  onOpenAutomation,
}: {
  onNewOffer?: () => void;
  onOpenAutomation?: () => void;
}) {
  const { theme, toggle } = useTheme();
  const search = useStore((s) => s.filters.search);
  const setSearch = useStore((s) => s.setSearch);
  const pathname = usePathname();
  const onDashboard = pathname === "/";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-fg">
            <IconVault />
          </span>
          <span className="hidden sm:inline">Swipe Vault</span>
        </Link>

        {onDashboard && (
          <div className="relative ml-2 max-w-md flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" width={16} height={16} />
            <input
              className="input pl-9"
              placeholder="Buscar em nome, copy, notas, tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/dashboard"
            className={`btn-ghost ${pathname === "/dashboard" ? "text-brand" : ""}`}
            title="Métricas"
          >
            <IconChart width={16} height={16} />
            <span className="hidden lg:inline">Métricas</span>
          </Link>

          {onOpenAutomation && (
            <button className="btn-ghost" onClick={onOpenAutomation} title="Automação">
              <IconClock width={16} height={16} />
              <span className="hidden lg:inline">Automação</span>
            </button>
          )}

          <ImportExport />

          <button className="btn-ghost !p-2" onClick={toggle} title="Alternar tema" aria-label="Alternar tema">
            {theme === "dark" ? <IconSun /> : <IconMoon />}
          </button>

          {onNewOffer && (
            <button className="btn-primary" onClick={onNewOffer}>
              <span className="text-lg leading-none">+</span>
              <span className="hidden sm:inline">Nova oferta</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
