import prisma from "@/lib/prisma";
import { jsonResponse, normalizeEmail, requireAuth, sanitizeUser } from "@/lib/auth";

export async function GET(request) {
  const { user, response } = requireAuth(request);
  if (response) {
    return response;
  }

  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!profile) {
      return jsonResponse({ success: false, message: "User not found." }, 404);
    }

    return jsonResponse({ success: true, data: sanitizeUser(profile) });
  } catch {
    return jsonResponse({ success: false, message: "Unable to load account." }, 500);
  }
}

export async function PATCH(request) {
  const { user, response } = requireAuth(request);
  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const phone = String(body.phone || "").trim();
    const email = normalizeEmail(body.email);
    const name = `${firstName} ${lastName}`.trim();

    if (!firstName || !lastName || !phone || !email) {
      return jsonResponse(
        {
          success: false,
          message: "First name, last name, phone, and email are required.",
        },
        400,
      );
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingByEmail && existingByEmail.id !== user.id) {
      return jsonResponse(
        { success: false, message: "An account with this email already exists." },
        409,
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        phone,
        email,
        name,
      },
    });

    return jsonResponse({
      success: true,
      message: "Account updated successfully.",
      data: sanitizeUser(updated),
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ success: false, message: "Invalid JSON body." }, 400);
    }

    if (error?.code === "P2002") {
      return jsonResponse(
        { success: false, message: "An account with this email already exists." },
        409,
      );
    }

    return jsonResponse({ success: false, message: "Unable to update account." }, 500);
  }
}
