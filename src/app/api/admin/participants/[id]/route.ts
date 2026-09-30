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

    const participant = await prisma.participant.findUnique({ where: { id } });
    if (!participant) {
      return errorResponse('Participant not found', 404);
    }

    // Events cascade-delete via the schema relation.
    await prisma.participant.delete({ where: { id } });

    const clientInfo = getClientInfo(request);
    await createAuditLog({
      adminId: session.adminId,
      action: AUDIT_ACTIONS.PARTICIPANT_REMOVE,
      resource: 'participant',
      resourceId: id,
      details: { employeeEmail: participant.employeeEmail },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Delete participant error:', error);
    return errorResponse('Internal server error', 500);
  }
}
