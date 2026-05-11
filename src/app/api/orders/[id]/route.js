import prisma from "@/lib/prisma";
import { jsonResponse, requireAuth } from "@/lib/auth";
import { formatOrder } from "@/lib/orders";

export async function GET(request, { params }) {
  const { user, response } = requireAuth(request);

  if (response) {
    return response;
  }

  try {
    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: {
        items: { include: { product: { include: { category: true } } } },
      },
    });

    if (!order) {
      return jsonResponse({ success: false, message: "Order not found." }, 404);
    }

    return jsonResponse({
      success: true,
      data: formatOrder(order),
    });
  } catch {
    return jsonResponse({ success: false, message: "Unable to fetch order." }, 500);
  }
}
