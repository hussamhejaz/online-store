"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CURRENCY_EVENT, getCurrencySettings } from "@/lib/currency";
import PriceDisplay from "@/components/PriceDisplay";

const initialShipping = {
  city: "",
  address: "",
  phone: "",
  notes: "",
};

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [shipping, setShipping] = useState(initialShipping);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [usdToSypRate, setUsdToSypRate] = useState(10000);

  useEffect(() => {
    const settings = getCurrencySettings();
    setCurrency(settings.currency);
    setUsdToSypRate(settings.usdToSypRate);

    function syncCurrency() {
      const next = getCurrencySettings();
      setCurrency(next.currency);
      setUsdToSypRate(next.usdToSypRate);
    }

    window.addEventListener("storage", syncCurrency);
    window.addEventListener(CURRENCY_EVENT, syncCurrency);
    return () => {
      window.removeEventListener("storage", syncCurrency);
      window.removeEventListener(CURRENCY_EVENT, syncCurrency);
    };
  }, []);

  async function getToken() {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      router.replace("/shop/auth");
      return null;
    }
    return token;
  }

  async function loadCart() {
    const token = await getToken();
    if (!token) {
      return;
    }
    const response = await fetch("/api/cart", {
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
      throw new Error(result?.message || "تعذر تحميل السلة.");
    }
    const nextCart = result.data || { items: [], total: 0 };
    setCart(nextCart);
    window.dispatchEvent(new Event("customer-cart-updated"));
  }

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        await loadCart();
      } catch (err) {
        if (mounted) {
          setError(err.message || "حدث خطأ أثناء تحميل السلة.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, []);

  async function updateQuantity(itemId, quantity) {
    try {
      const token = await getToken();
      if (!token) {
        return;
      }
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "تعذر تحديث الكمية.");
      }
      await loadCart();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء التحديث.");
    }
  }

  async function removeItem(itemId) {
    try {
      const token = await getToken();
      if (!token) {
        return;
      }
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "تعذر حذف العنصر.");
      }
      await loadCart();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء الحذف.");
    }
  }

  async function placeOrder(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!acceptedTerms) {
      setError("يجب الموافقة على الشروط والأحكام قبل تأكيد الطلب.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        return;
      }
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(shipping),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "تعذر إتمام الطلب.");
      }
      setMessage("تم إنشاء الطلب بنجاح.");
      setShipping(initialShipping);
      await loadCart();
      router.push("/shop/orders");
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء إنشاء الطلب.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-[radial-gradient(circle_at_top_right,#ffe4e6,transparent_40%),linear-gradient(135deg,#fafafa,#f4f4f5)] px-5 py-6 md:px-7">
          <p className="text-xs font-semibold tracking-[0.12em] text-rose-700">SHOPPING CART</p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 md:text-3xl">سلة المشتريات</h1>
          <p className="mt-2 text-sm text-zinc-600">راجع المنتجات وعدل الكميات قبل تأكيد الطلب.</p>
        </div>

        <div className="p-5 md:p-7">
          {message ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          {isLoading ? (
            <p className="text-sm text-zinc-500">جاري التحميل...</p>
          ) : cart.items.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center">
              <p className="text-sm text-zinc-500">السلة فارغة حالياً.</p>
              <button
                type="button"
                onClick={() => router.push("/shop")}
                className="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                العودة للتسوق
              </button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:p-5">
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-zinc-900">{item.product?.name}</p>
                          {(item.color || item.size) ? (
                            <p className="mt-1 text-xs text-zinc-500">
                              {item.color ? `اللون: ${item.color}` : ""}
                              {item.color && item.size ? " | " : ""}
                              {item.size ? `المقاس: ${item.size}` : ""}
                            </p>
                          ) : null}
                        </div>
                        <PriceDisplay value={item.lineTotal} currency={currency} usdToSypRate={usdToSypRate} className="text-sm font-semibold text-zinc-800" compact />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                          className="w-24 rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-rose-500 focus:ring-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-200"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-600">الإجمالي</p>
                    <PriceDisplay value={cart.total} currency={currency} usdToSypRate={usdToSypRate} className="text-xl font-bold text-zinc-900" />
                  </div>
                </div>
              </div>

              <form onSubmit={placeOrder} className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900">بيانات الشحن</h2>
                <input className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:bg-white focus:ring-2" placeholder="المدينة" value={shipping.city} onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))} />
                <input className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:bg-white focus:ring-2" placeholder="العنوان" value={shipping.address} onChange={(e) => setShipping((s) => ({ ...s, address: e.target.value }))} />
                <input className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:bg-white focus:ring-2" placeholder="رقم الهاتف" value={shipping.phone} onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))} />
                <textarea className="min-h-24 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:bg-white focus:ring-2" placeholder="ملاحظات (اختياري)" value={shipping.notes} onChange={(e) => setShipping((s) => ({ ...s, notes: e.target.value }))} />
                <label className="flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-rose-600"
                  />
                  <span>
                    أوافق على{" "}
                    <Link href="/shop/terms" className="font-semibold text-rose-700 underline underline-offset-2 hover:text-rose-600">
                      الشروط والأحكام
                    </Link>
                    .
                  </span>
                </label>
                <button disabled={isSubmitting} className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60">
                  {isSubmitting ? "جاري الإرسال..." : "تأكيد الطلب"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
