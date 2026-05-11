import prisma from "@/lib/prisma";
import { jsonResponse, requireAdmin } from "@/lib/auth";
import { formatCategory, parseCategoryData } from "@/lib/catalog";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return jsonResponse({ success: false, message: "Category not found." }, 404);
    }

    return jsonResponse({ success: true, data: formatCategory(category) });
  } catch {
    return jsonResponse({ success: false, message: "Unable to fetch category." }, 500);
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
    const { data, errors } = parseCategoryData(body, { partial: true });

    if (errors.length > 0) {
      return jsonResponse({ success: false, message: errors.join(" ") }, 400);
    }

    if (Object.keys(data).length === 0) {
      return jsonResponse({ success: false, message: "No valid fields provided." }, 400);
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingCategory) {
      return jsonResponse({ success: false, message: "Category not found." }, 404);
    }

    if (data.name || data.slug) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          NOT: { id },
          OR: [
            ...(data.name ? [{ name: data.name }] : []),
            ...(data.slug ? [{ slug: data.slug }] : []),
          ],
        },
        select: { id: true },
      });

      if (duplicateCategory) {
        return jsonResponse(
          { success: false, message: "A category with this name or slug already exists." },
          409,
        );
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    return jsonResponse({
      success: true,
      message: "Category updated successfully.",
      data: formatCategory(category),
    });
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

    return jsonResponse({ success: false, message: "Unable to update category." }, 500);
  }
}

export async function DELETE(request, { params }) {
  const { response } = requireAdmin(request);

  if (response) {
    return response;
  }

  try {
    const { id } = await params;
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingCategory) {
      return jsonResponse({ success: false, message: "Category not found." }, 404);
    }

    await prisma.category.delete({
      where: { id },
    });

    return jsonResponse({
      success: true,
      message: "Category deleted successfully.",
      data: { id },
    });
  } catch (error) {
    if (error?.code === "P2003") {
      return jsonResponse(
        { success: false, message: "Category cannot be deleted while products use it." },
        409,
      );
    }

    return jsonResponse({ success: false, message: "Unable to delete category." }, 500);
  }
}
