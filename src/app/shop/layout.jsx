"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CURRENCY_EVENT, getCurrencySettings, setCurrencySettings, syncCurrencySettingsFromServer } from "@/lib/currency";

function LoginIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M10 17v-1a4 4 0 0 1 4-4h7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m17 13 4-1-4-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h8" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M10 17v-1a4 4 0 0 0-4-4H1" stroke="currentColor" strokeWidth="1.8" />
      <path d="m7 13-4-1 4-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 21h8a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3h-8" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M2 3h2l2.2 10.2a1 1 0 0 0 1 .8h9.9a1 1 0 0 0 1-.8L20 6H6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="19" r="1.5" fill="currentColor" />
      <circle cx="17" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M20 12a8 8 0 0 1-11.8 7l-3.2 1 1-3.1A8 8 0 1 1 20 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 9.5c.3-.7.7-.7 1-.7.1 0 .3 0 .4.4l.6 1.3c.1.2 0 .4-.1.6l-.3.4c-.1.1-.1.3 0 .4.3.5.8 1 1.3 1.3.1.1.3.1.4 0l.4-.3c.2-.1.4-.2.6-.1l1.3.6c.4.1.4.3.4.4 0 .3 0 .7-.7 1-.6.3-1.5.3-2.9-.4a7 7 0 0 1-2.6-2.6c-.7-1.4-.7-2.3-.4-2.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M13.5 21v-7h2.5l.5-3h-3V9.2c0-.9.4-1.7 1.8-1.7H17V5a18 18 0 0 0-2.2-.1c-2.3 0-3.8 1.4-3.8 3.9V11H8.5v3H11v7h2.5Z" fill="currentColor" />
    </svg>
  );
}

