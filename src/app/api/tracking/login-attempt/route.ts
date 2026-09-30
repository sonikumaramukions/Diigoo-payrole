import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getClientInfo, generateSecureToken } from '@/lib/utils';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { jsonResponse, errorResponse } from '@/lib/security';

/**
 * Login-attempt tracking for the phishing simulation.
 *
 * The password is NEVER stored, logged, hashed, transmitted, or persisted.
 * The request body may contain a password field, but it is IMMEDIATELY
 * discarded and never referenced.
 *
 * Two modes:
 *  - token:      a per-participant unique link (/login?token=…)
 *  - campaignId: a single SHARED link for everyone (/login?c=<campaignId>).
 *                The person is identified by the email they enter.
 */
export async function POST(request: NextRequest) {
  try {
    const clientInfo = getClientInfo(request);

    const rateLimitKey = `tracking:login:${clientInfo.ipAddress}`;
    const rateLimit = await checkRateLimit(rateLimitKey, RATE_LIMITS.trackingLogin);
    if (!rateLimit.allowed) {
      return errorResponse('Too many requests', 429);
    }

    const body = await request.json();

    // Extract ONLY what we need. Password (body.password) is intentionally
    // NOT extracted and is never referenced.
    const token: string | undefined = body?.token;
    const campaignId: string | undefined = body?.campaignId;
    const emailEntered: string | undefined = body?.email;
    const now = new Date();

    // ---------- Mode 1: per-participant unique token ----------
    if (token && typeof token === 'string') {
      const participant = await prisma.participant.findUnique({
        where: { uniqueToken: token },
        include: { campaign: true },
      });
      if (!participant) return errorResponse('Invalid token', 404);
      if (!['RUNNING', 'SCHEDULED'].includes(participant.campaign.status)) {
        return errorResponse('Campaign is not active', 400);
      }
      if (!participant.campaign.trackingEnabled) {
        return jsonResponse({ success: true, redirect: '/portal' });
      }

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
        },
      });

      return jsonResponse({ success: true, redirect: `/portal?token=${token}` });
    }

    // ---------- Mode 2: shared campaign link ----------
    if (campaignId && typeof campaignId === 'string') {
      if (!emailEntered) {
        return errorResponse('Email is required', 400);
      }
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign) return errorResponse('Invalid campaign', 404);
      if (!['RUNNING', 'SCHEDULED'].includes(campaign.status)) {
        return errorResponse('Campaign is not active', 400);
      }
      if (!campaign.trackingEnabled) {
        return jsonResponse({ success: true, redirect: '/portal' });
      }

      // Identify the person by the email they entered (self-identification).
      // Re-submissions by the same email update the same row.
      const emailKey = emailEntered.trim().toLowerCase();
      let participant = await prisma.participant.findFirst({
        where: { campaignId, employeeEmail: emailKey },
      });
      if (!participant) {
        participant = await prisma.participant.create({
          data: {
            campaignId,
            employeeEmail: emailKey,
            employeeId: 'self-reported',
            department: 'Unknown',
            uniqueToken: generateSecureToken(),
            emailDelivered: true,
            landingPageVisited: true,
            firstSeenAt: now,
          },
        });
      }

      await prisma.participant.update({
        where: { id: participant.id },
        data: {
          loginAttempted: true,
          landingPageVisited: true,
          lastSeenAt: now,
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          browser: clientInfo.browser,
          operatingSystem: clientInfo.operatingSystem,
        },
      });
      await prisma.campaignEvent.create({
        data: {
          campaignId,
          participantId: participant.id,
          eventType: 'LOGIN_ATTEMPTED',
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          browser: clientInfo.browser,
          operatingSystem: clientInfo.operatingSystem,
          emailEntered: emailKey,
        },
      });

      return jsonResponse({ success: true, redirect: `/portal?token=${participant.uniqueToken}` });
    }

    return errorResponse('Invalid request', 400);
  } catch (error) {
    console.error(
      'Login attempt tracking error (no sensitive data logged):',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return errorResponse('Internal server error', 500);
  }
}
