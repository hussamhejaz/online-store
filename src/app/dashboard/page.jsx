"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CURRENCY_EVENT, getCurrencySettings, saveCurrencyRateToServer, setCurrencySettings, syncCurrencySettingsFromServer } from "@/lib/currency";
import PriceDisplay from "@/components/PriceDisplay";

function formatCount(value) {
  return Number.isFinite(value) ? value.toLocaleString("ar-SA") : "0";
}

export default function DashboardPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState({
    categories: 0,
    products: 0,
    orders: 0,
  });
  const [currency, setCurrency] = useState("USD");
  const [usdToSypRate, setUsdToSypRate] = useState("10000");
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const savingCurrencyRef = useRef(false);

  useEffect(() => {
    syncCurrencySettingsFromServer();
    const settings = getCurrencySettings();
    setCurrency(settings.currency);
    setUsdToSypRate(String(settings.usdToSypRate));

    function syncCurrency() {
      const next = getCurrencySettings();
      setCurrency(next.currency);
      setUsdToSypRate(String(next.usdToSypRate));
    }

    window.addEventListener("storage", syncCurrency);
    window.addEventListener(CURRENCY_EVENT, syncCurrency);
    return () => {
      window.removeEventListener("storage", syncCurrency);
      window.removeEventListener(CURRENCY_EVENT, syncCurrency);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          router.replace("/login");
          return;
        }

        const sessionResponse = await fetch("/api/auth/admin-session", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sessionResult = await sessionResponse.json();
        if (!sessionResponse.ok || !sessionResult?.success) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          router.replace("/login");
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const [categoriesRes, productsRes, ordersRes] = await Promise.all([
          fetch("/api/categories", { headers }),
          fetch("/api/products?includeInactive=true", { headers }),
          fetch("/api/admin/orders", { headers }),
        ]);

        if ([categoriesRes, productsRes, ordersRes].some((res) => res.status === 401 || res.status === 403)) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          router.replace("/login");
          return;
        }

        const [categories, products, orders] = await Promise.all([
          categoriesRes.json(),
          productsRes.json(),
          ordersRes.json(),
        ]);

        if (!categoriesRes.ok || !productsRes.ok || !ordersRes.ok) {
          throw new Error("failed");
        }

        if (!isMounted) {
          return;
        }

        setStats({
          categories: categories?.data?.length || 0,
          products: products?.data?.length || 0,
          orders: orders?.data?.length || 0,
        });
      } catch {
        if (isMounted) {
          setError("تعذر تحميل بيانات لوحة التحكم.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsReady(true);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const cards = useMemo(
    () => [
      { label: "إجمالي التصنيفات", value: stats.categories, tone: "rose" },
      { label: "إجمالي المنتجات", value: stats.products, tone: "zinc" },
      { label: "إجمالي الطلبات", value: stats.orders, tone: "emerald" },
    ],
    [stats],
  );

  const shortcuts = [
    { title: "إدارة المنتجات", subtitle: "إضافة وتحديث المنتجات", href: "/dashboard/products" },
    { title: "إدارة التصنيفات", subtitle: "تنظيم تصنيفات المتجر", href: "/dashboard/categories" },
    { title: "إدارة الطلبات", subtitle: "متابعة الحالات والشحن", href: "/dashboard/orders" },
    { title: "العملاء", subtitle: "عرض حسابات المستخدمين", href: "#" },
    { title: "التقارير", subtitle: "ملخصات الأداء والمبيعات", href: "#" },
    { title: "الإعدادات", subtitle: "خيارات النظام والمتجر", href: "#" },
  ];

  const monthlyOrders = [32, 45, 39, 52, 61, 74, 69];
  const salesTrend = [120, 160, 140, 210, 195, 260, 310, 280];
  const categoryShare = [
    { name: "أزياء", value: 42, color: "bg-rose-500" },
    { name: "إلكترونيات", value: 28, color: "bg-zinc-800" },
    { name: "منزل", value: 18, color: "bg-emerald-500" },
    { name: "أخرى", value: 12, color: "bg-amber-500" },
  ];

  function logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.replace("/login");
  }

  async function saveCurrencySettings() {
    if (savingCurrencyRef.current) {
      return;
    }

    const parsedRate = Number(usdToSypRate || 0);
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      setError("سعر الصرف يجب أن يكون رقمًا موجبًا.");
      return;
    }

    try {
      savingCurrencyRef.current = true;
      setIsSavingCurrency(true);
      setError("");
      const savedRate = await saveCurrencyRateToServer(parsedRate);
      setCurrencySettings({
        currency,
        usdToSypRate: savedRate,
      });
      setMessage("تم حفظ إعدادات العملة وسعر الصرف.");
    } catch (err) {
      setError(err.message || "تعذر حفظ سعر الصرف.");
    } finally {
      savingCurrencyRef.current = false;
      setIsSavingCurrency(false);
    }
  }

  if (!isReady) {
    return null;
  }

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm text-zinc-500">لوحة الإدارة</p>
            <h1 className="mt-1 text-2xl font-semibold">الرئيسية</h1>
            <p className="mt-2 text-sm text-zinc-500">
              اختصارات سريعة للوصول لكل أدوات الإدارة
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            تسجيل الخروج
          </button>
        </header>

        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">إعدادات العملة</h2>
          <p className="mt-1 text-xs text-zinc-500">حدد العملة وسعر 1 دولار مقابل الليرة السورية</p>
          <div className="mt-4 grid gap-3 md:grid-cols-[200px_1fr_auto]">
            <div className="relative">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-md border border-rose-200 bg-white pl-3 pr-9 py-2 text-sm font-semibold text-zinc-800 shadow-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
              >
                <option value="USD">🇺🇸 USD</option>
                <option value="SYP">🇸🇾 SYP</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-zinc-500">▼</span>
            </div>
            <input
              type="number"
              min="1"
              step="1"
              value={usdToSypRate}
              onChange={(e) => setUsdToSypRate(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-rose-500 focus:ring-2"
              placeholder="مثال: 10000"
            />
            <button
              type="button"
              onClick={saveCurrencySettings}
              disabled={isSavingCurrency}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-60"
            >
              {isSavingCurrency ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </section>

        {error ? (
          <p className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.label}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-zinc-500">{card.label}</p>
              <p
                className={`mt-3 text-3xl font-semibold ${
                  card.tone === "rose"
                    ? "text-rose-600"
                    : card.tone === "emerald"
                      ? "text-emerald-600"
                      : "text-zinc-800"
                }`}
              >
                {isLoading ? "..." : formatCount(card.value)}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">الاختصارات</h2>
            <span className="text-xs text-zinc-500">Quick Actions</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shortcuts.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition hover:border-rose-300 hover:bg-rose-50"
              >
                <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.subtitle}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">المهام السريعة</h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              <li className="rounded-md bg-zinc-50 px-3 py-2">مراجعة الطلبات الجديدة</li>
              <li className="rounded-md bg-zinc-50 px-3 py-2">تحديث مخزون المنتجات</li>
              <li className="rounded-md bg-zinc-50 px-3 py-2">إضافة تصنيفات جديدة</li>
            </ul>
          </article>

          <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">نظرة عامة</h3>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              هذه الصفحة الرئيسية مصممة للوصول السريع إلى أهم أقسام لوحة التحكم،
              مع عرض مختصر لحالة المتجر الحالية وأرقام التشغيل الأساسية.
            </p>
          </article>
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-3">
          <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold">تحليل الطلبات الأسبوعي</h3>
              <p className="text-xs text-emerald-600">+18.4% مقارنة بالأسبوع السابق</p>
            </div>

            <div className="flex h-56 items-end gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
              {monthlyOrders.map((value, index) => (
                <div key={value + index} className="flex flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="w-full rounded-t-md bg-rose-500/85"
                    style={{ height: `${value}%` }}
                  />
                  <span className="text-xs text-zinc-500">
                    {["س", "ح", "ن", "ث", "ر", "خ", "ج"][index]}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">توزيع التصنيفات</h3>
            <div className="mt-5 space-y-3">
              {categoryShare.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-xs text-zinc-600">
                    <span>{item.name}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">اتجاه المبيعات</h3>
              <span className="text-xs text-zinc-500">آخر 8 أشهر</span>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
              <svg viewBox="0 0 320 140" className="h-44 w-full">
                <polyline
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="3"
                  points={salesTrend
                    .map((point, index) => `${index * 45 + 4},${130 - point / 3}`)
                    .join(" ")}
                />
                {salesTrend.map((point, index) => (
                  <circle
                    key={point + index}
                    cx={index * 45 + 4}
                    cy={130 - point / 3}
                    r="3.5"
                    fill="#be123c"
                  />
                ))}
              </svg>
            </div>
          </article>

          <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">مصادر الطلبات</h3>
              <span className="text-xs text-zinc-500">تحليل القنوات</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-44 w-44 rounded-full bg-[conic-gradient(#e11d48_0%_42%,#18181b_42%_70%,#10b981_70%_88%,#f59e0b_88%_100%)]">
                <div className="absolute inset-7 flex items-center justify-center rounded-full bg-white text-sm font-semibold text-zinc-700">
                  100%
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <p className="rounded bg-rose-50 px-2 py-1 text-rose-700">الموقع: 42%</p>
              <p className="rounded bg-zinc-100 px-2 py-1 text-zinc-700">التطبيق: 28%</p>
              <p className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">انستغرام: 18%</p>
              <p className="rounded bg-amber-50 px-2 py-1 text-amber-700">أخرى: 12%</p>
            </div>
          </article>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">متوسط قيمة الطلب</p>
            <PriceDisplay value={245} currency={currency} usdToSypRate={Number(usdToSypRate || 0)} className="mt-2 text-2xl font-semibold text-zinc-900" />
            <p className="mt-2 text-xs text-emerald-600">تحسن بنسبة 6.2%</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">معدل التحويل</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">3.8%</p>
            <p className="mt-2 text-xs text-emerald-600">أعلى من المتوسط الشهري</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">المنتجات منخفضة المخزون</p>
            <p className="mt-2 text-2xl font-semibold text-rose-600">7</p>
            <p className="mt-2 text-xs text-rose-600">تحتاج متابعة عاجلة</p>
          </article>
        </section>
      </div>
    </main>
  );
}
