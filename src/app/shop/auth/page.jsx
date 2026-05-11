"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ShopAuthPage() {
  const router = useRouter();
  const SYRIA_CODE = "+963";
  const [mode, setMode] = useState("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (token) {
      router.replace("/shop");
    }
  }, [router]);

  function translateError(message) {
    const text = String(message || "").trim();
    const map = {
      "Email and password are required.": "البريد الإلكتروني وكلمة المرور مطلوبان.",
      "Name, email, and password are required.": "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة.",
      "First name, last name, phone, email, and password are required.":
        "الاسم الأول واسم العائلة ورقم الهاتف والبريد الإلكتروني وكلمة المرور مطلوبة.",
      "Password must be at least 8 characters.": "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
      "Invalid email or password.": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      "An account with this email already exists.": "يوجد حساب مسجل بهذا البريد الإلكتروني.",
      "Unable to log in.": "تعذر تسجيل الدخول.",
      "Unable to register user.": "تعذر إنشاء الحساب.",
      "Invalid JSON body.": "صيغة البيانات غير صحيحة.",
      "فشل العملية.": "فشل العملية.",
    };

    if (text.toLowerCase().includes("invalid email or password")) {
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }

    return map[text] || "حدث خطأ غير متوقع. حاول مرة أخرى.";
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email, password }
          : {
              firstName,
              lastName,
              phone: phone ? `${SYRIA_CODE}${phone.replace(/^0+/, "")}` : "",
              email,
              password,
            };
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(translateError(result?.message || "فشل العملية."));
      }
      localStorage.setItem("customer_token", result.token);
      localStorage.setItem("customer_user", JSON.stringify(result.user));
      window.dispatchEvent(new Event("customer-auth-updated"));
      router.push("/shop");
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="min-h-[calc(100vh-64px)] bg-zinc-100 px-3 py-5 sm:px-4 sm:py-8 md:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl sm:rounded-2xl lg:grid-cols-[1.05fr_1fr]">
          <aside className="relative hidden bg-zinc-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -left-8 top-10 h-36 w-36 rounded-full bg-rose-600/25 blur-3xl" />
            <div className="absolute bottom-10 right-0 h-44 w-44 rounded-full bg-rose-500/20 blur-3xl" />
            <div className="relative">
              <p className="text-sm tracking-[0.22em] text-rose-400">TRENDWA</p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight">
                {mode === "login" ? "مرحباً بعودتك" : "ابدأ حسابك الجديد"}
              </h1>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                {mode === "login"
                  ? "سجّل دخولك بسرعة وواصل تجربة تسوق أنيقة."
                  : "أنشئ حسابك خلال لحظات واستمتع بتجربة شراء أسهل."}
              </p>
            </div>
            <div className="relative rounded-lg border border-white/15 bg-white/5 p-4 text-xs text-zinc-300">
              حسابك يمنحك متابعة الطلبات، إدارة السلة، وعروض المنتجات بسهولة.
            </div>
          </aside>

          <div className="p-4 sm:p-6 md:p-8">
            <div className="mb-5">
              <p className="text-xs tracking-[0.18em] text-zinc-500">CUSTOMER ACCOUNT</p>
              <h2 className="mt-2 text-xl font-semibold text-zinc-900 sm:text-2xl">
                {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
              </h2>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-xl bg-zinc-100 p-1">
            <button
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                mode === "register"
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              إنشاء حساب
            </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" ? (
              <>
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2.5">
                  <span className="mt-0.5 text-emerald-700" aria-hidden="true">
                    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                      <path d="M10 1.7 3.5 4.2v5.5c0 4.1 2.8 7.9 6.5 8.9 3.7-1 6.5-4.8 6.5-8.9V4.2L10 1.7Zm0 2.1 4.5 1.7v4.2c0 3.1-2 6-4.5 6.9-2.5-.9-4.5-3.8-4.5-6.9V5.5L10 3.8Zm-.8 3.3v3.9h1.6V7.1H9.2Zm0 5v1.6h1.6v-1.6H9.2Z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">حماية البيانات</p>
                    <p className="mt-0.5 text-xs text-emerald-700">
                      بياناتك مشفرة وآمنة ويتم التعامل معها بسرية تامة.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="الاسم الأول"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none ring-rose-500 transition focus:border-rose-400 focus:ring-2"
                  />
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="اسم العائلة"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none ring-rose-500 transition focus:border-rose-400 focus:ring-2"
                  />
                </div>
                <div className="flex">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="938216056"
                    className="w-full rounded-l-lg border border-zinc-300 border-r-0 px-3 py-3 text-sm outline-none ring-rose-500 transition focus:border-rose-400 focus:ring-2"
                  />
                  <div className="flex min-w-[96px] items-center justify-center gap-1 rounded-r-lg border border-zinc-300 bg-zinc-50 px-2 text-sm font-medium text-zinc-700">
                    <span>🇸🇾</span>
                    <span>{SYRIA_CODE}</span>
                  </div>
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none ring-rose-500 transition focus:border-rose-400 focus:ring-2"
                />
              </>
            ) : null}

            {mode === "login" ? (
              <>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none ring-rose-500 transition focus:border-rose-400 focus:ring-2"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none ring-rose-500 transition focus:border-rose-400 focus:ring-2"
                />
              </>
            ) : null}

            {mode === "register" ? (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none ring-rose-500 transition focus:border-rose-400 focus:ring-2"
              />
            ) : null}

            <button
              disabled={isSubmitting}
              className="w-full rounded-lg bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-60"
            >
              {isSubmitting ? "جاري التنفيذ..." : mode === "login" ? "دخول" : "تسجيل"}
            </button>
            {error ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
