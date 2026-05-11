"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ShopAccountPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function translateError(raw) {
    const text = String(raw || "").trim();
    const map = {
      Unauthorized: "يجب تسجيل الدخول أولاً.",
      "Unauthorized.": "يجب تسجيل الدخول أولاً.",
      "User not found.": "الحساب غير موجود.",
      "An account with this email already exists.": "يوجد حساب مسجل بهذا البريد الإلكتروني.",
      "First name, last name, phone, and email are required.": "الاسم الأول واسم العائلة والهاتف والبريد الإلكتروني مطلوبة.",
      "Unable to load account.": "تعذر تحميل بيانات الحساب.",
      "Unable to update account.": "تعذر تحديث بيانات الحساب.",
    };
    return map[text] || "حدث خطأ غير متوقع.";
  }

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      const token = localStorage.getItem("customer_token");
      if (!token) {
        router.replace("/shop/auth");
        return;
      }

      try {
        const response = await fetch("/api/account", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("customer_token");
          localStorage.removeItem("customer_user");
          window.dispatchEvent(new Event("customer-auth-updated"));
          router.replace("/shop/auth");
          return;
        }

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Unable to load account.");
        }

        if (!mounted) {
          return;
        }

        const data = result.data || {};
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
      } catch (err) {
        if (mounted) {
          setError(translateError(err.message));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadAccount();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    const token = localStorage.getItem("customer_token");
    if (!token) {
      setIsSaving(false);
      router.replace("/shop/auth");
      return;
    }

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, lastName, phone, email }),
      });
      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("customer_token");
        localStorage.removeItem("customer_user");
        window.dispatchEvent(new Event("customer-auth-updated"));
        router.replace("/shop/auth");
        return;
      }

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Unable to update account.");
      }

      const updatedUser = result.data || {};
      localStorage.setItem("customer_user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("customer-auth-updated"));
      setMessage("تم تحديث بياناتك بنجاح.");
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative border-b border-zinc-200 bg-[radial-gradient(circle_at_top_right,#ffe4e6,transparent_40%),linear-gradient(135deg,#fafafa,#f4f4f5)] px-5 py-6 md:px-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-rose-700">MY ACCOUNT</p>
              <h1 className="mt-2 text-2xl font-bold text-zinc-900 md:text-3xl">حسابي</h1>
              <p className="mt-2 text-sm text-zinc-600">تحكم ببياناتك الشخصية وتابع طلباتك بسهولة.</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/shop/orders")}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
            >
              <span>طلباتي</span>
              <span aria-hidden="true">←</span>
            </button>
          </div>
        </div>

        <div className="p-5 md:p-7">
          {isLoading ? <p className="text-sm text-zinc-500">جاري تحميل البيانات...</p> : null}

          {!isLoading ? (
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wide text-zinc-600">الاسم الأول</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none ring-rose-500 transition focus:bg-white focus:ring-2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wide text-zinc-600">اسم العائلة</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none ring-rose-500 transition focus:bg-white focus:ring-2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wide text-zinc-600">رقم الهاتف</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none ring-rose-500 transition focus:bg-white focus:ring-2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wide text-zinc-600">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none ring-rose-500 transition focus:bg-white focus:ring-2"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
                >
                  {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
                <span className="text-xs text-zinc-500">يتم تحديث البيانات فور الحفظ.</span>
              </div>

              {message ? (
                <p className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
