"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const initialForm = {
  name: "",
  slug: "",
  description: "",
  image: "",
  sortOrder: 0,
};

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function fetchCategories() {
    const token = localStorage.getItem("admin_token");
    const userRaw = localStorage.getItem("admin_user");
    const user = userRaw ? JSON.parse(userRaw) : null;

    if (!token || user?.role !== "ADMIN") {
      router.replace("/login");
      return;
    }

    const response = await fetch("/api/categories", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      router.replace("/login");
      return;
    }

    const result = await response.json();

    if (!response.ok || !result?.success) {
      throw new Error(result?.message || "تعذر تحميل التصنيفات.");
    }

    setCategories(result.data || []);
  }

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        await fetchCategories();
      } catch (err) {
        if (mounted) {
          setError(err.message || "تعذر تحميل التصنيفات.");
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

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        editingId ? `/api/categories/${editingId}` : "/api/categories",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name,
            slug: form.slug,
            description: form.description,
            image: form.image,
            sortOrder: Number(form.sortOrder || 0),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "فشل حفظ التصنيف.");
      }

      setMessage(editingId ? "تم تحديث التصنيف بنجاح." : "تم إنشاء التصنيف بنجاح.");
      setForm(initialForm);
      setEditingId(null);
      await fetchCategories();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء الحفظ.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(category) {
    setEditingId(category.id);
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      image: category.image || "",
      sortOrder: Number(category.sortOrder || 0),
    });
    setMessage("");
    setError("");
  }

  async function handleDelete(categoryId) {
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "تعذر حذف التصنيف.");
      }

      setMessage("تم حذف التصنيف.");
      await fetchCategories();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء الحذف.");
    }
  }

  return (
    <main dir="rtl" className="min-h-screen p-6 md:p-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">لوحة الإدارة</p>
          <h1 className="mt-1 text-2xl font-semibold">إدارة التصنيفات</h1>
          <p className="mt-2 text-sm text-zinc-500">
            إضافة وتعديل وحذف التصنيفات باستخدام واجهات API الحالية.
          </p>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            {editingId ? "تعديل تصنيف" : "إضافة تصنيف جديد"}
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2"
              placeholder="اسم التصنيف"
            />
            <input
              value={form.slug}
              onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
              className="rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2"
              placeholder="slug (اختياري)"
            />
            <input
              value={form.image}
              onChange={(e) => setForm((s) => ({ ...s, image: e.target.value }))}
              className="rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2 md:col-span-2"
              placeholder="رابط الصورة (اختياري)"
            />
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((s) => ({ ...s, sortOrder: e.target.value }))}
              className="rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2"
              placeholder="ترتيب الظهور (0, 1, 2...)"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              className="min-h-24 rounded-md border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-rose-500 focus:ring-2 md:col-span-2"
              placeholder="وصف التصنيف (اختياري)"
            />
            <div className="flex gap-2 md:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-60"
              >
                {isSaving ? "جاري الحفظ..." : editingId ? "حفظ التعديل" : "إضافة التصنيف"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(initialForm);
                  }}
                  className="rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300"
                >
                  إلغاء
                </button>
              ) : null}
            </div>
          </form>
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">قائمة التصنيفات</h2>
            <Link href="/dashboard" className="text-sm text-rose-600 hover:underline">
              العودة للرئيسية
            </Link>
          </div>

          {isLoading ? (
            <p className="text-sm text-zinc-500">جاري التحميل...</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-zinc-500">لا توجد تصنيفات بعد.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500">
                    <th className="px-2 py-3 font-medium">الاسم</th>
                    <th className="px-2 py-3 font-medium">الرابط</th>
                    <th className="px-2 py-3 font-medium">الترتيب</th>
                    <th className="px-2 py-3 font-medium">الوصف</th>
                    <th className="px-2 py-3 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-zinc-100">
                      <td className="px-2 py-3">{category.name}</td>
                      <td className="px-2 py-3 text-zinc-500">{category.slug}</td>
                      <td className="px-2 py-3 text-zinc-500">{Number(category.sortOrder || 0)}</td>
                      <td className="px-2 py-3 text-zinc-500">
                        {category.description || "-"}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(category)}
                            className="rounded bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-300"
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(category.id)}
                            className="rounded bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-200"
                          >
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
