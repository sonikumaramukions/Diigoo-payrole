import { NextRequest } from 'next/server';
import argon2 from 'argon2';
import prisma from '@/lib/prisma';
import { adminLoginSchema } from '@/lib/validations';
import { createSession, setSessionCookie } from '@/lib/auth';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { getClientInfo } from '@/lib/utils';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { jsonResponse, errorResponse } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const clientInfo = getClientInfo(request);

    // Rate limiting
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

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return errorResponse('Invalid email or password', 401);
    }

    // Verify password
    const isValid = await argon2.verify(admin.passwordHash, password);

    if (!isValid) {
      return errorResponse('Invalid email or password', 401);
    }

    // Create session
    const token = await createSession(admin.id, admin.email, admin.name);
    await setSessionCookie(token);

    // Update last login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
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
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
