import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return errorResponse('Unauthorized', 401);

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { admin: { select: { email: true, name: true } } },
    });

    return jsonResponse({ logs });
  } catch (error) {
    console.error('List audit logs error:', error);
    return errorResponse('Internal server error', 500);
  }
}
