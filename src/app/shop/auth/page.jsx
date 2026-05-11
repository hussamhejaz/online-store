"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SECRET_QUESTION_OPTIONS = [
  "ما اسم أول مدرسة التحقت بها؟",
  "ما اسم أقرب صديق لك في الطفولة؟",
  "في أي مدينة وُلدت؟",
  "ما اسم معلمك المفضل في المدرسة؟",
];

export default function ShopAuthPage() {
  const router = useRouter();
  const SYRIA_CODE = "+963";
  const [mode, setMode] = useState("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secretQuestion, setSecretQuestion] = useState("");
  const [secretQuestionOption, setSecretQuestionOption] = useState(SECRET_QUESTION_OPTIONS[0]);
  const [secretAnswer, setSecretAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [recoveryQuestion, setRecoveryQuestion] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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
      "First name, last name, phone, email, password, secret question, and secret answer are required.":
        "الاسم الأول واسم العائلة ورقم الهاتف والبريد الإلكتروني وكلمة المرور والسؤال السري والإجابة السرية مطلوبة.",
      "Password must be at least 8 characters.": "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
      "Invalid email or password.": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      "An account with this email already exists.": "يوجد حساب مسجل بهذا البريد الإلكتروني.",
      "Recovery data not found for this account.": "لا توجد بيانات استرجاع لهذا الحساب.",
      "Invalid recovery answer.": "الإجابة السرية غير صحيحة.",
      "Email is required.": "البريد الإلكتروني مطلوب.",
      "Email, secret answer, and new password are required.":
        "البريد الإلكتروني والإجابة السرية وكلمة المرور الجديدة مطلوبة.",
      "Unable to log in.": "تعذر تسجيل الدخول.",
      "Unable to register user.": "تعذر إنشاء الحساب.",
      "Unable to get recovery question.": "تعذر جلب السؤال السري.",
      "Unable to reset password.": "تعذر إعادة تعيين كلمة المرور.",
      "Password updated successfully.": "تم تحديث كلمة المرور بنجاح.",
      "Invalid JSON body.": "صيغة البيانات غير صحيحة.",
      "فشل العملية.": "فشل العملية.",
    };

    if (text.toLowerCase().includes("invalid email or password")) {
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }

    if (text.toLowerCase().includes("unknown argument `secretquestion`")) {
      return "خطأ إعداد قاعدة البيانات: حقل السؤال السري غير محدث في Prisma Client. شغّل prisma generate ثم أعد تشغيل السيرفر.";
    }

    if (text.toLowerCase().startsWith("register failed:")) {
      return text;
    }

    return map[text] || text || "حدث خطأ غير متوقع. حاول مرة أخرى.";
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (mode === "register" && password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    if (mode === "recover" && newPassword !== confirmNewPassword) {
      setError("كلمتا المرور الجديدتان غير متطابقتين.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url =
        mode === "login"
          ? "/api/auth/login"
          : mode === "register"
            ? "/api/auth/register"
            : "/api/auth/forgot-password";
      const payload =
        mode === "login"
          ? { email, password }
          : mode === "register"
            ? {
                firstName,
                lastName,
                phone: phone ? `${SYRIA_CODE}${phone.replace(/^0+/, "")}` : "",
                email,
                password,
                secretQuestion:
                  secretQuestionOption === "__custom__" ? secretQuestion : secretQuestionOption,
                secretAnswer,
              }
            : {
                email,
                secretAnswer,
                newPassword,
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
      if (mode === "recover") {
        setSuccessMessage("تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setSecretAnswer("");
        setRecoveryQuestion("");
        return;
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

  async function onLoadRecoveryQuestion() {
    setError("");
    setSuccessMessage("");
    setRecoveryQuestion("");

    try {
      const response = await fetch("/api/auth/recovery-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(translateError(result?.message || "فشل العملية."));
      }
      setRecoveryQuestion(String(result.question || ""));
    } catch (err) {
      setError(translateError(err.message));
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
                {mode === "login"
                  ? "مرحباً بعودتك"
                  : mode === "register"
                    ? "ابدأ حسابك الجديد"
                    : "استرجاع كلمة المرور"}
              </h1>
              <p className="mt-3 text-sm leading-7 text-zinc-300">
                {mode === "login"
                  ? "سجّل دخولك بسرعة وواصل تجربة تسوق أنيقة."
                  : mode === "register"
                    ? "أنشئ حسابك خلال لحظات واستمتع بتجربة شراء أسهل."
                    : "أجب على سؤالك السري لتعيين كلمة مرور جديدة."}
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
                {mode === "login" ? "تسجيل الدخول" : mode === "register" ? "إنشاء حساب" : "استرجاع كلمة المرور"}
              </h2>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-xl bg-zinc-100 p-1">
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccessMessage("");
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
                  setSuccessMessage("");
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

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
                    <p className="mb-2 text-sm font-semibold text-zinc-800">اختر السؤال السري</p>
                    <div className="grid gap-2">
                      {SECRET_QUESTION_OPTIONS.map((option) => {
                        const isActive = secretQuestionOption === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setSecretQuestionOption(option)}
                            className={`rounded-lg border px-3 py-2 text-right text-sm transition ${
                              isActive
                                ? "border-rose-300 bg-rose-50 text-rose-800"
                                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setSecretQuestionOption("__custom__")}
                        className={`rounded-lg border px-3 py-2 text-right text-sm transition ${
                          secretQuestionOption === "__custom__"
                            ? "border-rose-300 bg-rose-50 text-rose-800"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        سؤال مخصص
                      </button>
                    </div>
                    {secretQuestionOption === "__custom__" ? (
                      <input
                        value={secretQuestion}
                        onChange={(e) => setSecretQuestion(e.target.value)}
                        placeholder="اكتب سؤالك السري الخاص"
                        className="mt-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-sm outline-none ring-rose-500 transition focus:border-rose-400 focus:ring-2"
                      />
                    ) : null}
                  </div>

                  <input
                    value={secretAnswer}
                    onChange={(e) => setSecretAnswer(e.target.value)}
                    placeholder="الإجابة السرية"
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
                <>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="كلمة المرور"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none ring-rose-500 transition focus:border-rose-400 focus:ring-2"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تأكيد كلمة المرور"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none ring-rose-500 transition focus:border-rose-400 focus:ring-2"
                  />
                </>
              ) : null}

              {mode === "recover" ? (
                <>
                  <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-b from-rose-50 to-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-900">استعادة الوصول للحساب</p>
                      <span className="rounded-full border border-rose-200 bg-white px-2 py-1 text-[11px] font-medium text-rose-700">
                        خطوة 1
                      </span>
                    </div>
                    <p className="mb-3 text-xs leading-6 text-zinc-600">
                      أدخل بريدك الإلكتروني ثم اضغط إظهار السؤال السري للتحقق من هويتك.
                    </p>
                    <div className="flex gap-2 sm:items-center">
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="البريد الإلكتروني"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-sm outline-none ring-rose-500 transition focus:border-rose-400 focus:ring-2"
                      />
                      <button
                        type="button"
                        onClick={onLoadRecoveryQuestion}
                        className="whitespace-nowrap rounded-lg border border-sky-300 bg-sky-100 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-200"
                      >
                        إظهار السؤال
                      </button>
                    </div>
                    <div className="mt-3 rounded-lg border border-zinc-200 bg-white px-3 py-3">
                      <p className="mb-1 text-[11px] font-semibold text-zinc-500">السؤال السري</p>
                      <p className="text-sm text-zinc-700">{recoveryQuestion || "سيظهر هنا السؤال السري"}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-900">تعيين كلمة مرور جديدة</p>
                      <span className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700">
                        خطوة 2
                      </span>
                    </div>
                    <p className="mb-3 text-xs leading-6 text-zinc-600">
                      اكتب الإجابة السرية ثم أدخل كلمة المرور الجديدة مع التأكيد.
                    </p>
                    <div className="space-y-3">
                  <input
                    value={secretAnswer}
                    onChange={(e) => setSecretAnswer(e.target.value)}
                    placeholder="الإجابة السرية"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none ring-rose-500 transition focus:border-rose-400 focus:ring-2"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="كلمة المرور الجديدة"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none ring-rose-500 transition focus:border-rose-400 focus:ring-2"
                  />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="تأكيد كلمة المرور الجديدة"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-sm outline-none ring-rose-500 transition focus:border-rose-400 focus:ring-2"
                  />
                    </div>
                  </div>
                </>
              ) : null}

              <button
                disabled={isSubmitting}
                className="w-full rounded-lg bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-60"
              >
                {isSubmitting
                  ? "جاري التنفيذ..."
                  : mode === "login"
                    ? "دخول"
                    : mode === "register"
                      ? "تسجيل"
                      : "إعادة تعيين كلمة المرور"}
              </button>
              {successMessage ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {successMessage}
                </p>
              ) : null}
              {error ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              {mode === "login" ? (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("recover");
                      setError("");
                      setSuccessMessage("");
                    }}
                    className="text-sm font-medium text-rose-600 underline underline-offset-4 transition hover:text-rose-500"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
