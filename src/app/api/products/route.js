import prisma from "@/lib/prisma";
import { jsonResponse, requireAdmin } from "@/lib/auth";
import { formatProduct, parseProductData } from "@/lib/catalog";

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const includeInactive = searchParams.get("includeInactive") === "true";
    const price = {};

    if (includeInactive) {
      const { response } = requireAdmin(request);

      if (response) {
        return response;
      }
    }

    if (minPrice !== null) {
      const value = Number(minPrice);

      if (!Number.isFinite(value) || value < 0) {
        return jsonResponse({ success: false, message: "minPrice must be a valid number." }, 400);
      }

      price.gte = value;
    }

    if (maxPrice !== null) {
      const value = Number(maxPrice);

      if (!Number.isFinite(value) || value < 0) {
        return jsonResponse({ success: false, message: "maxPrice must be a valid number." }, 400);
      }

      price.lte = value;
    }

    const products = await prisma.product.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(categoryId ? { categoryId } : {}),
        ...(Object.keys(price).length > 0 ? { price } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { category: true, variants: true },
      orderBy: { createdAt: "desc" },
    });
    const hasProductRatingModel = Boolean(prisma.productRating);
    const productIds = products.map((product) => product.id);
    const ratingGroups =
      hasProductRatingModel && productIds.length > 0
        ? await prisma.productRating.groupBy({
            by: ["productId"],
            where: { productId: { in: productIds } },
            _avg: { rating: true },
            _count: { rating: true },
          })
        : productIds.length > 0
          ? await prisma.$queryRaw`
              SELECT "productId", COALESCE(AVG("rating"), 0) AS "avg", COUNT(*)::int AS "count"
              FROM "ProductRating"
              WHERE "productId" = ANY(${productIds}::uuid[])
              GROUP BY "productId"
            `
          : [];
    const ratingsByProductId = new Map(
      ratingGroups.map((group) => [
        group.productId,
        {
          ratingAverage: Number(group._avg?.rating ?? group.avg ?? 0),
          ratingCount: Number(group._count?.rating ?? group.count ?? 0),
        },
      ]),
    );

    return jsonResponse({
      success: true,
      data: products.map((product) =>
        formatProduct({
          ...product,
          ...(ratingsByProductId.get(product.id) || {
            ratingAverage: 0,
            ratingCount: 0,
          }),
        }),
      ),
    });
  } catch {
    return jsonResponse({ success: false, message: "Unable to fetch products." }, 500);
  }
}

export async function POST(request) {
  const { response } = requireAdmin(request);

  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const { data, errors } = parseProductData(body);

    if (errors.length > 0) {
      return jsonResponse({ success: false, message: errors.join(" ") }, 400);
    }

    const [category, existingProduct, vendor] = await Promise.all([
      prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      }),
      prisma.product.findUnique({
        where: { slug: data.slug },
        select: { id: true },
      }),
      data.vendorId
        ? prisma.user.findUnique({
            where: { id: data.vendorId },
            select: { id: true },
          })
        : null,
    ]);

    if (!category) {
      return jsonResponse({ success: false, message: "Category not found." }, 404);
    }

    if (existingProduct) {
      return jsonResponse(
        { success: false, message: "A product with this slug already exists." },
        409,
      );
    }

    if (data.vendorId && !vendor) {
      return jsonResponse({ success: false, message: "Vendor not found." }, 404);
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        variants: data.variants
          ? {
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

    return jsonResponse(
      {
        success: true,
        message: "Product created successfully.",
        data: formatProduct(product),
      },
      201,
    );
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

    return jsonResponse({ success: false, message: "Unable to create product." }, 500);
  }
}
