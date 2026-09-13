"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  ["⌂", "Dashboard", "/"],
  ["◫", "Orders", "/orders"],
  ["▣", "Inventory", "/inventory"],
  ["♙", "Customers", "/customers"],
  ["▤", "Invoices", "/invoices"],
  ["◇", "Suppliers", "/suppliers"],
  ["◒", "Reports", "/reports"],
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-800 bg-[#0b1220] text-white">
      <div className="border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-lg font-black text-white">
            K
          </div>

          <div>
            <h1 className="text-lg font-bold">KarobarOS</h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              AI Business OS
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6">
        <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Workspace
        </p>

        {navItems.map(([icon, label, href]) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition ${
                active
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
                {icon}
              </span>

              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-[10px] font-semibold text-slate-400">
            AI SYSTEM
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-slate-300">
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}