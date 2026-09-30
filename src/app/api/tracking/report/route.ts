import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { trackingReportSchema } from '@/lib/validations';
import { getClientInfo } from '@/lib/utils';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { jsonResponse, errorResponse } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const clientInfo = getClientInfo(request);

    // Rate limiting
    const rateLimitKey = `tracking:report:${clientInfo.ipAddress}`;
    const rateLimit = await checkRateLimit(rateLimitKey, RATE_LIMITS.trackingReport);
    if (!rateLimit.allowed) {
      return errorResponse('Too many requests', 429);
    }

    const body = await request.json();
    const parsed = trackingReportSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid request', 400);
    }

    const { token } = parsed.data;

    // Find participant by token
    const participant = await prisma.participant.findUnique({
      where: { uniqueToken: token },
      include: { campaign: true },
    });

    if (!participant) {
      return errorResponse('Invalid token', 404);
    }

    const now = new Date();

    // Update participant
    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        phishingReported: true,
        lastSeenAt: now,
      },
    });

    // Create event
    await prisma.campaignEvent.create({
      data: {
        campaignId: participant.campaignId,
        participantId: participant.id,
        eventType: 'PHISHING_REPORTED',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        browser: clientInfo.browser,
        operatingSystem: clientInfo.operatingSystem,
      },
    });

    return jsonResponse({
      success: true,
      message: 'Thank you for reporting this suspicious email. Your security awareness is appreciated.',
    });
  } catch (error) {
    console.error('Report tracking error:', error);
    return errorResponse('Internal server error', 500);
  }
}
