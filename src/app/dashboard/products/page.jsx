"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCY_EVENT, getCurrencySettings } from "@/lib/currency";
import PriceDisplay from "@/components/PriceDisplay";

const initialForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  image: "",
  images: [],
  productType: "VARIANT",
  colorGroups: [{ color: "", image: "", sizes: [{ size: "", stock: "0" }] }],
  categoryId: "",
  isActive: true,
};
const MAX_GALLERY_IMAGES = 6;

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [extraImageInput, setExtraImageInput] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [usdToSypRate, setUsdToSypRate] = useState(10000);

  function flattenGroupsToVariants(groups) {
    return groups.flatMap((group) =>
      (group.sizes || [])
        .map((entry) => ({
          color: String(group.color || "").trim(),
          size: String(entry.size || "").trim(),
          stock: Number(entry.stock || 0),
          image: String(group.image || "").trim() || null,
        }))
        .filter((variant) => variant.color && variant.size),
    );
  }

  function variantsToColorGroups(variants = []) {
    const groups = new Map();
    for (const variant of variants) {
      const color = String(variant.color || "").trim();
      const size = String(variant.size || "").trim();
      if (!color || !size) {
        continue;
      }
      if (!groups.has(color)) {
        groups.set(color, { color, image: variant.image || "", sizes: [] });
      }
      groups.get(color).sizes.push({ size, stock: String(variant.stock ?? 0) });
    }
    return groups.size > 0 ? [...groups.values()] : [{ color: "", image: "", sizes: [{ size: "", stock: "0" }] }];
  }

  async function getTokenOrRedirect() {
    const token = localStorage.getItem("admin_token");
    const userRaw = localStorage.getItem("admin_user");
    const user = userRaw ? JSON.parse(userRaw) : null;

    if (!token || user?.role !== "ADMIN") {
      router.replace("/login");
      return null;
    }

    return token;
  }

  async function fetchData() {
    const token = await getTokenOrRedirect();
    if (!token) {
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const [productsRes, categoriesRes] = await Promise.all([
      fetch("/api/products?includeInactive=true", { headers }),
      fetch("/api/categories", { headers }),
    ]);

    if ([productsRes, categoriesRes].some((res) => res.status === 401 || res.status === 403)) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      router.replace("/login");
      return;
    }

    const [productsResult, categoriesResult] = await Promise.all([
      productsRes.json(),
      categoriesRes.json(),
    ]);

    if (!productsRes.ok || !productsResult?.success) {
      throw new Error(productsResult?.message || "تعذر تحميل المنتجات.");
    }

    if (!categoriesRes.ok || !categoriesResult?.success) {
      throw new Error(categoriesResult?.message || "تعذر تحميل التصنيفات.");
    }

    setProducts(productsResult.data || []);
    setCategories(categoriesResult.data || []);
  }

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
    async function run() {
      try {
        await fetchData();
      } catch (err) {
        if (mounted) {
          setError(err.message || "حدث خطأ أثناء تحميل البيانات.");
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

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      price: product.price ?? "",
      compareAtPrice: product.compareAtPrice ?? "",
      stock: product.stock ?? 0,
      image: product.image || "",
      images: Array.isArray(product.images) ? product.images : [],
      productType: Array.isArray(product.variants) && product.variants.length > 0 ? "VARIANT" : "SIMPLE",
      colorGroups: variantsToColorGroups(product.variants || []),
      categoryId: product.categoryId || "",
      isActive: product.isActive,
    });
    setError("");
    setMessage("");
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setMessage("");
    setIsUploadingImage(true);

    try {
      const token = await getTokenOrRedirect();
      if (!token) {
        return;
      }

      const payload = new FormData();
      payload.append("file", file);

      const response = await fetch("/api/uploads/products", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "تعذر رفع الصورة.");
      }

      setForm((s) => ({ ...s, image: result.data?.imageUrl || "" }));
      setMessage("تم رفع الصورة بنجاح.");
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء رفع الصورة.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleMultipleImagesUpload(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    setError("");
    setMessage("");
    setIsUploadingImage(true);

    try {
      const remainingSlots = MAX_GALLERY_IMAGES - form.images.length;
      if (remainingSlots <= 0) {
        setError(`الحد الأقصى لصور الجاليري هو ${MAX_GALLERY_IMAGES} صور.`);
        return;
      }
      const token = await getTokenOrRedirect();
      if (!token) {
        return;
      }

      const uploaded = [];
      for (const file of files.slice(0, remainingSlots)) {
        const payload = new FormData();
        payload.append("file", file);
        const response = await fetch("/api/uploads/products", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: payload,
        });
        const result = await response.json();
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "تعذر رفع بعض الصور.");
        }
        if (result.data?.imageUrl) {
          uploaded.push(result.data.imageUrl);
        }
      }

      setForm((s) => ({ ...s, images: [...s.images, ...uploaded].slice(0, MAX_GALLERY_IMAGES) }));
      setMessage("تم رفع الصور بنجاح.");
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء رفع الصور.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  }

  function addVariantRow() {
    setForm((s) => ({
      ...s,
      colorGroups: [...s.colorGroups, { color: "", image: "", sizes: [{ size: "", stock: "0" }] }],
    }));
  }

  function removeVariantRow(index) {
    setForm((s) => ({
      ...s,
      colorGroups: s.colorGroups.filter((_, i) => i !== index),
    }));
  }

  function updateVariantRow(index, key, value) {
    setForm((s) => ({
      ...s,
      colorGroups: s.colorGroups.map((group, i) => (i === index ? { ...group, [key]: value } : group)),
    }));
  }

  function addSizeRow(groupIndex) {
    setForm((s) => ({
      ...s,
      colorGroups: s.colorGroups.map((group, i) =>
        i === groupIndex ? { ...group, sizes: [...group.sizes, { size: "", stock: "0" }] } : group,
      ),
    }));
  }

  function removeSizeRow(groupIndex, sizeIndex) {
    setForm((s) => ({
      ...s,
      colorGroups: s.colorGroups.map((group, i) =>
        i === groupIndex
          ? { ...group, sizes: group.sizes.filter((_, idx) => idx !== sizeIndex) }
          : group,
      ),
    }));
  }

  function updateSizeRow(groupIndex, sizeIndex, key, value) {
    setForm((s) => ({
      ...s,
      colorGroups: s.colorGroups.map((group, i) =>
        i === groupIndex
          ? {
              ...group,
              sizes: group.sizes.map((entry, idx) =>
                idx === sizeIndex ? { ...entry, [key]: value } : entry,
              ),
            }
          : group,
      ),
    }));
  }

  function addExtraImageUrl() {
    const url = extraImageInput.trim();
    if (!url) {
      return;
    }
    if (form.images.length >= MAX_GALLERY_IMAGES) {
      setError(`الحد الأقصى لصور الجاليري هو ${MAX_GALLERY_IMAGES} صور.`);
      return;
    }
    setForm((s) => ({ ...s, images: [...s.images, url] }));
    setExtraImageInput("");
  }

  function removeExtraImage(index) {
    setForm((s) => ({ ...s, images: s.images.filter((_, i) => i !== index) }));
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editingId) {
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const token = await getTokenOrRedirect();
      if (!token) {
        return;
      }

      const response = await fetch(`/api/products/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description,
          price: form.price,
          compareAtPrice: form.compareAtPrice || null,
          stock: form.stock,
          image: form.image,
          images: form.images.slice(0, MAX_GALLERY_IMAGES),
          variants: form.productType === "VARIANT" ? flattenGroupsToVariants(form.colorGroups) : [],
          categoryId: form.categoryId,
          isActive: form.isActive,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "فشل تحديث المنتج.");
      }

      setMessage("تم تحديث المنتج بنجاح.");
      setEditingId(null);
      setForm(initialForm);
      await fetchData();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء التحديث.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(productId) {
    const confirmed = window.confirm("هل تريد حذف هذا المنتج؟");
    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const token = await getTokenOrRedirect();
      if (!token) {
        return;
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "تعذر حذف المنتج.");
      }

      setMessage("تم حذف المنتج بنجاح.");
      if (editingId === productId) {
        setEditingId(null);
        setForm(initialForm);
      }
      await fetchData();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء حذف المنتج.");
    }
  }

  return (
    <main dir="rtl" className="min-h-screen p-6 md:p-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">لوحة الإدارة</p>
              <h1 className="mt-1 text-2xl font-semibold">إدارة المنتجات</h1>
            </div>
            <Link
              href="/dashboard/products/new"
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
            >
              إضافة منتج
            </Link>
          </div>
        </header>

        {editingId ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">تعديل المنتج</h2>
            <form onSubmit={submitEdit} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium text-zinc-800">نوع المنتج</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((s) => ({ ...s, productType: "SIMPLE" }))}
                    className={`rounded-md px-3 py-2 text-xs font-semibold ${
                      form.productType === "SIMPLE"
                        ? "bg-rose-600 text-white"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    بسيط (بدون لون/مقاس)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((s) => ({ ...s, productType: "VARIANT" }))}
                    className={`rounded-md px-3 py-2 text-xs font-semibold ${
                      form.productType === "VARIANT"
                        ? "bg-rose-600 text-white"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    متغير (ألوان/مقاسات)
                  </button>
                </div>
              </div>
              <input className="rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2" placeholder="اسم المنتج" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              <input className="rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2" placeholder="slug" value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} />
              <input className="rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2" placeholder="السعر" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} />
              <input className="rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2" placeholder="سعر المقارنة (قبل الخصم)" type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm((s) => ({ ...s, compareAtPrice: e.target.value }))} />
              <input className="rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2" placeholder="المخزون" type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm((s) => ({ ...s, stock: e.target.value }))} />
              <select className="rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2" value={form.categoryId} onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value }))}>
                <option value="">اختر التصنيف</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="grid gap-2 md:col-span-2">
                <input className="rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2" placeholder="رابط الصورة" value={form.image} onChange={(e) => setForm((s) => ({ ...s, image: e.target.value }))} />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm file:ml-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-white"
                />
                {isUploadingImage ? <p className="text-xs text-zinc-500">جاري رفع الصورة...</p> : null}
                {form.image ? (
                  <img src={form.image} alt="معاينة الصورة" className="h-28 w-28 rounded-lg border border-zinc-200 object-cover" />
                ) : null}
              </div>
              <div className="grid gap-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-800">صور الجاليري</p>
                  <p className="text-xs text-zinc-500">{form.images.length}/{MAX_GALLERY_IMAGES}</p>
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2"
                    placeholder="ضع رابط صورة ثم اضغط إضافة"
                    value={extraImageInput}
                    onChange={(e) => setExtraImageInput(e.target.value)}
                  />
                  <button type="button" onClick={addExtraImageUrl} disabled={form.images.length >= MAX_GALLERY_IMAGES} className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50">
                    إضافة
                  </button>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  onChange={handleMultipleImagesUpload}
                  disabled={form.images.length >= MAX_GALLERY_IMAGES}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm file:ml-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-white disabled:opacity-50"
                />
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {form.images.map((img, index) => (
                    <div key={`${img}-${index}`} className="rounded-xl border border-zinc-200 bg-zinc-50 p-2">
                      <img src={img} alt={`extra-${index}`} className="h-24 w-full rounded-lg object-cover" />
                      <button type="button" onClick={() => removeExtraImage(index)} className="mt-2 w-full rounded bg-rose-100 px-2 py-1 text-xs text-rose-700">
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {form.productType === "VARIANT" ? (
              <div className="grid gap-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-800">الألوان والمقاسات</p>
                  <button type="button" onClick={addVariantRow} className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white">
                    إضافة لون
                  </button>
                </div>
                {form.colorGroups.map((group, index) => (
                  <div key={index} className="grid gap-2 rounded-md border border-zinc-200 p-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <input className="rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="اللون (مثال: Red أو #000)" value={group.color} onChange={(e) => updateVariantRow(index, "color", e.target.value)} />
                      <input className="rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="رابط صورة هذا اللون (اختياري)" value={group.image} onChange={(e) => updateVariantRow(index, "image", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      {(group.sizes || []).map((entry, sizeIndex) => (
                        <div key={sizeIndex} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                          <input className="rounded-md border border-zinc-300 px-3 py-2 text-sm" placeholder="المقاس (S/M/L...)" value={entry.size} onChange={(e) => updateSizeRow(index, sizeIndex, "size", e.target.value)} />
                          <input className="rounded-md border border-zinc-300 px-3 py-2 text-sm" type="number" min="0" placeholder="المخزون" value={entry.stock} onChange={(e) => updateSizeRow(index, sizeIndex, "stock", e.target.value)} />
                          <button type="button" onClick={() => removeSizeRow(index, sizeIndex)} className="rounded bg-rose-100 px-3 py-2 text-xs text-rose-700">
                            حذف
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addSizeRow(index)} className="rounded bg-zinc-200 px-3 py-2 text-xs text-zinc-800">
                        إضافة مقاس
                      </button>
                    </div>
                    <button type="button" onClick={() => removeVariantRow(index)} className="rounded bg-rose-100 px-3 py-2 text-xs text-rose-700">
                      حذف اللون
                    </button>
                  </div>
                ))}
              </div>
              ) : (
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 md:col-span-2">
                  هذا المنتج بسيط. سيتم الاعتماد على السعر والمخزون العام فقط بدون خيارات لون/مقاس.
                </div>
              )}
              <textarea className="min-h-24 rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2 md:col-span-2" placeholder="الوصف" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm text-zinc-700 md:col-span-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))} />
                المنتج مفعل
              </label>
            
              <div className="flex gap-2 md:col-span-2">
                <button disabled={isSaving} type="submit" className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-60">
                  {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
                <button type="button" onClick={() => { setEditingId(null); setForm(initialForm); }} className="rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300">
                  إلغاء
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">المنتجات المضافة</h2>
          {message ? <p className="mb-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}
          {isLoading ? (
            <p className="text-sm text-zinc-500">جاري التحميل...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-zinc-500">لا توجد منتجات بعد.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500">
                    <th className="px-2 py-3 font-medium">الاسم</th>
                    <th className="px-2 py-3 font-medium">التصنيف</th>
                    <th className="px-2 py-3 font-medium">السعر ({currency})</th>
                    <th className="px-2 py-3 font-medium">المخزون</th>
                    <th className="px-2 py-3 font-medium">الألوان / المقاسات</th>
                    <th className="px-2 py-3 font-medium">الحالة</th>
                    <th className="px-2 py-3 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-zinc-100">
                      <td className="px-2 py-3">{product.name}</td>
                      <td className="px-2 py-3 text-zinc-600">{product.category?.name || "-"}</td>
                      <td className="px-2 py-3 text-zinc-600"><PriceDisplay value={product.price} currency={currency} usdToSypRate={usdToSypRate} compact /></td>
                      <td className="px-2 py-3 text-zinc-600">{product.stock}</td>
                      <td className="px-2 py-3 text-zinc-600">
                        <div className="space-y-1 text-xs">
                          <p>{Array.isArray(product.colors) && product.colors.length > 0 ? product.colors.join("، ") : "-"}</p>
                          <p>{Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes.join("، ") : "-"}</p>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <span className={`rounded px-2 py-1 text-xs ${product.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-700"}`}>
                          {product.isActive ? "نشط" : "غير نشط"}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(product)} className="rounded bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-300">
                            تعديل
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="rounded bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-200">
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
