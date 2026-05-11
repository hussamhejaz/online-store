import prisma from "@/lib/prisma";
import {
  hashPassword,
  jsonResponse,
  normalizeEmail,
  normalizeSecretAnswer,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const secretAnswer = normalizeSecretAnswer(body.secretAnswer);
    const newPassword = String(body.newPassword || "");

    if (!email || !secretAnswer || !newPassword) {
      return jsonResponse(
        {
          success: false,
          message: "Email, secret answer, and new password are required.",
        },
        400,
      );
    }

    if (newPassword.length < 8) {
      return jsonResponse(
        { success: false, message: "Password must be at least 8 characters." },
        400,
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        secretQuestion: true,
        secretAnswerHash: true,
      },
    });

    if (!user?.secretQuestion || !user?.secretAnswerHash) {
      return jsonResponse(
        { success: false, message: "Recovery data not found for this account." },
        404,
      );
    }

    const answerMatches = await verifyPassword(secretAnswer, user.secretAnswerHash);

    if (!answerMatches) {
      return jsonResponse({ success: false, message: "Invalid recovery answer." }, 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(newPassword),
      },
    });

    return jsonResponse({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ success: false, message: "Invalid JSON body." }, 400);
    }

    return jsonResponse({ success: false, message: "Unable to reset password." }, 500);
  }
}
