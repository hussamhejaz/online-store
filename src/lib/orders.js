import { formatProduct } from "@/lib/catalog";

function formatOrderUser(user) {
  if (!user) {
    return undefined;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export const ORDER_STATUSES = Object.freeze({
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
});

export function parseQuantity(value) {
  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return null;
  }

  return quantity;
}

export function isValidOrderStatus(status) {
  return Object.values(ORDER_STATUSES).includes(status);
}

export function formatCartItem(item) {
  return {
    id: item.id,
    userId: item.userId,
    productId: item.productId,
    quantity: item.quantity,
    color: item.color || item.variant?.color || null,
    size: item.size || item.variant?.size || null,
    variantId: item.variantId || item.variant?.id || null,
    product: item.product ? formatProduct(item.product) : undefined,
    lineTotal: item.product ? Number(item.product.price) * item.quantity : undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function formatCart(items) {
  const formattedItems = items.map(formatCartItem);
  const total = formattedItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

  return {
    items: formattedItems,
    total,
  };
}

export function formatOrderItem(item) {
  return {
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    quantity: item.quantity,
    price: Number(item.price),
    product: item.product ? formatProduct(item.product) : undefined,
    lineTotal: Number(item.price) * item.quantity,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function formatOrder(order) {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    isArchived: Boolean(order.isArchived),
    archivedAt: order.archivedAt || null,
    total: Number(order.total),
    city: order.city,
    address: order.address,
    phone: order.phone,
    notes: order.notes,
    user: formatOrderUser(order.user),
    items: order.items ? order.items.map(formatOrderItem) : undefined,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function parseShippingData(body) {
  const city = String(body.city || "").trim();
  const address = String(body.address || "").trim();
  const phone = String(body.phone || "").trim();
  const notes = body.notes ? String(body.notes).trim() : null;
  const errors = [];

  if (!city) {
    errors.push("City is required.");
  }

  if (!address) {
    errors.push("Address is required.");
  }

  if (!phone) {
    errors.push("Phone is required.");
  }

  return {
    data: { city, address, phone, notes },
    errors,
  };
}
