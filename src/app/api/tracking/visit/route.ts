import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { trackingVisitSchema } from '@/lib/validations';
import { getClientInfo } from '@/lib/utils';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { jsonResponse, errorResponse } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const clientInfo = getClientInfo(request);

    // Rate limiting
    const rateLimitKey = `tracking:visit:${clientInfo.ipAddress}`;
    const rateLimit = await checkRateLimit(rateLimitKey, RATE_LIMITS.trackingVisit);
    if (!rateLimit.allowed) {
      return errorResponse('Too many requests', 429);
    }

    const body = await request.json();
    const parsed = trackingVisitSchema.safeParse(body);

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

    // Check if campaign is active
    if (!['RUNNING', 'SCHEDULED'].includes(participant.campaign.status)) {
      return errorResponse('Campaign is not active', 400);
    }

    // Check if tracking is enabled
    if (!participant.campaign.trackingEnabled) {
      return jsonResponse({ success: true });
    }

    const now = new Date();

    // Update participant
    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        landingPageVisited: true,
        firstSeenAt: participant.firstSeenAt || now,
        lastSeenAt: now,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        browser: clientInfo.browser,
        operatingSystem: clientInfo.operatingSystem,
      },
    });

    // Create event
    await prisma.campaignEvent.create({
      data: {
        campaignId: participant.campaignId,
        participantId: participant.id,
        eventType: 'LANDING_PAGE_VISITED',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        browser: clientInfo.browser,
        operatingSystem: clientInfo.operatingSystem,
      },
    });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Tracking visit error:', error);
    return errorResponse('Internal server error', 500);
  }
}
