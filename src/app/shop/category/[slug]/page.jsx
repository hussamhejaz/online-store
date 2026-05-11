"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CURRENCY_EVENT, getCurrencySettings } from "@/lib/currency";
import PriceDisplay from "@/components/PriceDisplay";

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const slug = String(params?.slug || "");

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError("");

        const [categoriesRes, productsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products"),
        ]);

        const [categoriesJson, productsJson] = await Promise.all([
          categoriesRes.json(),
          productsRes.json(),
        ]);

        if (!categoriesRes.ok || !categoriesJson?.success) {
          throw new Error(categoriesJson?.message || "تعذر تحميل التصنيفات.");
        }

        if (!productsRes.ok || !productsJson?.success) {
          throw new Error(productsJson?.message || "تعذر تحميل المنتجات.");
        }

        const categories = Array.isArray(categoriesJson.data) ? categoriesJson.data : [];
        const found = categories.find((item) => item.slug === slug || item.id === slug);

        if (!found) {
          throw new Error("التصنيف غير موجود.");
        }

        const allProducts = Array.isArray(productsJson.data) ? productsJson.data : [];
        const filtered = allProducts.filter((item) => item.categoryId === found.id);

        if (mounted) {
          setCategory(found);
          setProducts(filtered);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "حدث خطأ أثناء تحميل الصفحة.");
          setCategory(null);
          setProducts([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const title = useMemo(() => category?.name || "التصنيف", [category]);

  async function addToCartFromCard(product) {
    const activeVariants = Array.isArray(product.variants)
      ? product.variants.filter((variant) => variant.isActive && Number(variant.stock || 0) > 0)
      : [];

    const payload = {
      productId: product.id,
      quantity: 1,
      color: null,
      size: null,
    };

    if (activeVariants.length > 0) {
      payload.color = activeVariants[0].color || null;
      payload.size = activeVariants[0].size || null;
    } else {
      const firstColor = Array.isArray(product.colors) && product.colors.length > 0 ? product.colors[0] : null;
      const firstSize = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0] : null;
      payload.color = firstColor;
      payload.size = firstSize;
    }

    setError("");
    setMessage("");
    const token = localStorage.getItem("customer_token");
    if (!token) {
      router.push("/shop/auth");
      return;
    }

    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "تعذر إضافة المنتج للسلة.");
      }
      setMessage("تمت إضافة المنتج إلى السلة.");
      window.dispatchEvent(new Event("customer-cart-updated"));
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء الإضافة.");
    }
  }

  return (
    <section dir="rtl" className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 md:px-6 md:py-8">
      <div className="shop-section-card rounded-3xl p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-rose-500">التصنيفات</p>
            <h1 className="text-2xl font-bold text-zinc-900 md:text-3xl">{title}</h1>
          </div>
          <Link href="/shop" className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
            كل المنتجات
          </Link>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-zinc-500">جاري التحميل...</p> : null}
      {!isLoading && message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {!isLoading && error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      {!isLoading && !error && products.length === 0 ? (
        <p className="text-sm text-zinc-500">لا توجد منتجات في هذا التصنيف حالياً.</p>
      ) : null}

      {!isLoading && !error && products.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {products.map((product, index) => (
            <article
              key={product.id}
              onClick={() => router.push(`/shop/products/${product.id}`)}
            className="shop-product-card group animate-fade-up flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${140 + index * 70}ms` }}
            >
              <div className="relative w-full overflow-hidden bg-rose-50">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="h-64 w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-64 w-full items-center justify-center bg-[linear-gradient(135deg,#f4f4f5,#e4e4e7)] text-xs text-zinc-500">
                    لا توجد صورة
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col space-y-3 p-4">
                <h2 className="line-clamp-2 min-h-10 text-center text-base font-semibold text-zinc-900">
                  {product.name}
                </h2>
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="text-zinc-500">{(product.ratingAverage || 0).toFixed(1)}</span>
                  <span className="text-rose-500">★</span>
                  <PriceDisplay value={product.price} currency={currency} usdToSypRate={usdToSypRate} className="text-zinc-700" compact />
                </div>
                <div className="mt-auto pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCartFromCard(product);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 active:scale-[0.98]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                      <path d="M2 3h2l2.2 10.2a1 1 0 0 0 1 .8h9.9a1 1 0 0 0 1-.8L20 6H6" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="9" cy="19" r="1.5" fill="currentColor" />
                      <circle cx="17" cy="19" r="1.5" fill="currentColor" />
                    </svg>
                    <span>إضافة للسلة</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
