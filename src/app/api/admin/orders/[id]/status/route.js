import prisma from "@/lib/prisma";
import { jsonResponse, requireAdmin } from "@/lib/auth";
import { formatOrder, isValidOrderStatus } from "@/lib/orders";

export async function PUT(request, { params }) {
  const { response } = requireAdmin(request);

  if (response) {
    return response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status || "").trim().toUpperCase();

    if (!isValidOrderStatus(status)) {
      return jsonResponse({ success: false, message: "Invalid order status." }, 400);
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingOrder) {
      return jsonResponse({ success: false, message: "Order not found." }, 404);
    }

    let order;
    try {
      order = await prisma.order.update({
        where: { id },
        data:
          status === "DELIVERED"
            ? {
                status,
                isArchived: true,
                archivedAt: new Date(),
              }
            : { status },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: { include: { category: true } } } },
        },
      });
    } catch (updateError) {
      if (!String(updateError?.message || "").includes("Unknown argument `isArchived`")) {
        throw updateError;
      }

      await prisma.order.update({
        where: { id },
        data: { status },
      });

      if (status === "DELIVERED") {
        await prisma.$executeRaw`
          UPDATE "Order"
          SET "isArchived" = true, "archivedAt" = NOW(), "updatedAt" = NOW()
          WHERE "id" = ${id}::uuid
        `;
      }

      const fallbackOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: { include: { category: true } } } },
        },
      });

      if (!fallbackOrder) {
        return jsonResponse({ success: false, message: "Order not found." }, 404);
      }

      order = {
        ...fallbackOrder,
        isArchived: status === "DELIVERED" ? true : fallbackOrder.isArchived,
        archivedAt: status === "DELIVERED" ? new Date() : fallbackOrder.archivedAt,
      };
    }

    return jsonResponse({
      success: true,
      message: "Order status updated.",
      data: formatOrder(order),
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ success: false, message: "Invalid JSON body." }, 400);
    }

    return jsonResponse({ success: false, message: "Unable to update order status." }, 500);
  }
}
