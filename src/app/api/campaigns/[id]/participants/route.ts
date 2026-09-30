import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { participantBulkCreateSchema } from '@/lib/validations';
import { generateSecureToken, getClientInfo } from '@/lib/utils';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { jsonResponse, errorResponse } from '@/lib/security';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    const body = await request.json();
    const parsed = participantBulkCreateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid participant data', 400, parsed.error.flatten().fieldErrors);
    }

    const participantsData = parsed.data.participants.map((p) => ({
      employeeId: p.employeeId,
      employeeEmail: p.employeeEmail,
      department: p.department,
      campaignId: id,
      uniqueToken: generateSecureToken(),
      emailDelivered: false,
      emailOpened: false,
      landingPageVisited: false,
      loginAttempted: false,
      phishingReported: false,
    }));

    const result = await prisma.participant.createMany({
      data: participantsData,
    });

    const clientInfo = getClientInfo(request);
    await createAuditLog({
      adminId: session.adminId,
      action: AUDIT_ACTIONS.PARTICIPANT_BULK_ADD,
      resource: 'participant',
      resourceId: id,
      details: { count: result.count, campaignName: campaign.name },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return jsonResponse({ count: result.count }, 201);
  } catch (error) {
    console.error('Add participants error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;

    const participants = await prisma.participant.findMany({
      where: { campaignId: id },
      include: {
        events: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { lastSeenAt: 'desc' },
    });

    return jsonResponse({ participants });
  } catch (error) {
    console.error('Get campaign participants error:', error);
    return errorResponse('Internal server error', 500);
  }
}
