import { jsonResponse, requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const { user, response } = requireAdmin(request);
  if (response) {
    return response;
  }

  return jsonResponse({
    success: true,
    user,
  });
}
