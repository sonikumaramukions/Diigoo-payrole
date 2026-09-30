import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { getClientInfo } from '@/lib/utils';
import { jsonResponse, errorResponse } from '@/lib/security';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return errorResponse('Unauthorized', 401);

    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) return errorResponse('Campaign not found', 404);

    // Participants and events cascade-delete via the schema relations.
    await prisma.campaign.delete({ where: { id } });

    const clientInfo = getClientInfo(request);
    await createAuditLog({
      adminId: session.adminId,
      action: AUDIT_ACTIONS.CAMPAIGN_DELETE,
      resource: 'campaign',
      resourceId: id,
      details: { name: campaign.name },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Delete campaign error:', error);
    return errorResponse('Internal server error', 500);
  }
}
