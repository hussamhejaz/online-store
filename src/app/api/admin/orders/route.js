import prisma from "@/lib/prisma";
import { jsonResponse, requireAdmin } from "@/lib/auth";
import { formatOrder } from "@/lib/orders";

export async function GET(request) {
  const { response } = requireAdmin(request);

  if (response) {
    return response;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = String(searchParams.get("status") || "").trim().toUpperCase();
    const archived = String(searchParams.get("archived") || "false").trim().toLowerCase();
    const search = String(searchParams.get("search") || "").trim();
    const isArchived = archived === "all" ? undefined : archived === "true";
    const whereBase = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search } },
              { city: { contains: search, mode: "insensitive" } },
              { address: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              {
                user: {
                  OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    let orders;
    try {
      orders = await prisma.order.findMany({
        where: {
          ...whereBase,
          ...(isArchived === undefined ? {} : { isArchived }),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: { include: { category: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      // Backward-compatible fallback when Prisma client/DB is not migrated yet.
      if (!String(error?.message || "").includes("Unknown argument `isArchived`")) {
        throw error;
      }
      orders = await prisma.order.findMany({
        where: whereBase,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: { include: { category: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });
      const ids = orders.map((order) => order.id);
      if (ids.length > 0) {
        const archiveRows = await prisma.$queryRaw`
          SELECT "id", "isArchived", "archivedAt"
          FROM "Order"
          WHERE "id" = ANY(${ids}::uuid[])
        `;
        const archiveById = new Map(
          (Array.isArray(archiveRows) ? archiveRows : []).map((row) => [
            row.id,
            {
              isArchived: Boolean(row.isArchived),
              archivedAt: row.archivedAt || null,
            },
          ]),
        );
        orders = orders.map((order) => ({
          ...order,
          isArchived: archiveById.get(order.id)?.isArchived || false,
          archivedAt: archiveById.get(order.id)?.archivedAt || null,
        }));
      }
      if (isArchived !== undefined) {
        orders = orders.filter((order) => Boolean(order.isArchived) === isArchived);
      }
    }

    return jsonResponse({
      success: true,
      data: orders.map(formatOrder),
    });
  } catch {
    return jsonResponse({ success: false, message: "Unable to fetch orders." }, 500);
  }
}
