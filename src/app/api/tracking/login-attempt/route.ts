import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getClientInfo } from '@/lib/utils';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { jsonResponse, errorResponse } from '@/lib/security';

/**
 * CRITICAL SECURITY REQUIREMENT:
 * This endpoint handles login attempt tracking for the phishing simulation.
 * 
 * The password is NEVER stored, logged, hashed, transmitted, or persisted
 * in any form. Only the fact that a login was attempted is recorded.
 * 
 * The request body may contain a password field from the form submission,
 * but it is IMMEDIATELY discarded and never referenced.
 */
export async function POST(request: NextRequest) {
  try {
    const clientInfo = getClientInfo(request);

    // Rate limiting
    const rateLimitKey = `tracking:login:${clientInfo.ipAddress}`;
    const rateLimit = await checkRateLimit(rateLimitKey, RATE_LIMITS.trackingLogin);
    if (!rateLimit.allowed) {
      return errorResponse('Too many requests', 429);
    }

    const body = await request.json();

    // ===================================================================
    // CRITICAL: Extract ONLY the fields we need. Password is DISCARDED.
    // We do NOT use the full body object anywhere after this point.
    // ===================================================================
    const token: string | undefined = body?.token;
    const emailEntered: string | undefined = body?.email;

    // The password field (body.password) is intentionally NOT extracted.
    // It exists only in the 'body' variable which is now dereferenced.
    // From this point forward, there is no reference to the password.

    if (!token || typeof token !== 'string') {
      return errorResponse('Invalid request', 400);
    }

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

    if (!participant.campaign.trackingEnabled) {
      return jsonResponse({ success: true, redirect: '/portal' });
    }

    const now = new Date();

    // Update participant - NOTE: No password data is included
    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        loginAttempted: true,
        lastSeenAt: now,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        browser: clientInfo.browser,
        operatingSystem: clientInfo.operatingSystem,
      },
    });

    // Create event - NOTE: No password data is included
    await prisma.campaignEvent.create({
      data: {
        campaignId: participant.campaignId,
        participantId: participant.id,
        eventType: 'LOGIN_ATTEMPTED',
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        browser: clientInfo.browser,
        operatingSystem: clientInfo.operatingSystem,
        emailEntered: emailEntered || null,
        // metadata does NOT contain password
      },
    });

    return jsonResponse({
      success: true,
      redirect: `/portal?token=${token}`,
    });
  } catch (error) {
    // CRITICAL: Error logging must NOT include request body (which may contain password)
    console.error('Login attempt tracking error (no sensitive data logged):', error instanceof Error ? error.message : 'Unknown error');
    return errorResponse('Internal server error', 500);
  }
}
