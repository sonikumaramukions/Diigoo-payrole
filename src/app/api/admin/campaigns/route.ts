import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { campaignCreateSchema } from '@/lib/validations';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { getClientInfo } from '@/lib/utils';
import { jsonResponse, errorResponse } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return errorResponse('Unauthorized', 401);

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { participants: true } },
        participants: {
          select: {
            landingPageVisited: true,
            loginAttempted: true,
            phishingReported: true,
          },
        },
      },
    });

    const result = campaigns.map((c) => {
      const total = c.participants.length;
      const visited = c.participants.filter((p) => p.landingPageVisited).length;
      const attempted = c.participants.filter((p) => p.loginAttempted).length;
      const reported = c.participants.filter((p) => p.phishingReported).length;
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        status: c.status,
        trackingEnabled: c.trackingEnabled,
        createdAt: c.createdAt,
        startDate: c.startDate,
        endDate: c.endDate,
        stats: { total, visited, attempted, reported },
      };
    });

    return jsonResponse({ campaigns: result });
  } catch (error) {
    console.error('List campaigns error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return errorResponse('Unauthorized', 401);

    const body = await request.json();
    const parsed = campaignCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid campaign data', 400, parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;
    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        emailSubject: data.emailSubject,
        landingPage: data.landingPage,
        trackingEnabled: data.trackingEnabled,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });

    const clientInfo = getClientInfo(request);
    await createAuditLog({
      adminId: session.adminId,
      action: AUDIT_ACTIONS.CAMPAIGN_CREATE,
      resource: 'campaign',
      resourceId: campaign.id,
      details: { name: campaign.name },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return jsonResponse({ campaign }, 201);
  } catch (error) {
    console.error('Create campaign error:', error);
    return errorResponse('Internal server error', 500);
  }
}
