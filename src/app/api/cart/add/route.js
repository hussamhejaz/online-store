import prisma from "@/lib/prisma";
import { jsonResponse, requireAuth } from "@/lib/auth";
import { formatCartItem, parseQuantity } from "@/lib/orders";

export async function POST(request) {
  const { user, response } = requireAuth(request);

  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const productId = String(body.productId || "").trim();
    const color = body.color ? String(body.color).trim() : null;
    const size = body.size ? String(body.size).trim() : null;
    const quantity = parseQuantity(body.quantity ?? 1);

    if (!productId) {
      return jsonResponse({ success: false, message: "Product ID is required." }, 400);
    }

    if (!quantity) {
      return jsonResponse({ success: false, message: "Quantity must be at least 1." }, 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          where: { isActive: true },
        },
      },
    });

    if (!product || !product.isActive) {
      return jsonResponse({ success: false, message: "Product not found." }, 404);
    }

    const hasVariants = product.variants.length > 0;
    const selectedVariant = hasVariants
      ? product.variants.find((variant) => variant.color === color && variant.size === size)
      : null;

    if (hasVariants && !selectedVariant) {
      return jsonResponse({ success: false, message: "Selected color/size is not available." }, 400);
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId: user.id,
        productId,
        variantId: selectedVariant?.id || null,
      },
      select: { quantity: true },
    });

    const nextQuantity = (existingItem?.quantity || 0) + quantity;

    if (nextQuantity > (selectedVariant?.stock ?? product.stock)) {
      return jsonResponse({ success: false, message: "Product stock is not enough." }, 400);
    }

    let cartItem;
    if (existingItem) {
      cartItem = await prisma.cartItem.updateMany({
        where: {
          userId: user.id,
          productId,
          variantId: selectedVariant?.id || null,
        },
        data: { quantity: nextQuantity },
      });
      cartItem = await prisma.cartItem.findFirst({
        where: {
          userId: user.id,
          productId,
          variantId: selectedVariant?.id || null,
        },
        include: { product: { include: { category: true } }, variant: true },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId,
          variantId: selectedVariant?.id || null,
          color: selectedVariant?.color || color,
          size: selectedVariant?.size || size,
          quantity,
        },
        include: { product: { include: { category: true } }, variant: true },
      });
    }

    return jsonResponse(
      {
        success: true,
        message: "Product added to cart.",
        data: formatCartItem(cartItem),
      },
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ success: false, message: "Invalid JSON body." }, 400);
    }

    return jsonResponse({ success: false, message: "Unable to add product to cart." }, 500);
  }
}
