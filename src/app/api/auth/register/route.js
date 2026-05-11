import prisma from "@/lib/prisma";
import {
  USER_ROLES,
  createAuthToken,
  hashPassword,
  jsonResponse,
  normalizeEmail,
  sanitizeUser,
} from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const phone = String(body.phone || "").trim();
    const name = `${firstName} ${lastName}`.trim();
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (!firstName || !lastName || !phone || !email || !password) {
      return jsonResponse(
        {
          success: false,
          message: "First name, last name, phone, email, and password are required.",
        },
        400,
      );
    }

    if (password.length < 8) {
      return jsonResponse(
        { success: false, message: "Password must be at least 8 characters." },
        400,
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return jsonResponse(
        { success: false, message: "An account with this email already exists." },
        409,
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        role: USER_ROLES.USER,
      },
    });

    await prisma.$executeRaw`
      UPDATE "User"
      SET "firstName" = ${firstName},
          "lastName" = ${lastName},
          "phone" = ${phone}
      WHERE "id" = ${user.id}
    `;

    const userWithProfile = await prisma.user.findUnique({
      where: { id: user.id },
    });

    return jsonResponse(
      {
        success: true,
        message: "Account created successfully.",
        token: createAuthToken(userWithProfile || user),
        user: sanitizeUser(userWithProfile || user),
      },
      201,
    );
  } catch (error) {
    if (error?.code === "P2002") {
      return jsonResponse(
        { success: false, message: "An account with this email already exists." },
        409,
      );
    }

    if (error instanceof SyntaxError) {
      return jsonResponse({ success: false, message: "Invalid JSON body." }, 400);
    }

    return jsonResponse({ success: false, message: "Unable to register user." }, 500);
  }
}
