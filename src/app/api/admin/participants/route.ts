import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { participantCreateSchema } from '@/lib/validations';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { generateSecureToken, getClientInfo } from '@/lib/utils';
import { jsonResponse, errorResponse } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Prisma.ParticipantWhereInput = {};

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (department) {
      where.department = department;
    }

    if (status === 'attempted') {
      where.loginAttempted = true;
    } else if (status === 'visited') {
      where.landingPageVisited = true;
      where.loginAttempted = false;
    } else if (status === 'reported') {
      where.phishingReported = true;
    } else if (status === 'delivered') {
      where.emailDelivered = true;
      where.landingPageVisited = false;
    }

    if (search) {
      where.OR = [
        { employeeEmail: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [participants, total] = await Promise.all([
      prisma.participant.findMany({
        where,
        include: {
          campaign: { select: { name: true, status: true } },
          events: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { lastSeenAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.participant.count({
        where,
      }),
    ]);

    return jsonResponse({
      participants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get participants error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return errorResponse('Unauthorized', 401);

    const body = await request.json();
    const campaignId: string | undefined = body?.campaignId;
    const parsed = participantCreateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid participant data', 400, parsed.error.flatten().fieldErrors);
    }
    if (!campaignId) {
      return errorResponse('campaignId is required', 400);
    }

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    const participant = await prisma.participant.create({
      data: {
        employeeId: parsed.data.employeeId,
        employeeEmail: parsed.data.employeeEmail,
        department: parsed.data.department,
        campaignId,
        uniqueToken: generateSecureToken(),
        emailDelivered: true,
      },
    });

    const clientInfo = getClientInfo(request);
    await createAuditLog({
      adminId: session.adminId,
      action: AUDIT_ACTIONS.PARTICIPANT_ADD,
      resource: 'participant',
      resourceId: participant.id,
      details: { employeeEmail: participant.employeeEmail, campaignId },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return jsonResponse({ participant }, 201);
  } catch (error) {
    console.error('Create participant error:', error);
    return errorResponse('Internal server error', 500);
  }
}
