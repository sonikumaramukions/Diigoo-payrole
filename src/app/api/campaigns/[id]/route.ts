import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { campaignUpdateSchema } from '@/lib/validations';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { getClientInfo } from '@/lib/utils';
import { jsonResponse, errorResponse } from '@/lib/security';

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

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        participants: {
          orderBy: { lastSeenAt: 'desc' },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        _count: {
          select: {
            participants: true,
            events: true,
          },
        },
      },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    return jsonResponse({ campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = campaignUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid campaign data', 400, parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Campaign not found', 404);
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.startDate !== undefined) updateData.startDate = new Date(parsed.data.startDate);
    if (parsed.data.endDate !== undefined) updateData.endDate = new Date(parsed.data.endDate);
    if (parsed.data.emailSubject !== undefined) updateData.emailSubject = parsed.data.emailSubject;
    if (parsed.data.landingPage !== undefined) updateData.landingPage = parsed.data.landingPage;
    if (parsed.data.trackingEnabled !== undefined) updateData.trackingEnabled = parsed.data.trackingEnabled;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData as Parameters<typeof prisma.campaign.update>[0]['data'],
    });

    const clientInfo = getClientInfo(request);
    await createAuditLog({
      adminId: session.adminId,
      action: AUDIT_ACTIONS.CAMPAIGN_UPDATE,
      resource: 'campaign',
      resourceId: campaign.id,
      details: { changes: Object.keys(updateData) },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return jsonResponse({ campaign });
  } catch (error) {
    console.error('Update campaign error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Campaign not found', 404);
    }

    await prisma.campaign.delete({ where: { id } });

    const clientInfo = getClientInfo(request);
    await createAuditLog({
      adminId: session.adminId,
      action: AUDIT_ACTIONS.CAMPAIGN_DELETE,
      resource: 'campaign',
      resourceId: id,
      details: { name: existing.name },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Delete campaign error:', error);
    return errorResponse('Internal server error', 500);
  }
}
