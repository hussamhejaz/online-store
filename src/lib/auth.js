import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const USER_ROLES = Object.freeze({
  ADMIN: "ADMIN",
  USER: "USER",
  VENDOR: "VENDOR",
});

const JWT_EXPIRES_IN = "7d";
const PASSWORD_SALT_ROUNDS = 12;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return secret;
}

export function isValidRole(role) {
  return Object.values(USER_ROLES).includes(role);
}

export function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function normalizeSecretAnswer(answer) {
  return String(answer || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function hashPassword(password) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

export function createAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret());
}

export function getBearerToken(request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export function getAuthPayload(request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAuthToken(token);

    if (!payload?.sub || !isValidRole(payload.role)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function requireAuth(request) {
  const payload = getAuthPayload(request);

  if (!payload) {
    return {
      user: null,
      response: jsonResponse({ success: false, message: "Unauthorized." }, 401),
    };
  }

  return {
    user: {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    },
    response: null,
  };
}

export function isAdmin(user) {
  return user?.role === USER_ROLES.ADMIN;
}

export function requireAdmin(request) {
  const { user, response } = requireAuth(request);

  if (response) {
    return { user: null, response };
  }

  if (!isAdmin(user)) {
    return {
      user,
      response: jsonResponse({ success: false, message: "Admin access required." }, 403),
    };
  }

  return { user, response: null };
}

export function jsonResponse(body, status = 200) {
  return Response.json(body, { status });
}
