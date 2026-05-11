export function createSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCategory(category) {
  if (!category) {
    return null;
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    sortOrder: Number(category.sortOrder || 0),
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export function formatProduct(product) {
  if (!product) {
    return null;
  }

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const variantColors = [...new Set(variants.map((variant) => variant.color).filter(Boolean))];
  const variantSizes = [...new Set(variants.map((variant) => variant.size).filter(Boolean))];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice === null ? null : Number(product.compareAtPrice),
    image: product.imageUrl,
    images: product.images,
    colors: variantColors.length > 0 ? variantColors : product.colors,
    sizes: variantSizes.length > 0 ? variantSizes : product.sizes,
    variants: variants.map((variant) => ({
      id: variant.id,
      color: variant.color,
      size: variant.size,
      image: variant.imageUrl || product.imageUrl || null,
      stock: Number(variant.stock || 0),
      isActive: Boolean(variant.isActive),
    })),
    categoryId: product.categoryId,
    stock: product.stock,
    isActive: product.isActive,
    vendorId: product.vendorId,
    category: product.category ? formatCategory(product.category) : undefined,
    ratingAverage:
      typeof product.ratingAverage === "number" ? Number(product.ratingAverage.toFixed(1)) : 0,
    ratingCount: Number(product.ratingCount || 0),
    soldCount: Number(product.soldCount || 0),
    myRating: product.myRating
      ? {
          rating: product.myRating.rating,
          review: product.myRating.review || "",
        }
      : null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function parseCategoryData(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || body.name !== undefined) {
    const name = String(body.name || "").trim();

    if (!name) {
      errors.push("Name is required.");
    } else {
      data.name = name;
    }
  }

  if (!partial || body.slug !== undefined || data.name) {
    const rawSlug = body.slug === undefined ? data.name : body.slug;
    const slug = createSlug(rawSlug);

    if (!slug) {
      errors.push("Slug is required.");
    } else {
      data.slug = slug;
    }
  }

  if (body.description !== undefined) {
    data.description = body.description ? String(body.description).trim() : null;
  }

  if (body.image !== undefined) {
    data.image = body.image ? String(body.image).trim() : null;
  }

  if (body.sortOrder !== undefined) {
    const sortOrder = Number(body.sortOrder);
    if (!Number.isInteger(sortOrder)) {
      errors.push("Sort order must be an integer.");
    } else {
      data.sortOrder = sortOrder;
    }
  }

  return { data, errors };
}

export function parseProductData(body, { partial = false } = {}) {
  const errors = [];
  const data = {};
  const MAX_GALLERY_IMAGES = 6;

  if (!partial || body.name !== undefined) {
    const name = String(body.name || "").trim();

    if (!name) {
      errors.push("Name is required.");
    } else {
      data.name = name;
    }
  }

  if (!partial || body.slug !== undefined || data.name) {
    const rawSlug = body.slug === undefined ? data.name : body.slug;
    const slug = createSlug(rawSlug);

    if (!slug) {
      errors.push("Slug is required.");
    } else {
      data.slug = slug;
    }
  }

  if (!partial || body.price !== undefined) {
    const price = Number(body.price);

    if (!Number.isFinite(price) || price < 0) {
      errors.push("Price must be a valid positive number.");
    } else {
      data.price = price;
    }
  }

  if (body.compareAtPrice !== undefined) {
    if (body.compareAtPrice === null || body.compareAtPrice === "") {
      data.compareAtPrice = null;
    } else {
      const compareAtPrice = Number(body.compareAtPrice);

      if (!Number.isFinite(compareAtPrice) || compareAtPrice < 0) {
        errors.push("Compare-at price must be a valid positive number.");
      } else {
        data.compareAtPrice = compareAtPrice;
      }
    }
  }

  if (!partial || body.categoryId !== undefined) {
    const categoryId = String(body.categoryId || "").trim();

    if (!categoryId) {
      errors.push("Category ID is required.");
    } else {
      data.categoryId = categoryId;
    }
  }

  if (body.description !== undefined) {
    data.description = body.description ? String(body.description).trim() : null;
  }

  if (body.image !== undefined) {
    data.imageUrl = body.image ? String(body.image).trim() : null;
  }

  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) {
      errors.push("Images must be an array.");
    } else {
      data.images = body.images.map((image) => String(image).trim()).filter(Boolean);
      if (data.images.length > MAX_GALLERY_IMAGES) {
        errors.push(`Images must not exceed ${MAX_GALLERY_IMAGES}.`);
      }
    }
  }

  if (body.colors !== undefined) {
    if (!Array.isArray(body.colors)) {
      errors.push("Colors must be an array.");
    } else {
      data.colors = body.colors.map((color) => String(color).trim()).filter(Boolean);
    }
  }

  if (body.sizes !== undefined) {
    if (!Array.isArray(body.sizes)) {
      errors.push("Sizes must be an array.");
    } else {
      data.sizes = body.sizes.map((size) => String(size).trim()).filter(Boolean);
    }
  }

  if (body.stock !== undefined) {
    const stock = Number(body.stock);

    if (!Number.isInteger(stock) || stock < 0) {
      errors.push("Stock must be a non-negative integer.");
    } else {
      data.stock = stock;
    }
  } else if (!partial) {
    data.stock = 0;
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      errors.push("isActive must be a boolean.");
    } else {
      data.isActive = body.isActive;
    }
  }

  if (body.vendorId !== undefined) {
    data.vendorId = body.vendorId ? String(body.vendorId).trim() : null;
  }

  if (body.variants !== undefined) {
    if (!Array.isArray(body.variants)) {
      errors.push("Variants must be an array.");
    } else {
      const parsedVariants = body.variants
        .map((variant) => ({
          color: String(variant?.color || "").trim(),
          size: String(variant?.size || "").trim(),
          imageUrl: variant?.image ? String(variant.image).trim() : null,
          stock: Number(variant?.stock ?? 0),
        }))
        .filter((variant) => variant.color && variant.size);

      for (const variant of parsedVariants) {
        if (!Number.isInteger(variant.stock) || variant.stock < 0) {
          errors.push("Each variant stock must be a non-negative integer.");
          break;
        }
      }

      const seen = new Set();
      for (const variant of parsedVariants) {
        const key = `${variant.color}::${variant.size}`;
        if (seen.has(key)) {
          errors.push("Variant color-size combinations must be unique.");
          break;
        }
        seen.add(key);
      }

      if (!errors.length) {
        data.variants = parsedVariants;
        data.colors = [...new Set(parsedVariants.map((variant) => variant.color))];
        data.sizes = [...new Set(parsedVariants.map((variant) => variant.size))];
        data.stock = parsedVariants.reduce((sum, variant) => sum + variant.stock, 0);
        if (!data.imageUrl) {
          data.imageUrl = parsedVariants.find((variant) => variant.imageUrl)?.imageUrl || null;
        }
      }
    }
  }

  return { data, errors };
}
