import prisma from "@/lib/prisma";
import { jsonResponse, requireAdmin } from "@/lib/auth";
import { formatCategory, parseCategoryData } from "@/lib/catalog";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return jsonResponse({
      success: true,
      data: categories.map(formatCategory),
    });
  } catch {
    return jsonResponse({ success: false, message: "Unable to fetch categories." }, 500);
  }
}

export async function POST(request) {
  const { response } = requireAdmin(request);

  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const { data, errors } = parseCategoryData(body);

    if (errors.length > 0) {
      return jsonResponse({ success: false, message: errors.join(" ") }, 400);
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name: data.name }, { slug: data.slug }],
      },
      select: { id: true, name: true, slug: true },
    });

    if (existingCategory) {
      return jsonResponse(
        { success: false, message: "A category with this name or slug already exists." },
        409,
      );
    }

    const category = await prisma.category.create({
      data,
    });

    return jsonResponse(
      {
        success: true,
        message: "Category created successfully.",
        data: formatCategory(category),
      },
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ success: false, message: "Invalid JSON body." }, 400);
    }

    if (error?.code === "P2002") {
      return jsonResponse(
        { success: false, message: "A category with this name or slug already exists." },
        409,
      );
    }

    return jsonResponse({ success: false, message: "Unable to create category." }, 500);
  }
}
