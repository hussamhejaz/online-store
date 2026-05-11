"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success || result?.user?.role !== "ADMIN") {
        setError(result?.message || "تعذر تسجيل الدخول.");
        return;
      }

      localStorage.setItem("admin_token", result.token);
      localStorage.setItem("admin_user", JSON.stringify(result.user));
      router.push("/dashboard");
    } catch {
      setError("حدث خطأ غير متوقع. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center p-6 md:p-10">
        <section className="grid w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl lg:grid-cols-2">
          <div className="relative bg-zinc-950 p-8 text-zinc-100 md:p-10">
            <div className="absolute -right-20 top-10 h-56 w-56 rounded-full bg-rose-600/20 blur-3xl" />
            <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-rose-500/15 blur-3xl" />

            <p className="relative text-sm font-medium tracking-[0.2em] text-rose-400">
              TRENDWA
            </p>
            <h1 className="relative mt-5 text-3xl font-semibold leading-tight md:text-4xl">
              دخول احترافي للوحة التحكم
            </h1>
            <p className="relative mt-4 max-w-md text-sm leading-7 text-zinc-300">
              تابع المنتجات والتصنيفات والطلبات من مكان واحد بسرعة وتنظيم.
            </p>

          </div>

          <div className="flex items-center p-7 md:p-10">
            <form className="w-full space-y-5" onSubmit={onSubmit}>
              <div>
                <p className="text-sm font-medium text-zinc-500">لوحة الإدارة</p>
                <h2 className="mt-2 text-2xl font-semibold">تسجيل الدخول</h2>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-zinc-700">
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@trendwa.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none ring-rose-500 transition focus:ring-2"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                  كلمة المرور
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="اكتب كلمة المرور"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none ring-rose-500 transition focus:ring-2"
                />
              </div>

              {error ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "جاري التحقق..." : "دخول إلى لوحة التحكم"}
              </button>
            </form>
          </div>
        </section> 
      </div>
    </main>
  );
}
