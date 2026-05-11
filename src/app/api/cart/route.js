import prisma from "@/lib/prisma";
import { jsonResponse, requireAuth } from "@/lib/auth";
import { formatCart } from "@/lib/orders";

export async function GET(request) {
  const { user, response } = requireAuth(request);

  if (response) {
    return response;
  }

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: { include: { category: true, variants: true } }, variant: true },
      orderBy: { createdAt: "desc" },
    });

    return jsonResponse({
      success: true,
      data: formatCart(cartItems),
    });
  } catch {
    return jsonResponse({ success: false, message: "Unable to fetch cart." }, 500);
  }
}
