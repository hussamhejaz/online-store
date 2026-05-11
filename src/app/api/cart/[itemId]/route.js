import prisma from "@/lib/prisma";
import { jsonResponse, requireAuth } from "@/lib/auth";
import { formatCartItem, parseQuantity } from "@/lib/orders";

export async function PUT(request, { params }) {
  const { user, response } = requireAuth(request);

  if (response) {
    return response;
  }

  try {
    const { itemId } = await params;
    const body = await request.json();
    const quantity = parseQuantity(body.quantity);

    if (!quantity) {
      return jsonResponse({ success: false, message: "Quantity must be at least 1." }, 400);
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, userId: user.id },
      include: { product: true, variant: true },
    });

    if (!cartItem) {
      return jsonResponse({ success: false, message: "Cart item not found." }, 404);
    }

    if (!cartItem.product.isActive) {
      return jsonResponse({ success: false, message: "Product is no longer available." }, 400);
    }

    if (quantity > (cartItem.variant?.stock ?? cartItem.product.stock)) {
      return jsonResponse({ success: false, message: "Product stock is not enough." }, 400);
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: { include: { category: true, variants: true } }, variant: true },
    });

    return jsonResponse({
      success: true,
      message: "Cart item updated.",
      data: formatCartItem(updatedItem),
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ success: false, message: "Invalid JSON body." }, 400);
    }

    return jsonResponse({ success: false, message: "Unable to update cart item." }, 500);
  }
}

export async function DELETE(request, { params }) {
  const { user, response } = requireAuth(request);

  if (response) {
    return response;
  }

  try {
    const { itemId } = await params;
    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, userId: user.id },
      select: { id: true },
    });

    if (!cartItem) {
      return jsonResponse({ success: false, message: "Cart item not found." }, 404);
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return jsonResponse({
      success: true,
      message: "Cart item removed.",
      data: { id: itemId },
    });
  } catch {
    return jsonResponse({ success: false, message: "Unable to remove cart item." }, 500);
  }
}
