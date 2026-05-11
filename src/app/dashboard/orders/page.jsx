"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PriceDisplay from "@/components/PriceDisplay";

const statusLabels = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "تم التأكيد",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
};

const statusOptions = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

const statusClasses = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-sky-100 text-sky-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

export default function DashboardOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [savingStatusId, setSavingStatusId] = useState(null);
  const [archivingOrderId, setArchivingOrderId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("false");
  const [search, setSearch] = useState("");
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const pendingCount = orders.filter((order) => order.status === "PENDING").length;
  const deliveredCount = orders.filter((order) => order.status === "DELIVERED").length;

  async function getAdminToken() {
    const token = localStorage.getItem("admin_token");
    const userRaw = localStorage.getItem("admin_user");
    const user = userRaw ? JSON.parse(userRaw) : null;

    if (!token || user?.role !== "ADMIN") {
      router.replace("/login");
      return null;
    }

    return token;
  }

  async function loadOrders() {
    const token = await getAdminToken();
    if (!token) {
      return;
    }

    const params = new URLSearchParams();
    if (statusFilter) {
      params.set("status", statusFilter);
    }
    if (archiveFilter) {
      params.set("archived", archiveFilter);
    }
    if (search.trim()) {
      params.set("search", search.trim());
    }

    const response = await fetch(`/api/admin/orders?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      router.replace("/login");
      return;
    }

    if (!response.ok || !result?.success) {
      throw new Error(result?.message || "تعذر تحميل الطلبات.");
    }

    setOrders(result.data || []);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setStatusFilter(params.get("status") || "");
    setArchiveFilter(params.get("archived") || "false");
    setSearch(params.get("search") || "");
  }, []);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        await loadOrders();
      } catch (err) {
        if (mounted) {
          setError(err.message || "حدث خطأ أثناء تحميل الطلبات.");
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
  }, [router, statusFilter, archiveFilter, search]);

  async function updateStatus(orderId, status) {
    setError("");
    setMessage("");
    setSavingStatusId(orderId);

    try {
      const token = await getAdminToken();
      if (!token) {
        return;
      }

      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "تعذر تحديث حالة الطلب.");
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: result.data.status,
              }
            : order,
        ),
      );
      setMessage("تم تحديث حالة الطلب.");
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحديث الحالة.");
    } finally {
      setSavingStatusId(null);
    }
  }

  async function toggleArchive(orderId, archive) {
    setError("");
    setMessage("");
    setArchivingOrderId(orderId);
    try {
      const token = await getAdminToken();
      if (!token) {
        return;
      }
      const response = await fetch(`/api/admin/orders/${orderId}/archive`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ archive }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "تعذر تحديث الأرشفة.");
      }
      setMessage(archive ? "تمت أرشفة الطلب." : "تمت إعادة الطلب من الأرشيف.");
      await loadOrders();
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحديث الأرشفة.");
    } finally {
      setArchivingOrderId(null);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) {
      params.set("status", statusFilter);
    }
    if (archiveFilter) {
      params.set("archived", archiveFilter);
    }
    if (search.trim()) {
      params.set("search", search.trim());
    }
    router.replace(`/dashboard/orders?${params.toString()}`);
  }, [statusFilter, archiveFilter, search, router]);

  return (
    <main dir="rtl" className="min-h-screen bg-zinc-100 p-6 md:p-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-lg">
          <div className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-end md:p-7">
            <div>
              <p className="text-xs tracking-[0.2em] text-rose-300">ORDER CENTER</p>
              <h1 className="mt-2 text-2xl font-semibold md:text-3xl">إدارة الطلبات</h1>
              <p className="mt-2 text-sm text-zinc-300">
                لوحة احترافية لمتابعة الطلبات، تحديث حالتها، ومراجعة تفاصيل العملاء والشحن.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <p className="text-xs text-zinc-300">إجمالي الطلبات</p>
                <p className="mt-1 text-2xl font-semibold">{orders.length}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-zinc-500">إجمالي الطلبات</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{orders.length}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-zinc-500">طلبات قيد الانتظار</p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">{pendingCount}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-zinc-500">طلبات مكتملة</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">{deliveredCount}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-zinc-500">إجمالي المبيعات</p>
            <PriceDisplay value={totalRevenue} currency="USD" usdToSypRate={1} className="mt-2 text-2xl font-semibold text-rose-600" />
          </article>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">كل الطلبات</h2>
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
              آخر تحديث: {new Date().toLocaleDateString("ar-SA")}
            </span>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <select
              value={archiveFilter}
              onChange={(e) => setArchiveFilter(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-rose-500 focus:ring-2"
            >
              <option value="false">الطلبات النشطة</option>
              <option value="true">الأرشيف</option>
              <option value="all">الكل</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-rose-500 focus:ring-2"
            >
              <option value="">كل الحالات</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالعميل، المدينة، الهاتف، رقم الطلب..."
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-rose-500 focus:ring-2"
            />
          </div>
          {message ? <p className="mb-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mb-3 text-sm text-rose-700">{error}</p> : null}

          {isLoading ? (
            <p className="text-sm text-zinc-500">جاري التحميل...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-zinc-500">لا توجد طلبات حتى الآن.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="min-w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
                    <th className="px-3 py-3 font-medium">رقم الطلب</th>
                    <th className="px-3 py-3 font-medium">العميل</th>
                    <th className="px-3 py-3 font-medium">الإجمالي</th>
                    <th className="px-3 py-3 font-medium">العناصر</th>
                    <th className="px-3 py-3 font-medium">الحالة</th>
                    <th className="px-3 py-3 font-medium">التاريخ</th>
                    <th className="px-3 py-3 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <Fragment key={order.id}>
                      <tr className="border-b border-zinc-100 transition hover:bg-zinc-50">
                        <td className="px-3 py-3 font-mono text-xs text-zinc-700">{order.id.slice(0, 8)}...</td>
                        <td className="px-3 py-3 text-zinc-700">
                          <p className="font-medium">{order.user?.name || "-"}</p>
                          <p className="text-xs text-zinc-500">{order.user?.email || "-"}</p>
                        </td>
                        <td className="px-3 py-3 text-zinc-700"><PriceDisplay value={order.total} currency="USD" usdToSypRate={1} compact /></td>
                        <td className="px-3 py-3 text-zinc-700">{order.items?.length || 0}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-2">
                            <span
                              className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                                statusClasses[order.status] || "bg-zinc-100 text-zinc-700"
                              }`}
                            >
                              {statusLabels[order.status] || order.status}
                            </span>
                            <select
                              value={order.status}
                              disabled={savingStatusId === order.id}
                              onChange={(e) => updateStatus(order.id, e.target.value)}
                              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs outline-none ring-rose-500 focus:ring-2 disabled:opacity-60"
                            >
                              {statusOptions.map((option) => (
                                <option key={option} value={option}>
                                  {statusLabels[option]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-zinc-500">
                          {new Date(order.createdAt).toLocaleDateString("ar-SA")}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOrderId((prev) => (prev === order.id ? null : order.id))
                              }
                              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700"
                            >
                              {expandedOrderId === order.id ? "إخفاء" : "عرض"}
                            </button>
                            <button
                              type="button"
                              disabled={archivingOrderId === order.id}
                              onClick={() => toggleArchive(order.id, !order.isArchived)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                                order.isArchived
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              }`}
                            >
                              {order.isArchived ? "إلغاء الأرشفة" : "أرشفة"}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedOrderId === order.id ? (
                        <tr className="border-b border-zinc-100 bg-zinc-50/60">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                                <h3 className="text-sm font-semibold text-zinc-900">بيانات العميل والشحن</h3>
                                <div className="mt-2 space-y-1 text-sm text-zinc-700">
                                  <p>الاسم: {order.user?.name || "-"}</p>
                                  <p>الإيميل: {order.user?.email || "-"}</p>
                                  <p>الهاتف: {order.phone || "-"}</p>
                                  <p>المدينة: {order.city || "-"}</p>
                                  <p>العنوان: {order.address || "-"}</p>
                                  <p>ملاحظات: {order.notes || "-"}</p>
                                </div>
                              </div>

                              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                                <h3 className="text-sm font-semibold text-zinc-900">محتويات الطلب</h3>
                                <div className="mt-3 space-y-2">
                                  {(order.items || []).map((item) => (
                                    <div
                                      key={item.id}
                                      className="grid gap-2 rounded-xl border border-zinc-200 bg-gradient-to-r from-zinc-50 to-white p-3 text-sm md:grid-cols-[1fr_auto]"
                                    >
                                      <div>
                                        <p className="font-semibold text-zinc-900">{item.product?.name || "منتج"}</p>
                                        <p className="mt-1 text-xs text-zinc-500">
                                          Product ID: {item.productId?.slice(0, 8)}...
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2 text-center text-xs md:min-w-[250px]">
                                        <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">
                                          <p className="text-zinc-500">الكمية</p>
                                          <p className="mt-0.5 font-semibold text-zinc-800">{item.quantity}</p>
                                        </div>
                                        <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">
                                          <p className="text-zinc-500">السعر</p>
                                          <p className="mt-0.5 font-semibold text-zinc-800"><PriceDisplay value={item.price} currency="USD" usdToSypRate={1} compact /></p>
                                        </div>
                                        <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5">
                                          <p className="text-zinc-500">الإجمالي</p>
                                          <p className="mt-0.5 font-semibold text-rose-600"><PriceDisplay value={item.lineTotal} currency="USD" usdToSypRate={1} compact /></p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm">
                                  <span className="font-medium text-zinc-700">إجمالي الطلب</span>
                                  <span className="text-base font-semibold text-zinc-900"><PriceDisplay value={order.total} currency="USD" usdToSypRate={1} compact /></span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
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
