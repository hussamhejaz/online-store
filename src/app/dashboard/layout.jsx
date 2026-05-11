"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { syncCurrencySettingsFromServer } from "@/lib/currency";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-10.5Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M12 2 3 6.5 12 11l9-4.5L12 2Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 6.5V17.5L12 22l9-4.5V6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11V22" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M12 3 3 8l9 5 9-5-9-5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m3 12 9 5 9-5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m3 16 9 5 9-5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M2 3h2l2.2 10.2a1 1 0 0 0 1 .8h9.9a1 1 0 0 0 1-.8L20 6H6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="19" r="1.6" fill="currentColor" />
      <circle cx="17" cy="19" r="1.6" fill="currentColor" />
    </svg>
  );
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  useEffect(() => {
    syncCurrencySettingsFromServer();
  }, []);
  const items = [
    { label: "الرئيسية", href: "/dashboard", icon: <HomeIcon /> },
    { label: "المنتجات", href: "/dashboard/products", icon: <BoxIcon /> },
    { label: "التصنيفات", href: "/dashboard/categories", icon: <LayersIcon /> },
    { label: "الطلبات", href: "/dashboard/orders", icon: <CartIcon /> },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 text-zinc-900">
      <aside className="fixed inset-y-0 right-0 z-20 w-72 border-l border-zinc-800 bg-zinc-950 text-zinc-100">
        <div className="flex h-full flex-col p-6">
          <div>
            <p className="text-xs tracking-[0.2em] text-rose-400">TRENDWA</p>
            <h2 className="mt-3 text-xl font-semibold">لوحة التحكم</h2>
            <p className="mt-2 text-xs text-zinc-400">إدارة المتجر</p>
          </div>

          <nav className="mt-10 space-y-2 text-sm">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between rounded-md px-3 py-2.5 transition ${
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
                    ? "bg-white/10 font-medium text-white"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                <span className="text-zinc-300">{item.icon}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-zinc-400">الحساب الحالي</p>
            <p className="mt-1 text-sm font-medium">مدير النظام</p>
          </div>
        </div>
      </aside>

      <div className="mr-72 min-h-screen">{children}</div>
    </div>
  );
}