export default function ShopLayout({ children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [badgePop, setBadgePop] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currency, setCurrency] = useState("USD");
  const pathname = usePathname();
  const whatsappHref =
    "https://wa.me/?text=" + encodeURIComponent("مرحبا، لدي استفسار عن المنتجات في المتجر");
  const facebookHref = "https://www.facebook.com/share/17dqqcq97N/?mibextid=wwXIfr";
  const instagramHref = "https://www.instagram.com/trendwa.sy?igsh=MTFoa2VyYmp6djYydA==";

  async function syncCartCount() {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      setCartCount(0);
      return;
    }
    try {
      const response = await fetch("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        setCartCount(0);
        return;
      }
      const total = Array.isArray(result.data?.items)
        ? result.data.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        : 0;
      setCartCount(total);
    } catch {
      setCartCount(0);
    }
  }

  useEffect(() => {
    syncCurrencySettingsFromServer();
    const settings = getCurrencySettings();
    setCurrency(settings.currency);

    function syncCurrency() {
      const next = getCurrencySettings();
      setCurrency(next.currency);
    }

    window.addEventListener("storage", syncCurrency);
    window.addEventListener(CURRENCY_EVENT, syncCurrency);
    return () => {
      window.removeEventListener("storage", syncCurrency);
      window.removeEventListener(CURRENCY_EVENT, syncCurrency);
    };
  }, []);

  useEffect(() => {
    function closeCurrencyMenu() {
      setCurrencyMenuOpen(false);
    }
    window.addEventListener("scroll", closeCurrencyMenu, { passive: true });
    return () => {
      window.removeEventListener("scroll", closeCurrencyMenu);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadCategories() {
      try {
        const response = await fetch("/api/categories");
        const result = await response.json();
        if (!response.ok || !result?.success) {
          return;
        }
        if (mounted) {
          setCategories(Array.isArray(result.data) ? result.data : []);
        }
      } catch {
        if (mounted) {
          setCategories([]);
        }
      }
    }
    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function syncUser() {
      const raw = localStorage.getItem("customer_user");
      if (!raw) {
        setCustomerName("");
        return;
      }
      try {
        const user = JSON.parse(raw);
        const fullName =
          `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
          user?.name ||
          user?.email ||
          "";
        setCustomerName(fullName);
      } catch {
        setCustomerName("");
      }
    }

    syncUser();
    setTimeout(syncCartCount, 0);
    window.addEventListener("storage", syncUser);
    window.addEventListener("customer-auth-updated", syncUser);
    window.addEventListener("customer-auth-updated", syncCartCount);
    function onCartUpdate() {
      setBadgePop(true);
      setTimeout(() => setBadgePop(false), 300);
      syncCartCount();
    }

    window.addEventListener("customer-cart-updated", onCartUpdate);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("customer-auth-updated", syncUser);
      window.removeEventListener("customer-auth-updated", syncCartCount);
      window.removeEventListener("customer-cart-updated", onCartUpdate);
    };
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("customer_user");
    if (!raw) {
      setCustomerName("");
      setTimeout(syncCartCount, 0);
      return;
    }
    try {
      const user = JSON.parse(raw);
      const fullName =
        `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
        user?.name ||
        user?.email ||
        "";
      setCustomerName(fullName);
      setTimeout(syncCartCount, 0);
    } catch {
      setCustomerName("");
      setTimeout(syncCartCount, 0);
    }
  }, [pathname]);

  function logoutCustomer() {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_user");
    setCustomerName("");
    setCartCount(0);
    setOpen(false);
  }

  function submitSearch(event) {
    event.preventDefault();
    const q = searchTerm.trim();
    if (!q) {
      router.push("/shop");
      return;
    }
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  }

  function updateCurrency(nextCurrency) {
    const settings = getCurrencySettings();
    setCurrencySettings({
      currency: nextCurrency,
      usdToSypRate: settings.usdToSypRate,
    });
    setCurrencyMenuOpen(false);
  }

  const currencyLabel = currency === "SYP" ? "🇸🇾 SYP" : "🇺🇸 USD";

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl md:hidden">
          <div className="border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-white">
            <div className="mb-2 flex items-center justify-center gap-2 text-zinc-300">
              <Link href={instagramHref} target="_blank" rel="noopener noreferrer" className="rounded-full border border-zinc-600 bg-zinc-800 p-1.5 text-zinc-100 transition hover:border-zinc-400 hover:bg-zinc-700">
                <InstagramIcon />
              </Link>
              <Link href={facebookHref} target="_blank" rel="noopener noreferrer" className="rounded-full border border-zinc-600 bg-zinc-800 p-1.5 text-zinc-100 transition hover:border-zinc-400 hover:bg-zinc-700">
                <FacebookIcon />
              </Link>
            </div>
            <form onSubmit={submitSearch}>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ادخل كلمة البحث"
                className="h-9 w-full rounded-full border border-zinc-700 bg-zinc-800 px-4 text-sm text-white placeholder:text-zinc-400 outline-none focus:border-zinc-500"
              />
            </form>
          </div>

          <div dir="ltr" className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCurrencyMenuOpen((v) => !v)}
                  className="inline-flex h-10 w-[92px] items-center justify-between rounded-full border border-rose-200 bg-white px-2 text-[11px] font-bold text-zinc-800 shadow-sm transition hover:border-rose-300 sm:w-[112px] sm:px-3 sm:text-xs"
                  aria-label="العملة"
                >
                  <span>{currencyLabel}</span>
                  <span className="text-[10px] text-zinc-500">▼</span>
                </button>
                {currencyMenuOpen ? (
                  <div className="absolute left-0 top-full z-50 mt-1 min-w-full overflow-hidden rounded-xl border border-rose-200 bg-white shadow-lg">
                    <button type="button" onClick={() => updateCurrency("USD")} className="block w-full px-2 py-2 text-left text-[11px] font-semibold hover:bg-rose-50 sm:px-3 sm:text-xs">🇺🇸 USD</button>
                    <button type="button" onClick={() => updateCurrency("SYP")} className="block w-full px-2 py-2 text-left text-[11px] font-semibold hover:bg-rose-50 sm:px-3 sm:text-xs">🇸🇾 SYP</button>
                  </div>
                ) : null}
              </div>
              <Link
                href="/shop/cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900"
                aria-label="السلة"
              >
                <CartIcon />
                {cartCount > 0 ? (
                  <span className={`absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold leading-none text-white ${badgePop ? "animate-badge-pop" : ""}`}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </Link>
              <Link
                href={customerName ? "/shop/account" : "/shop/auth"}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900"
                aria-label={customerName ? "الحساب" : "تسجيل الدخول"}
              >
                <UserIcon />
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/shop" className="text-lg font-semibold tracking-tight">
                <img src="/logo.png" alt="TrendWa" className="h-12 w-auto object-contain" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-900"
                aria-label="فتح القائمة"
              >
                <span className="relative block h-4 w-5">
                  <span
                    className={`absolute right-0 top-0 h-0.5 w-5 bg-zinc-900 transition-all duration-300 ${
                      open ? "top-1.5 -rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`absolute right-0 top-1.5 h-0.5 w-5 bg-zinc-900 transition-all duration-300 ${
                      open ? "opacity-0" : "opacity-100"
                    }`}
                  />
                  <span
                    className={`absolute right-0 top-3 h-0.5 w-5 bg-zinc-900 transition-all duration-300 ${
                      open ? "top-1.5 rotate-45" : ""
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          <nav className="flex items-center gap-4 overflow-x-auto whitespace-nowrap border-b border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700">
            <Link href="/shop" className="hover:text-rose-600">جميع المنتجات</Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop/category/${encodeURIComponent(category.slug || category.id)}`}
                className="hover:text-rose-600"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden border-b border-zinc-800 bg-zinc-900 text-white md:block">
          <div className="grid grid-cols-[1fr_1.2fr_1fr] items-center gap-4 px-6 py-2 text-sm">
            <div className="flex items-center gap-2 text-zinc-300">
              <Link href={instagramHref} target="_blank" rel="noopener noreferrer" className="rounded-full border border-zinc-600 bg-zinc-800 p-1.5 text-zinc-100 transition hover:border-zinc-400 hover:bg-zinc-700">
                <InstagramIcon />
              </Link>
              <Link href={facebookHref} target="_blank" rel="noopener noreferrer" className="rounded-full border border-zinc-600 bg-zinc-800 p-1.5 text-zinc-100 transition hover:border-zinc-400 hover:bg-zinc-700">
                <FacebookIcon />
              </Link>
            </div>
            <div className="relative">
              <form onSubmit={submitSearch}>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ادخل كلمة البحث"
                  className="h-9 w-full rounded-full border border-zinc-700 bg-zinc-800 px-4 text-sm text-white placeholder:text-zinc-400 outline-none focus:border-zinc-500"
                />
              </form>
            </div>
            <div className="flex items-center justify-end gap-5 text-zinc-200">
              <Link href="/shop/about" className="hover:text-white">من نحن</Link>
              <Link href="/shop/privacy" className="hover:text-white">الخصوصية</Link>
              <Link href="/shop/returns" className="hover:text-white">الإرجاع والاستبدال</Link>
            </div>
          </div>
        </div>

        <div className="hidden w-full grid-cols-[0.8fr_2fr_1fr] items-center gap-5 bg-zinc-100 px-6 py-3 md:grid">
          <div className="justify-self-end">
            <Link href="/shop" className="text-lg font-semibold tracking-tight">
              <img src="/logo.png" alt="TrendWa" className="h-14 w-auto object-contain" />
            </Link>
          </div>

          <nav className="flex items-center justify-center gap-5 text-sm font-medium text-zinc-800">
            <Link href="/shop" className="hover:text-rose-600">جميع المنتجات</Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop/category/${encodeURIComponent(category.slug || category.id)}`}
                className="hover:text-rose-600"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-self-start gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setCurrencyMenuOpen((v) => !v)}
                className="inline-flex h-10 min-w-[122px] items-center justify-between rounded-full border border-rose-200 bg-white px-3 text-xs font-bold text-zinc-800 shadow-sm transition hover:border-rose-300"
                aria-label="العملة"
              >
                <span>{currencyLabel}</span>
                <span className="text-[10px] text-zinc-500">▼</span>
              </button>
              {currencyMenuOpen ? (
                <div className="absolute left-0 top-full z-50 mt-1 min-w-full overflow-hidden rounded-xl border border-rose-200 bg-white shadow-lg">
                  <button type="button" onClick={() => updateCurrency("USD")} className="block w-full px-3 py-2 text-left text-xs font-semibold hover:bg-rose-50">🇺🇸 USD</button>
                  <button type="button" onClick={() => updateCurrency("SYP")} className="block w-full px-3 py-2 text-left text-xs font-semibold hover:bg-rose-50">🇸🇾 SYP</button>
                </div>
              ) : null}
            </div>
            <Link href="/shop/cart" className="relative rounded-full border border-zinc-300 bg-white p-2 text-zinc-800 hover:bg-zinc-50">
              <CartIcon />
              {cartCount > 0 ? (
                <span className={`absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold leading-none text-white ${badgePop ? "animate-badge-pop" : ""}`}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
            {customerName ? (
              <>
                <Link href="/shop/account" className="rounded-full border border-zinc-300 bg-white p-2 text-zinc-800 hover:bg-zinc-50">
                  <UserIcon />
                </Link>
                <button type="button" onClick={logoutCustomer} className="rounded-full border border-zinc-300 bg-white p-2 text-zinc-800 hover:bg-zinc-50">
                  <LogoutIcon />
                </button>
              </>
            ) : (
              <Link href="/shop/auth" className="rounded-full border border-zinc-300 bg-white p-2 text-zinc-800 hover:bg-zinc-50">
                <LoginIcon />
              </Link>
            )}
          </div>
        </div>
        {open ? (
          <nav className="border-t border-zinc-200 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2 text-sm">
              <Link onClick={() => setOpen(false)} href="/shop/about" className="flex items-center justify-center gap-2 rounded-md px-3 py-2 hover:bg-rose-50 hover:text-rose-700">
                <span>من نحن</span>
              </Link>
              <Link onClick={() => setOpen(false)} href="/shop/privacy" className="flex items-center justify-center gap-2 rounded-md px-3 py-2 hover:bg-rose-50 hover:text-rose-700">
                <span>الخصوصية</span>
              </Link>
              <Link onClick={() => setOpen(false)} href="/shop/returns" className="flex items-center justify-center gap-2 rounded-md px-3 py-2 hover:bg-rose-50 hover:text-rose-700">
                <span>الإرجاع والاستبدال</span>
              </Link>
              <Link onClick={() => setOpen(false)} href="/shop/terms" className="flex items-center justify-center gap-2 rounded-md px-3 py-2 hover:bg-rose-50 hover:text-rose-700">
                <span>الشروط</span>
              </Link>
              {customerName ? (
                <>
                  <Link
                    href="/shop/account"
                    onClick={() => setOpen(false)}
                    className="rounded-md bg-zinc-100 px-3 py-2 text-center text-zinc-700 transition hover:bg-zinc-200"
                  >
                    {customerName}
                  </Link>
                  <button
                    type="button"
                    title="تسجيل الخروج"
                    onClick={logoutCustomer}
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-500"
                  >
                    <LogoutIcon />
                  </button>
                </>
              ) : (
                <Link
                  title="دخول العميل"
                  onClick={() => setOpen(false)}
                  href="/shop/auth"
                  className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-500"
                >
                  <LoginIcon />
                </Link>
              )}
            </div>
          </nav>
        ) : null}
      </header>
      {open ? (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-black/20 md:hidden"
        />
      ) : null}
      <main className="flex-1">{children}</main>
      <Link
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل واتساب"
        title="تواصل واتساب"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/25 transition hover:scale-105 hover:bg-emerald-500"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
          <path
            d="M20 12a8 8 0 0 1-11.8 7l-3.2 1 1-3.1A8 8 0 1 1 20 12Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 9.5c.3-.7.7-.7 1-.7.1 0 .3 0 .4.4l.6 1.3c.1.2 0 .4-.1.6l-.3.4c-.1.1-.1.3 0 .4.3.5.8 1 1.3 1.3.1.1.3.1.4 0l.4-.3c.2-.1.4-.2.6-.1l1.3.6c.4.1.4.3.4.4 0 .3 0 .7-.7 1-.6.3-1.5.3-2.9-.4a7 7 0 0 1-2.6-2.6c-.7-1.4-.7-2.3-.4-2.9Z"
            fill="currentColor"
          />
        </svg>
      </Link>
      <footer className="border-t border-zinc-200 bg-white">
        <div className="w-full px-4 py-8 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-right">
              <Link href="/shop" className="inline-flex text-xl font-semibold tracking-tight">
                <img src="/logo.png" alt="TrendWa" className="h-14 w-auto object-contain" />
              </Link>
              <p className="mt-2 text-sm text-zinc-600">تجربة تسوق عصرية وسريعة.</p>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-zinc-600">
              <Link href="/shop" className="transition hover:text-rose-600">المتجر</Link>
              <Link href="/shop/cart" className="transition hover:text-rose-600">السلة</Link>
              {!customerName ? (
                <Link href="/shop/auth" className="transition hover:text-rose-600">تسجيل الدخول</Link>
              ) : null}
              <Link href="/shop/privacy" className="transition hover:text-rose-600">الخصوصية</Link>
              <Link href="/shop/terms" className="transition hover:text-rose-600">الشروط</Link>
              <span className="text-zinc-400">|</span>
              <span className="font-medium text-zinc-700">تواصل معنا</span>
              <Link href={instagramHref} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full border border-zinc-300 bg-zinc-800 p-1.5 text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-700">
                <InstagramIcon />
              </Link>
              <Link href={facebookHref} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full border border-zinc-300 bg-zinc-800 p-1.5 text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-700">
                <FacebookIcon />
              </Link>
            </nav>
          </div>

          <div className="mt-6 border-t border-zinc-200 pt-4 text-center">
            <p className="text-xs text-zinc-500">© {new Date().getFullYear()} TRENDWA. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
