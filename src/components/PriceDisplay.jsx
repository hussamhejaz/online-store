"use client";

import { getMoneyParts } from "@/lib/currency";

export default function PriceDisplay({ value, currency, usdToSypRate, className = "", compact = false }) {
  const parts = getMoneyParts(value, currency, usdToSypRate);

  if (parts.currency === "USD") {
    return <span className={className}>${parts.usdValue}</span>;
  }

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">قديم: {parts.oldValue} ل.س</span>
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">جديد: {parts.newValue}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">قديم: {parts.oldValue} ل.س</span>
      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">جديد: {parts.newValue}</span>
    </span>
  );
}
