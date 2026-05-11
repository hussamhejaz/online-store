import prisma from "@/lib/prisma";
import { jsonResponse, requireAuth } from "@/lib/auth";

function parseRatingBody(body) {
  const value = Number(body?.rating);
  const review = body?.review === undefined ? null : String(body.review || "").trim();

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return { error: "Rating must be an integer between 1 and 5.", data: null };
  }

  return {
    error: null,
    data: {
      rating: value,
      review: review || null,
    },
  };
}

export async function POST(request, { params }) {
  const { user, response } = requireAuth(request);

  if (response) {
    return response;
  }

  try {
    const { id: productId } = await params;
    const body = await request.json();
    const { error, data } = parseRatingBody(body);

    if (error) {
      return jsonResponse({ success: false, message: error }, 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true },
    });
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!product || !product.isActive) {
      return jsonResponse({ success: false, message: "Product not found." }, 404);
    }
    if (!existingUser) {
      return jsonResponse({ success: false, message: "User not found. Please login again." }, 401);
    }

    const ratingModel = prisma.productRating;
    let rating;
    let ratingAverage = 0;
    let ratingCount = 0;

    if (ratingModel) {
      const existingRating = await ratingModel.findFirst({
        where: {
          productId,
          userId: user.id,
        },
        select: { id: true },
      });

      rating = existingRating
        ? await ratingModel.update({
            where: { id: existingRating.id },
            data,
          })
        : await ratingModel.create({
            data: {
              ...data,
              productId,
              userId: user.id,
            },
          });

      const stats = await ratingModel.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      ratingAverage = Number((stats._avg.rating ?? 0).toFixed(1));
      ratingCount = stats._count.rating ?? 0;
    } else {
      const existingRows = await prisma.$queryRaw`
        SELECT "id"
        FROM "ProductRating"
        WHERE "productId" = ${productId}::uuid AND "userId" = ${user.id}::uuid
        LIMIT 1
      `;
      const existing = Array.isArray(existingRows) ? existingRows[0] : null;

      if (existing?.id) {
        const updatedRows = await prisma.$queryRaw`
          UPDATE "ProductRating"
          SET "rating" = ${data.rating}, "review" = ${data.review}, "updatedAt" = NOW()
          WHERE "id" = ${existing.id}::uuid
          RETURNING "rating", "review"
        `;
        rating = Array.isArray(updatedRows) ? updatedRows[0] : { rating: data.rating, review: data.review };
      } else {
        const newId = crypto.randomUUID();
        const insertedRows = await prisma.$queryRaw`
          INSERT INTO "ProductRating" ("id", "productId", "userId", "rating", "review", "createdAt", "updatedAt")
          VALUES (${newId}::uuid, ${productId}::uuid, ${user.id}::uuid, ${data.rating}, ${data.review}, NOW(), NOW())
          RETURNING "rating", "review"
        `;
        rating = Array.isArray(insertedRows) ? insertedRows[0] : { rating: data.rating, review: data.review };
      }

      const statsRows = await prisma.$queryRaw`
        SELECT COALESCE(AVG("rating"), 0) AS "avg", COUNT(*)::int AS "count"
        FROM "ProductRating"
        WHERE "productId" = ${productId}::uuid
      `;
      const stats = Array.isArray(statsRows) ? statsRows[0] : null;
      ratingAverage = Number(Number(stats?.avg || 0).toFixed(1));
      ratingCount = Number(stats?.count || 0);
    }

    return jsonResponse({
      success: true,
      message: "Rating saved successfully.",
      data: {
        rating: rating.rating,
        review: rating.review,
        ratingAverage,
        ratingCount,
      },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ success: false, message: "Invalid JSON body." }, 400);
    }

    if (error?.code === "P2003") {
      return jsonResponse(
        { success: false, message: "Rating could not be saved due to invalid product/user reference." },
        400,
      );
    }

    if (error?.code === "P2025") {
      return jsonResponse({ success: false, message: "Related record was not found." }, 404);
    }

    return jsonResponse(
      { success: false, message: error?.message || "Unable to save rating." },
      500,
    );
  }
}
