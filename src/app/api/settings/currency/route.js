import prisma from "@/lib/prisma";
import { jsonResponse, requireAdmin } from "@/lib/auth";

const SETTING_KEY = "usd_to_syp_rate";
const DEFAULT_RATE = 10000;
let ensuredTablePromise = null;

async function ensureSettingsTable() {
  if (!ensuredTablePromise) {
    ensuredTablePromise = prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AppConfig" (
        "key" TEXT PRIMARY KEY,
        "value" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  await ensuredTablePromise;
}

export async function GET() {
  try {
    await ensureSettingsTable();
    const rows = await prisma.$queryRawUnsafe(
      `SELECT "value" FROM "AppConfig" WHERE "key" = $1 LIMIT 1`,
      SETTING_KEY,
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    const parsed = Number(row?.value);
    const usdToSypRate = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RATE;

    return jsonResponse({
      success: true,
      data: { usdToSypRate },
    });
  } catch {
    return jsonResponse({ success: false, message: "Unable to load currency settings." }, 500);
  }
}

export async function PUT(request) {
  const { response } = requireAdmin(request);
  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const usdToSypRate = Number(body?.usdToSypRate);
    if (!Number.isFinite(usdToSypRate) || usdToSypRate <= 0) {
      return jsonResponse({ success: false, message: "usdToSypRate must be a positive number." }, 400);
    }

    await ensureSettingsTable();
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "AppConfig" ("key", "value", "updatedAt")
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT ("key")
      DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP
      `,
      SETTING_KEY,
      String(usdToSypRate),
    );

    return jsonResponse({
      success: true,
      message: "Currency settings updated.",
      data: { usdToSypRate },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ success: false, message: "Invalid JSON body." }, 400);
    }
    return jsonResponse({ success: false, message: "Unable to update currency settings." }, 500);
  }
}
