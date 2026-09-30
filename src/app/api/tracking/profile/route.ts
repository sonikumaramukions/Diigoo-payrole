import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getClientInfo } from '@/lib/utils';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { jsonResponse, errorResponse } from '@/lib/security';

/**
 * Profile "save" from the simulated portal.
 *
 * Records ONLY the department the person selects (benign org info, used for
 * department-wise counselling) plus IP/device. Name/email typed here are NOT
 * stored, and no password is ever involved. Best-effort: never breaks the UX.
 */
export async function POST(request: NextRequest) {
  try {
    const clientInfo = getClientInfo(request);
    const rateLimit = await checkRateLimit(
      `tracking:profile:${clientInfo.ipAddress}`,
      RATE_LIMITS.trackingLogin
    );
    if (!rateLimit.allowed) return errorResponse('Too many requests', 429);

    const body = await request.json();
    const token: string | undefined = body?.token;
    const department: string | undefined = body?.department;

    if (!token || !department || !department.trim()) {
      return jsonResponse({ success: true });
    }

    const participant = await prisma.participant.findUnique({ where: { uniqueToken: token } });
    if (!participant) return jsonResponse({ success: true });

    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        department: department.trim(),
        lastSeenAt: new Date(),
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        browser: clientInfo.browser,
        operatingSystem: clientInfo.operatingSystem,
      },
    });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Profile update error:', error instanceof Error ? error.message : 'Unknown error');
    return jsonResponse({ success: true });
  }
}
