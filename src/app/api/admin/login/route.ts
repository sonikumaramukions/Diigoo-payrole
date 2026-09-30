import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { adminLoginSchema } from '@/lib/validations';
import { createSession, setSessionCookie } from '@/lib/auth';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { getClientInfo } from '@/lib/utils';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { jsonResponse, errorResponse } from '@/lib/security';

/**
 * Admin auth is env-based: credentials live in ADMIN_EMAIL / ADMIN_PASSWORD.
 * On success we upsert an Admin row (for a stable session identity + audit-log
 * foreign key) — so no manual seeding of an admin is needed.
 */
export async function POST(request: NextRequest) {
  try {
    const clientInfo = getClientInfo(request);

    const rateLimitKey = `admin:login:${clientInfo.ipAddress}`;
    const rateLimit = await checkRateLimit(rateLimitKey, RATE_LIMITS.adminLogin);
    if (!rateLimit.allowed) {
      return errorResponse('Too many login attempts. Please try again later.', 429);
    }

    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid credentials', 400, parsed.error.flatten().fieldErrors);
    }
    const { email, password } = parsed.data;

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return errorResponse(
        'Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD.',
        500
      );
    }

    const emailOk = email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
    const passOk = password === ADMIN_PASSWORD;
    if (!emailOk || !passOk) {
      return errorResponse('Invalid email or password', 401);
    }

    // Ensure an Admin row exists (session identity + audit-log FK).
    const admin = await prisma.admin.upsert({
      where: { email: ADMIN_EMAIL },
      update: { lastLoginAt: new Date() },
      create: {
        email: ADMIN_EMAIL,
        name: 'Administrator',
        passwordHash: 'env-managed',
        lastLoginAt: new Date(),
      },
    });

    const token = await createSession(admin.id, admin.email, admin.name);
    await setSessionCookie(token);

    await createAuditLog({
      adminId: admin.id,
      action: AUDIT_ACTIONS.LOGIN,
      resource: 'admin',
      resourceId: admin.id,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return jsonResponse({
      success: true,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
