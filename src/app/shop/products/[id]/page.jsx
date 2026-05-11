"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CURRENCY_EVENT, getCurrencySettings } from "@/lib/currency";
import PriceDisplay from "@/components/PriceDisplay";

function Stars({ count = 5 }) {
  return <span className="text-amber-500">{"★".repeat(count)}</span>;
}

function RatingStars({ value, onChange, disabled = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className={`text-2xl leading-none transition ${
            star <= value ? "text-amber-500" : "text-zinc-300"
          } ${disabled ? "cursor-not-allowed opacity-70" : "hover:scale-110"}`}
          aria-label={`Rate ${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
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
    async function loadData() {
      try {
        const token = localStorage.getItem("customer_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const [productRes, productsRes] = await Promise.all([
          fetch(`/api/products/${params.id}`, { headers }),
          fetch("/api/products"),
        ]);
        const [productResult, productsResult] = await Promise.all([
          productRes.json(),
          productsRes.json(),
        ]);

        if (!productRes.ok || !productResult?.success) {
          throw new Error(productResult?.message || "تعذر تحميل المنتج.");
        }
        if (!productsRes.ok || !productsResult?.success) {
          throw new Error(productsResult?.message || "تعذر تحميل المنتجات.");
        }

        if (!mounted) return;
        setProduct(productResult.data);
        setAllProducts(productsResult.data || []);
        setReviews(productResult.reviews || []);
        const variants = Array.isArray(productResult.data?.variants)
          ? productResult.data.variants.filter((variant) => variant.isActive)
          : [];
        const firstVariant = variants[0];
        setSelectedColor(firstVariant?.color || productResult.data?.colors?.[0] || "");
        setSelectedSize(firstVariant?.size || productResult.data?.sizes?.[0] || "");
        setSelectedImage(firstVariant?.image || productResult.data?.image || "");
        setUserRating(productResult.data?.myRating?.rating || 0);
        setUserReview(productResult.data?.myRating?.review || "");
      } catch (err) {
        if (mounted) setError(err.message || "حدث خطأ أثناء التحميل.");
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  const relatedProducts = useMemo(
    () =>
      allProducts
        .filter((p) => p.id !== product?.id && p.categoryId === product?.categoryId)
        .slice(0, 5),
    [allProducts, product],
  );

  const activeVariants = useMemo(
    () => (Array.isArray(product?.variants) ? product.variants.filter((variant) => variant.isActive) : []),
    [product],
  );

  const availableSizesForColor = useMemo(() => {
    if (activeVariants.length === 0) {
      return product?.sizes || [];
    }
    return [
      ...new Set(
        activeVariants
          .filter((variant) => variant.color === selectedColor)
          .filter((variant) => variant.stock > 0)
          .map((variant) => variant.size),
      ),
    ];
  }, [activeVariants, product, selectedColor]);

  const selectedVariant = useMemo(
    () =>
      activeVariants.find(
        (variant) => variant.color === selectedColor && variant.size === selectedSize,
      ) || null,
    [activeVariants, selectedColor, selectedSize],
  );

  const hasColorOptions = useMemo(() => {
    if (activeVariants.length > 0) {
      return [...new Set(activeVariants.map((variant) => variant.color).filter(Boolean))].length > 0;
    }
    return Array.isArray(product?.colors) && product.colors.length > 0;
  }, [activeVariants, product]);

  const hasSizeOptions = useMemo(() => {
    if (activeVariants.length > 0) {
      return availableSizesForColor.length > 0;
    }
    return Array.isArray(product?.sizes) && product.sizes.length > 0;
  }, [activeVariants, availableSizesForColor, product]);

  const imageByColor = useMemo(() => {
    const map = new Map();
    for (const variant of activeVariants) {
      if (!map.has(variant.color) && variant.image) {
        map.set(variant.color, variant.image);
      }
    }
    return map;
  }, [activeVariants]);

  const galleryImages = useMemo(() => {
    const base = Array.isArray(product?.images) ? product.images : [];
    const byColor = [...imageByColor.values()];
    return [...new Set([selectedImage, ...byColor, ...base, product?.image].filter(Boolean))];
  }, [imageByColor, product, selectedImage]);

  async function addToCart() {
    setError("");
    setMessage("");

    const hasVariantData = activeVariants.length > 0;
    if (hasVariantData && !selectedColor) {
      setError("اختر اللون أولاً.");
      return;
    }
    if (hasVariantData && !selectedSize) {
      setError("اختر المقاس أولاً.");
      return;
    }
    if (hasVariantData && !selectedVariant) {
      setError("اللون/المقاس المحدد غير متاح.");
      return;
    }

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
        body: JSON.stringify({
          productId: product.id,
          quantity: qty,
          color: selectedColor || null,
          size: selectedSize || null,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "تعذر إضافة المنتج.");
      }
      setMessage("تمت إضافة المنتج إلى السلة.");
      window.dispatchEvent(new Event("customer-cart-updated"));
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء الإضافة.");
    }
  }

  async function submitRating() {
    setError("");
    setMessage("");

    if (!userRating || userRating < 1 || userRating > 5) {
      setError("اختر تقييماً من 1 إلى 5 نجوم.");
      return;
    }

    const token = localStorage.getItem("customer_token");
    if (!token) {
      router.push("/shop/auth");
      return;
    }

    setIsSubmittingRating(true);

    try {
      const response = await fetch(`/api/products/${product.id}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: userRating,
          review: userReview,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "تعذر حفظ التقييم.");
      }

      setMessage("تم حفظ تقييمك بنجاح.");
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              ratingAverage: result.data.ratingAverage,
              ratingCount: result.data.ratingCount,
              myRating: {
                rating: result.data.rating,
                review: result.data.review || "",
              },
            }
          : prev,
      );
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء حفظ التقييم.");
    } finally {
      setIsSubmittingRating(false);
    }
  }

  async function shareProduct() {
    setError("");
    setMessage("");
    const shareUrl = window.location.href;
    const shareData = {
      title: product?.name || "Product",
      text: `شاهد هذا المنتج: ${product?.name || ""}`.trim(),
      url: shareUrl,
    };

    try {
      setIsSharing(true);
      if (navigator.share) {
        await navigator.share(shareData);
        setMessage("تم فتح نافذة المشاركة. يمكنك اختيار التطبيق المناسب.");
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setMessage("تم نسخ رابط المنتج. يمكنك الآن لصقه ومشاركته.");
    } catch {
      setError("تعذر مشاركة المنتج.");
    } finally {
      setIsSharing(false);
    }
  }

  if (!product) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <p className="text-sm text-zinc-500">جاري التحميل...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 md:px-6">
      <div className="text-xs text-zinc-500">الرئيسية &gt; نساء &gt; {product.category?.name || "منتجات"} &gt; {product.name}</div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
            {selectedImage || product.image ? (
              <img
                src={selectedImage || product.image}
                alt={product.name}
                className="h-auto w-full bg-white object-contain"
              />
            ) : (
              <div className="flex h-[520px] w-full items-center justify-center text-sm text-zinc-500">
                لا توجد صورة
              </div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {galleryImages.slice(0, 6).map((image, idx) => (
                <button
                  key={`${image}-${idx}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className="h-20 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100"
                >
                  <img src={image} alt={`thumb-${idx + 1}`} className="h-full w-full bg-white object-contain p-1" />
                </button>
              ))}
          </div>
        </div>

        <div className="space-y-5">
          <p className="text-xs tracking-[0.16em] text-zinc-500">مجموعة ترندوا</p>
          <h1 className="text-4xl font-semibold leading-tight text-zinc-900">{product.name}</h1>
          <div className="flex items-center gap-4">
            {product.compareAtPrice !== null ? (
              <>
                <PriceDisplay value={product.compareAtPrice} currency={currency} usdToSypRate={usdToSypRate} className="text-xl text-zinc-500 line-through" />
                <PriceDisplay value={product.price} currency={currency} usdToSypRate={usdToSypRate} className="text-3xl font-semibold" />
              </>
            ) : (
              <PriceDisplay value={product.price} currency={currency} usdToSypRate={usdToSypRate} className="text-3xl font-semibold" />
            )}
            <span className="text-sm text-zinc-500">{product.soldCount || 0} تم بيعها</span>
            <span className="text-sm font-semibold text-zinc-800">
              <Stars count={Math.round(product.ratingAverage || 0)} /> {(product.ratingAverage || 0).toFixed(1)}
            </span>
            <span className="text-sm text-zinc-500">({product.ratingCount || 0} تقييم)</span>
          </div>

          <div>
            <p className="text-sm font-semibold">الوصف:</p>
            <p className="mt-1 text-sm leading-7 text-zinc-600">
              {product.description || "منتج بتصميم عصري وخامة ممتازة مناسب للاستخدام اليومي."}
            </p>
          </div>

          {hasColorOptions ? (
            <div>
              <p className="mb-2 text-sm font-semibold">الألوان المتاحة</p>
              <div className="flex flex-wrap gap-2">
                {(activeVariants.length > 0
                  ? [...new Set(activeVariants.map((variant) => variant.color))]
                  : (product.colors || [])
                ).map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => {
                      setSelectedColor(color);
                      const nextSize = activeVariants.find((variant) => variant.color === color && variant.stock > 0)?.size || "";
                      setSelectedSize(nextSize);
                      setSelectedImage(imageByColor.get(color) || product.image || "");
                      setQty(1);
                    }}
                    className={`h-9 w-9 rounded-full border-2 ${
                      selectedColor === color
                        ? "border-zinc-900 ring-2 ring-zinc-300"
                        : "border-zinc-300"
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    <span className="sr-only">{color}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {hasSizeOptions ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm">المقاس: <span className="font-semibold">{selectedSize || "-"}</span></p>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizesForColor.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-md border px-4 py-2 text-sm ${
                      selectedSize === size ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-700"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {!hasColorOptions && !hasSizeOptions ? (
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              هذا المنتج بدون خيارات لون أو مقاس.
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <div className="flex h-11 items-center overflow-hidden rounded-lg border border-zinc-300">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-full w-10 text-xl">−</button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(selectedVariant?.stock || product.stock || 99, q + 1))}
                className="h-full w-10 text-xl"
              >
                +
              </button>
            </div>
            <button onClick={addToCart} className="flex-1 rounded-md bg-zinc-900 px-4 py-3 text-sm font-semibold text-white">
              أضف إلى السلة
            </button>
            <button
              type="button"
              onClick={shareProduct}
              disabled={isSharing}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M12 16V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="m8.5 8.5 3.5-3.5 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 13.5V17a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span>{isSharing ? "جاري المشاركة..." : "مشاركة المنتج"}</span>
            </button>
          </div>

          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">منتجات ذات صلة</h2>
          {product?.category?.slug ? (
            <Link
              href={`/shop/category/${encodeURIComponent(product.category.slug)}`}
              className="text-sm font-semibold text-rose-700 transition hover:text-rose-600"
            >
              عرض كل منتجات التصنيف ←
            </Link>
          ) : null}
        </div>
        {relatedProducts.length === 0 ? (
          <p className="text-sm text-zinc-500">لا توجد منتجات ذات صلة حالياً.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {relatedProducts.map((item) => (
              <Link
                key={item.id}
                href={`/shop/products/${item.id}`}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-48 overflow-hidden bg-zinc-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">لا توجد صورة</div>
                  )}
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[11px] font-semibold ${
                      Number(item.stock || 0) > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {Number(item.stock || 0) > 0 ? "متوفر" : "نفد المخزون"}
                  </span>
                </div>
                <div className="space-y-2 p-3">
                  <p className="line-clamp-2 min-h-10 text-sm font-semibold text-zinc-900">{item.name}</p>
                  <div className="space-y-1 text-xs">
                    <PriceDisplay value={item.price} currency={currency} usdToSypRate={usdToSypRate} className="font-semibold text-zinc-900" compact />
                    <span className="block text-zinc-500">{Number(item.soldCount || 0)} مباع</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-500">★ {(item.ratingAverage || 0).toFixed(1)}</span>
                    <span className="text-zinc-500">({item.ratingCount || 0} تقييم)</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold">تقييمات المنتج</h2>
          <p className="text-sm text-zinc-500">شاركنا رأيك وساعد الآخرين بالاختيار</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-center">
            <p className="text-4xl font-semibold tracking-tight">{(product.ratingAverage || 0).toFixed(1)}</p>
            <div className="mt-2 flex items-center justify-center">
              <Stars count={Math.round(product.ratingAverage || 0)} />
            </div>
            <p className="mt-2 text-sm text-zinc-500">بناءً على {product.ratingCount || 0} تقييم</p>
          </div>

          <div className="rounded-xl border border-zinc-200 p-5">
            <p className="text-sm font-semibold text-zinc-800">قيّم هذا المنتج</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <RatingStars
                value={userRating}
                onChange={setUserRating}
                disabled={isSubmittingRating}
              />
              <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                {userRating > 0 ? `${userRating} / 5` : "اختر التقييم"}
              </span>
            </div>

            <textarea
              value={userReview}
              onChange={(e) => setUserReview(e.target.value)}
              placeholder="اكتب تعليقك (اختياري)"
              className="mt-4 min-h-28 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2"
            />
            <button
              type="button"
              disabled={isSubmittingRating}
              onClick={submitRating}
              className="mt-3 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60"
            >
              {isSubmittingRating ? "جاري الحفظ..." : "حفظ التقييم"}
            </button>
          </div>
        </div>

        <div className="space-y-4 border-t border-zinc-200 pt-5">
          {reviews.length === 0 ? (
            <p className="text-sm text-zinc-500">لا توجد تقييمات بعد.</p>
          ) : reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-zinc-200 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm"><Stars count={review.rating} /></p>
                <span className="text-xs text-zinc-500">
                  {new Date(review.createdAt).toLocaleDateString("ar-EG")}
                </span>
              </div>
              {review.review ? <p className="mt-2 text-sm font-medium">{review.review}</p> : null}
              <p className="mt-2 text-xs text-zinc-500">{review.author}</p>
            </article>
          ))}
        </div>
      </section>

    </section>
  );
}
