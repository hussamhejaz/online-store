import prisma from "@/lib/prisma";
import { getAuthPayload, jsonResponse, requireAdmin } from "@/lib/auth";
import { formatProduct, parseProductData } from "@/lib/catalog";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true },
    });

    if (!product || !product.isActive) {
      return jsonResponse({ success: false, message: "Product not found." }, 404);
    }
    const authPayload = getAuthPayload(request);
    const soldStats = await prisma.orderItem.aggregate({
      where: { productId: id },
      _sum: { quantity: true },
    });
    const hasProductRatingModel = Boolean(prisma.productRating);
    const [ratingStats, recentRatings, myRating] = hasProductRatingModel
      ? await Promise.all([
          prisma.productRating.aggregate({
            where: { productId: id },
            _avg: { rating: true },
            _count: { rating: true },
          }),
          prisma.productRating.findMany({
            where: { productId: id },
            include: {
              user: {
                select: {
                  name: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          }),
          authPayload?.sub
            ? prisma.productRating.findUnique({
                where: {
                  productId_userId: {
                    productId: id,
                    userId: authPayload.sub,
                  },
                },
                select: {
                  rating: true,
                  review: true,
                },
              })
            : null,
        ])
      : await (async () => {
          const statsRows = await prisma.$queryRaw`
            SELECT COALESCE(AVG("rating"), 0) AS "avg", COUNT(*)::int AS "count"
            FROM "ProductRating"
            WHERE "productId" = ${id}::uuid
          `;
          const reviewsRows = await prisma.$queryRaw`
            SELECT
              r."id",
              r."rating",
              r."review",
              r."createdAt",
              u."name",
              u."firstName",
              u."lastName",
              u."email"
            FROM "ProductRating" r
            JOIN "User" u ON u."id" = r."userId"
            WHERE r."productId" = ${id}::uuid
            ORDER BY r."createdAt" DESC
            LIMIT 10
          `;
          const myRatingRows = authPayload?.sub
            ? await prisma.$queryRaw`
                SELECT "rating", "review"
                FROM "ProductRating"
                WHERE "productId" = ${id}::uuid AND "userId" = ${authPayload.sub}::uuid
                LIMIT 1
              `
            : [];
          const stats = Array.isArray(statsRows) ? statsRows[0] : null;
          const my = Array.isArray(myRatingRows) ? myRatingRows[0] : null;
          return [
            { _avg: { rating: Number(stats?.avg || 0) }, _count: { rating: Number(stats?.count || 0) } },
            Array.isArray(reviewsRows) ? reviewsRows : [],
            my ? { rating: my.rating, review: my.review } : null,
          ];
        })();
    const mappedRecentRatings = recentRatings.map((item) => {
      const derivedName =
        item.user?.name ||
        [item.user?.firstName, item.user?.lastName].filter(Boolean).join(" ").trim() ||
        item.user?.email?.split("@")?.[0] ||
        item.name ||
        [item.firstName, item.lastName].filter(Boolean).join(" ").trim() ||
        item.email?.split("@")?.[0] ||
        "User";

      return {
        id: item.id,
        rating: item.rating,
        review: item.review || "",
        createdAt: item.createdAt,
        author: derivedName,
      };
    });

    return jsonResponse({
      success: true,
      data: formatProduct({
        ...product,
        ratingAverage: ratingStats._avg.rating ?? 0,
        ratingCount: ratingStats._count.rating ?? 0,
        soldCount: soldStats._sum.quantity ?? 0,
        myRating,
      }),
      reviews: mappedRecentRatings,
    });
  } catch {
    return jsonResponse({ success: false, message: "Unable to fetch product." }, 500);
  }
}

export async function PUT(request, { params }) {
  const { response } = requireAdmin(request);

  if (response) {
    return response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { data, errors } = parseProductData(body, { partial: true });

    if (errors.length > 0) {
      return jsonResponse({ success: false, message: errors.join(" ") }, 400);
    }

    if (Object.keys(data).length === 0) {
      return jsonResponse({ success: false, message: "No valid fields provided." }, 400);
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });

    if (!existingProduct) {
      return jsonResponse({ success: false, message: "Product not found." }, 404);
    }

    const [category, duplicateProduct, vendor] = await Promise.all([
      data.categoryId
        ? prisma.category.findUnique({
            where: { id: data.categoryId },
            select: { id: true },
          })
        : null,
      data.slug && data.slug !== existingProduct.slug
        ? prisma.product.findUnique({
            where: { slug: data.slug },
            select: { id: true },
          })
        : null,
      data.vendorId
        ? prisma.user.findUnique({
            where: { id: data.vendorId },
            select: { id: true },
          })
        : null,
    ]);

    if (data.categoryId && !category) {
      return jsonResponse({ success: false, message: "Category not found." }, 404);
    }

    if (duplicateProduct) {
      return jsonResponse(
        { success: false, message: "A product with this slug already exists." },
        409,
      );
    }

    if (data.vendorId && !vendor) {
      return jsonResponse({ success: false, message: "Vendor not found." }, 404);
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        variants: data.variants
          ? {
              deleteMany: {},
              create: data.variants.map((variant) => ({
                color: variant.color,
                size: variant.size,
                imageUrl: variant.imageUrl,
                stock: variant.stock,
              })),
            }
          : undefined,
      },
      include: { category: true, variants: true },
    });

    return jsonResponse({
      success: true,
      message: "Product updated successfully.",
      data: formatProduct(product),
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ success: false, message: "Invalid JSON body." }, 400);
    }

    if (error?.code === "P2002") {
      return jsonResponse(
        { success: false, message: "A product with this slug already exists." },
        409,
      );
    }

    return jsonResponse({ success: false, message: "Unable to update product." }, 500);
  }
}

export async function DELETE(request, { params }) {
  const { response } = requireAdmin(request);

  if (response) {
    return response;
  }

  try {
    const { id } = await params;
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingProduct) {
      return jsonResponse({ success: false, message: "Product not found." }, 404);
    }

    const product = await prisma.product.delete({
      where: { id },
      include: { category: true, variants: true },
    });

    return jsonResponse({
      success: true,
      message: "Product deleted successfully.",
      data: formatProduct(product),
    });
  } catch (error) {
    if (error?.code === "P2003") {
      return jsonResponse(
        { success: false, message: "Product cannot be deleted while linked to orders." },
        409,
      );
    }

    return jsonResponse({ success: false, message: "Unable to delete product." }, 500);
  }
}
