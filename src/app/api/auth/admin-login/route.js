import prisma from "@/lib/prisma";
import {
  createAuthToken,
  isAdmin,
  jsonResponse,
  normalizeEmail,
  sanitizeUser,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (!email || !password) {
      return jsonResponse(
        { success: false, message: "Email and password are required." },
        400,
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user?.password) {
      return jsonResponse({ success: false, message: "Invalid email or password." }, 401);
    }

    const passwordMatches = await verifyPassword(password, user.password);

    if (!passwordMatches) {
      return jsonResponse({ success: false, message: "Invalid email or password." }, 401);
    }

    if (!isAdmin(user)) {
      return jsonResponse({ success: false, message: "Admin access required." }, 403);
    }

    return jsonResponse({
      success: true,
      message: "Logged in successfully.",
      token: createAuthToken(user),
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ success: false, message: "Invalid JSON body." }, 400);
    }

    return jsonResponse({ success: false, message: "Unable to log in." }, 500);
  }
}
