import prisma from "@/lib/prisma";
import { jsonResponse, normalizeEmail } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);

    if (!email) {
      return jsonResponse({ success: false, message: "Email is required." }, 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        secretQuestion: true,
      },
    });

    if (!user?.secretQuestion) {
      return jsonResponse(
        { success: false, message: "Recovery data not found for this account." },
        404,
      );
    }

    return jsonResponse({
      success: true,
      question: user.secretQuestion,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ success: false, message: "Invalid JSON body." }, 400);
    }

    return jsonResponse({ success: false, message: "Unable to get recovery question." }, 500);
  }
}
