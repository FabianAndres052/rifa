import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { notifyRaffleUpdate } from '@/lib/events';

export async function GET() {
  try {
    const draws = await prisma.raffleDraw.findMany({
      orderBy: { drawDate: 'asc' },
    });

    const formatted = draws.map((d) => ({
      id: d.id,
      title: d.title,
      prize: d.prize,
      drawDate: d.drawDate.toISOString(),
      lottery: d.lottery,
      isMain: d.isMain,
      winningNumber: d.winningNumber,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error al consultar sorteos:', error);
    return NextResponse.json(
      { error: 'Error al consultar sorteos' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    const body = await request.json();
    const { id, winningNumber } = body;

    if (!id || !winningNumber) {
      return NextResponse.json(
        { error: 'Debe especificar el sorteo y el número ganador' },
        { status: 400 }
      );
    }

    const cleanNum = winningNumber.toString().padStart(2, '0');

    const updated = await prisma.raffleDraw.update({
      where: { id },
      data: { winningNumber: cleanNum },
    });

    // Registrar auditoría
    await prisma.auditLog.create({
      data: {
        action: 'SET_WINNING_NUMBER',
        entity: 'raffle_draws',
        entityId: id,
        performedBy: admin?.username || 'admin',
        details: `Número ganador asignado al sorteo "${updated.title}": ${cleanNum}`,
      },
    });

    notifyRaffleUpdate('DRAW_UPDATED', { id, winningNumber: cleanNum });

    return NextResponse.json({
      success: true,
      message: 'Número ganador registrado',
      draw: updated,
    });
  } catch (error: any) {
    console.error('Error al actualizar sorteo:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar sorteo' },
      { status: 400 }
    );
  }
}
