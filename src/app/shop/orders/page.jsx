"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PriceDisplay from "@/components/PriceDisplay";

function statusMeta(status) {
  const value = String(status || "").toUpperCase();
  const map = {
    PENDING: { label: "قيد الانتظار", className: "bg-amber-100 text-amber-700" },
    CONFIRMED: { label: "مؤكد", className: "bg-sky-100 text-sky-700" },
    SHIPPED: { label: "تم الشحن", className: "bg-indigo-100 text-indigo-700" },
    DELIVERED: { label: "تم التسليم", className: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "ملغي", className: "bg-rose-100 text-rose-700" },
  };
  return map[value] || { label: value, className: "bg-zinc-200 text-zinc-700" };
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadOrders() {
      try {
        const token = localStorage.getItem("customer_token");
        if (!token) {
          router.replace("/shop/auth");
          return;
        }
        const response = await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (response.status === 401) {
          localStorage.removeItem("customer_token");
          localStorage.removeItem("customer_user");
          router.replace("/shop/auth");
          return;
        }
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "تعذر تحميل الطلبات.");
        }
        if (mounted) {
          setOrders(result.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "حدث خطأ أثناء تحميل الطلبات.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();
    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-[radial-gradient(circle_at_top_right,#ffe4e6,transparent_40%),linear-gradient(135deg,#fafafa,#f4f4f5)] px-5 py-6 md:px-7">
          <p className="text-xs font-semibold tracking-[0.12em] text-rose-700">ORDERS HISTORY</p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 md:text-3xl">طلباتي</h1>
          <p className="mt-2 text-sm text-zinc-600">تابع حالة طلباتك وتفاصيل كل عملية شراء.</p>
        </div>

        <div className="p-5 md:p-7">
          {error ? <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          {isLoading ? (
            <p className="text-sm text-zinc-500">جاري التحميل...</p>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center">
              <p className="text-sm text-zinc-500">لا توجد طلبات حتى الآن.</p>
              <button
                type="button"
                onClick={() => router.push("/shop")}
                className="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                ابدأ التسوق
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = statusMeta(order.status);
                return (
                  <article key={order.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-zinc-500">رقم الطلب</p>
                        <p className="font-semibold text-zinc-900">#{order.id.slice(0, 8)}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                      <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
                        <p className="text-xs text-zinc-500">الإجمالي</p>
                        <PriceDisplay value={order.total} currency="USD" usdToSypRate={1} className="mt-1 font-semibold text-zinc-900" />
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 md:col-span-2">
                        <p className="text-xs text-zinc-500">العنوان</p>
                        <p className="mt-1 font-medium text-zinc-800">
                          {order.city} - {order.address}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3">
                      <p className="text-sm font-semibold text-zinc-900">عناصر الطلب</p>
                      <div className="mt-3 space-y-2">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                            <p className="text-zinc-700">{item.product?.name}</p>
                            <p className="text-xs text-zinc-500">
                              {item.quantity} × <PriceDisplay value={item.lineTotal} currency="USD" usdToSypRate={1} compact />
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
