import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formatted = logs.map((l) => ({
      id: l.id,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      performedBy: l.performedBy,
      details: l.details,
      createdAt: l.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error al consultar logs de auditoría:', error);
    return NextResponse.json(
      { error: 'Error al consultar logs de auditoría' },
      { status: 500 }
    );
  }
}
