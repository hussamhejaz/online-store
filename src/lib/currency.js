export const CURRENCY_STORAGE_KEY = "store_currency";
export const USD_TO_SYP_RATE_STORAGE_KEY = "usd_to_syp_rate";
export const CURRENCY_EVENT = "currency-settings-updated";
const DEFAULT_RATE = 10000;

export function getCurrencySettings() {
  if (typeof window === "undefined") {
    return { currency: "USD", usdToSypRate: DEFAULT_RATE };
  }

  const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
  const currency = storedCurrency === "SYP" ? "SYP" : "USD";

  const rawRate = Number(localStorage.getItem(USD_TO_SYP_RATE_STORAGE_KEY));
  const usdToSypRate = Number.isFinite(rawRate) && rawRate > 0 ? rawRate : DEFAULT_RATE;

  return { currency, usdToSypRate };
}

export function setCurrencySettings({ currency, usdToSypRate }) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedCurrency = currency === "SYP" ? "SYP" : "USD";
  const normalizedRate = Number(usdToSypRate);
  const safeRate = Number.isFinite(normalizedRate) && normalizedRate > 0 ? normalizedRate : DEFAULT_RATE;

  localStorage.setItem(CURRENCY_STORAGE_KEY, normalizedCurrency);
  localStorage.setItem(USD_TO_SYP_RATE_STORAGE_KEY, String(safeRate));
  window.dispatchEvent(new Event(CURRENCY_EVENT));
}

export async function syncCurrencySettingsFromServer() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const response = await fetch("/api/settings/currency", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || !result?.success) {
      return;
    }

    const local = getCurrencySettings();
    const serverRate = Number(result?.data?.usdToSypRate);
    const safeRate = Number.isFinite(serverRate) && serverRate > 0 ? serverRate : DEFAULT_RATE;
    setCurrencySettings({ currency: local.currency, usdToSypRate: safeRate });
  } catch {
    // Ignore fetch errors and keep local fallback
  }
}

export async function saveCurrencyRateToServer(usdToSypRate) {
  const rate = Number(usdToSypRate);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("invalid_rate");
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const response = await fetch("/api/settings/currency", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ usdToSypRate: rate }),
  });
  const result = await response.json();
  if (!response.ok || !result?.success) {
    throw new Error(result?.message || "Unable to save currency rate.");
  }
  return result.data?.usdToSypRate;
}

export function formatMoney(value, currency, usdToSypRate) {
  const parts = getMoneyParts(value, currency, usdToSypRate);
  if (parts.currency === "SYP") {
    return `${parts.oldValue} ل.س (الجديد: ${parts.newValue})`;
  }
  return `$${parts.usdValue}`;
}

export function getMoneyParts(value, currency, usdToSypRate) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) {
    return currency === "SYP"
      ? { currency: "SYP", oldValue: "0", newValue: "0", usdValue: "0.00" }
      : { currency: "USD", oldValue: "0", newValue: "0", usdValue: "0.00" };
  }

  if (currency === "SYP") {
    const converted = amount * Number(usdToSypRate || 0);
    const oldPrice = Math.round(converted);
    const newPrice = Math.round(oldPrice / 100);
    return {
      currency: "SYP",
      oldValue: oldPrice.toLocaleString("en-US"),
      newValue: newPrice.toLocaleString("en-US"),
      usdValue: amount.toFixed(2),
    };
  }

  return {
    currency: "USD",
    oldValue: "0",
    newValue: "0",
    usdValue: amount.toFixed(2),
  };
}
