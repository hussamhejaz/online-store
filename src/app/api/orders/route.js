import prisma from "@/lib/prisma";
import { jsonResponse, requireAuth } from "@/lib/auth";
import { formatOrder, parseShippingData } from "@/lib/orders";

export async function GET(request) {
  const { user, response } = requireAuth(request);

  if (response) {
    return response;
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: { include: { product: { include: { category: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonResponse({
      success: true,
      data: orders.map(formatOrder),
    });
  } catch {
    return jsonResponse({ success: false, message: "Unable to fetch orders." }, 500);
  }
}

export async function POST(request) {
  const { user, response } = requireAuth(request);

  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const { data: shippingData, errors } = parseShippingData(body);

    if (errors.length > 0) {
      return jsonResponse({ success: false, message: errors.join(" ") }, 400);
    }

    const order = await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId: user.id },
        include: { product: true, variant: true },
        orderBy: { createdAt: "asc" },
      });

      if (cartItems.length === 0) {
        throw new Error("CART_EMPTY");
      }

      for (const item of cartItems) {
        if (!item.product.isActive) {
          throw new Error(`PRODUCT_UNAVAILABLE:${item.product.name}`);
        }

        if (item.quantity > (item.variant?.stock ?? item.product.stock)) {
          throw new Error(`INSUFFICIENT_STOCK:${item.product.name}`);
        }
      }

      const total = cartItems.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0,
      );

      const createdOrder = await tx.order.create({
        data: {
          userId: user.id,
          total,
          ...shippingData,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: { include: { product: { include: { category: true } } } },
        },
      });

      for (const item of cartItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({
        where: { userId: user.id },
      });

      return createdOrder;
    });

    return jsonResponse(
      {
        success: true,
        message: "Order created successfully.",
        data: formatOrder(order),
      },
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ success: false, message: "Invalid JSON body." }, 400);
    }

    if (error.message === "CART_EMPTY") {
      return jsonResponse({ success: false, message: "Cart is empty." }, 400);
    }

    if (error.message?.startsWith("PRODUCT_UNAVAILABLE:")) {
      const productName = error.message.split(":").slice(1).join(":");
      return jsonResponse(
        { success: false, message: `${productName} is no longer available.` },
        400,
      );
    }

    if (error.message?.startsWith("INSUFFICIENT_STOCK:")) {
      const productName = error.message.split(":").slice(1).join(":");
      return jsonResponse(
        { success: false, message: `Not enough stock for ${productName}.` },
        400,
      );
    }

    return jsonResponse({ success: false, message: "Unable to create order." }, 500);
  }
}
