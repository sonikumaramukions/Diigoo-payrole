import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { campaignCreateSchema } from '@/lib/validations';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { getClientInfo } from '@/lib/utils';
import { jsonResponse, errorResponse } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Prisma.CampaignWhereInput = {};
    if (status) {
      where.status = status as Prisma.CampaignWhereInput['status'];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          _count: {
            select: {
              participants: true,
              events: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count({
        where,
      }),
    ]);

    return jsonResponse({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const parsed = campaignCreateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid campaign data', 400, parsed.error.flatten().fieldErrors);
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        emailSubject: parsed.data.emailSubject,
        landingPage: parsed.data.landingPage,
        trackingEnabled: parsed.data.trackingEnabled,
        status: parsed.data.status,
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
