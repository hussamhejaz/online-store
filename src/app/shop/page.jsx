"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCY_EVENT, getCurrencySettings } from "@/lib/currency";
import PriceDisplay from "@/components/PriceDisplay";

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
    async function loadProducts() {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
        ]);

        const [productsResult, categoriesResult] = await Promise.all([
          productsResponse.json(),
          categoriesResponse.json(),
        ]);

        if (!productsResponse.ok || !productsResult?.success) {
          throw new Error(productsResult?.message || "تعذر تحميل المنتجات.");
        }

        if (!categoriesResponse.ok || !categoriesResult?.success) {
          throw new Error(categoriesResult?.message || "تعذر تحميل التصنيفات.");
        }

        if (mounted) {
          setProducts(productsResult.data || []);
          setCategories(categoriesResult.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "حدث خطأ أثناء تحميل المنتجات.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") || "");
    setSelectedCategoryId(params.get("categoryId") || "");
  }, []);

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter((item) => {
      const matchesCategory = !selectedCategoryId || item.categoryId === selectedCategoryId;
      const matchesSearch =
        !search ||
        item.name?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategoryId, query]);

  const bestSellingProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => Number(b.ratingCount || 0) - Number(a.ratingCount || 0));
  }, [filteredProducts]);

  const productsByCategory = useMemo(() => {
    return categories
      .map((category) => {
        const items = bestSellingProducts.filter((product) => product.categoryId === category.id).slice(0, 3);
        return { category, items };
      })
      .filter((entry) => entry.items.length > 0);
  }, [categories, bestSellingProducts]);

  const topGalleryItems = useMemo(() => {
    const productItems = products
      .filter((item) => Boolean(item.image))
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        title: item.name,
        image: item.image,
        href: `/shop/products/${item.id}`,
      }));

    return productItems;
  }, [products]);

  async function addToCart(productId) {
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
        body: JSON.stringify({ productId, quantity: 1 }),
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
    <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="shop-section-card animate-fade-up overflow-hidden rounded-3xl p-4 md:p-6">
        {topGalleryItems.length === 0 ? (
          <div className="min-h-24 rounded-2xl bg-zinc-100" />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 md:text-xl">مختارات المتجر</h2>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700">اضغط على أي صورة لعرض المنتج</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {topGalleryItems.slice(0, 4).map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className="group relative min-h-40 overflow-hidden rounded-2xl border border-rose-100 text-right md:min-h-52"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 right-0 left-0 p-3 text-white">
                    <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                    <p className="text-[11px] text-white/75">#{index + 1} في المختارات</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {message ? <p className="animate-fade-up mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="animate-fade-up mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="shop-product-card overflow-hidden rounded-2xl p-3">
              <div className="animate-shimmer h-64 w-full rounded-xl" />
              <div className="mt-3 space-y-2">
                <div className="animate-shimmer h-4 w-3/4 rounded" />
                <div className="animate-shimmer h-3 w-1/2 rounded" />
                <div className="animate-shimmer h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <p className="text-sm text-zinc-500">لا توجد منتجات مطابقة.</p>
      ) : (
        <div className="space-y-7">
          {productsByCategory.map(({ category, items }, categoryIndex) => (
            <div key={category.id} className="space-y-3">
              <h2 className="inline-flex items-center rounded-full bg-[#ffe6ee] px-4 py-1.5 text-base font-bold text-rose-800 md:text-lg">{category.name}</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {items.map((product, index) => (
                  <article
                    key={product.id}
                    onClick={() => router.push(`/shop/products/${product.id}`)}
                    className="shop-product-card group animate-fade-up flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-1"
                    style={{ animationDelay: `${140 + (categoryIndex * 3 + index) * 70}ms` }}
                  >
                    <div className="relative w-full overflow-hidden bg-rose-50">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                        />
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
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => router.push(`/shop/category/${encodeURIComponent(category.slug || category.id)}`)}
                  className="inline-flex items-center justify-center gap-1 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  <span>عرض الكل</span>
                  <span aria-hidden="true">←</span>
                </button>
              </div>
            </div>
          ))}
          {productsByCategory.length === 0 ? (
            <p className="text-sm text-zinc-500">لا توجد منتجات مطابقة.</p>
          ) : null}
        </div>
      )}

    </section>
  );
}
