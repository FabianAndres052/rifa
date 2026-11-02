import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyRaffleUpdate } from '@/lib/events';
import { getCurrentAdmin } from '@/lib/auth';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ number: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Se requiere sesión activa de administrador.' },
        { status: 401 }
      );
    }
    const { number } = await context.params;
    const body = await request.json();
    const { status, paymentMethod = 'EFECTIVO', notes } = body;

    const numStr = number.padStart(2, '0');

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.raffleNumber.findUnique({
        where: { number: numStr },
        include: {
          customer: true,
          assignment: true,
        },
      });

      if (!existing) {
        throw new Error(`El número ${numStr} no existe`);
      }

      // Si se libera a AVAILABLE
      if (status === 'AVAILABLE') {
        // Si antes estaba PAGADO, revertir pago asociado
        if (existing.status === 'SOLD_PAID' && existing.customerId) {
          const associatedPayment = await tx.payment.findFirst({
            where: {
              customerId: existing.customerId,
              OR: [
                { notes: { contains: numStr } },
                { paymentType: 'TOTAL' },
              ],
            },
            orderBy: { paidAt: 'desc' },
          });
          if (associatedPayment) {
            await tx.payment.delete({
              where: { id: associatedPayment.id },
            });
          }
        }

        // Eliminar asignación
        if (existing.assignment) {
          await tx.numberAssignment.delete({
            where: { number: numStr },
          });
        }

        // Actualizar número
        const updated = await tx.raffleNumber.update({
          where: { number: numStr },
          data: {
            status: 'AVAILABLE',
            customerId: null,
          },
        });

        // Registrar auditoría
        await tx.auditLog.create({
          data: {
            action: 'RELEASE_NUMBER',
            entity: 'raffle_numbers',
            entityId: numStr,
            performedBy: admin?.username || 'admin',
            details: `El número ${numStr} fue liberado y ahora está disponible nuevamente. Cliente anterior: ${existing.customer?.fullName || 'N/A'}`,
          },
        });

        return updated;
      }

      // Si se marca como SOLD_PAID
      if (status === 'SOLD_PAID') {
        const updated = await tx.raffleNumber.update({
          where: { number: numStr },
          data: { status: 'SOLD_PAID' },
        });

        if (existing.assignment) {
          await tx.numberAssignment.update({
            where: { number: numStr },
            data: { status: 'PAID' },
          });
        }

        // Si antes estaba pendiente o reservado y tiene cliente, registrar pago
        if (existing.customerId && existing.status !== 'SOLD_PAID') {
          await tx.payment.create({
            data: {
              customerId: existing.customerId,
              amount: 40000.0,
              paymentType: 'TOTAL',
              paymentMethod,
              notes: notes || `Pago confirmado para el número ${numStr}`,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            action: 'CONFIRM_PAYMENT_NUMBER',
            entity: 'raffle_numbers',
            entityId: numStr,
            performedBy: admin?.username || 'admin',
            details: `El número ${numStr} fue marcado como PAGADO para el cliente ${existing.customer?.fullName || 'N/A'}`,
          },
        });

        return updated;
      }

      // Si se marca como RESERVED o SOLD_PENDING
      // Si antes estaba PAGADO, revertir el pago asociado para mantener Finanzas sincronizado
      if (existing.status === 'SOLD_PAID' && existing.customerId) {
        const associatedPayment = await tx.payment.findFirst({
          where: {
            customerId: existing.customerId,
            OR: [
              { notes: { contains: numStr } },
              { paymentType: 'TOTAL' },
            ],
          },
          orderBy: { paidAt: 'desc' },
        });

        if (associatedPayment) {
          await tx.payment.delete({
            where: { id: associatedPayment.id },
          });
        }
      }

      const assignmentStatus = status === 'RESERVED' ? 'RESERVED' : 'PENDING';

      const updated = await tx.raffleNumber.update({
        where: { number: numStr },
        data: { status },
      });

      if (existing.assignment) {
        await tx.numberAssignment.update({
          where: { number: numStr },
          data: { status: assignmentStatus },
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'UPDATE_NUMBER_STATUS',
          entity: 'raffle_numbers',
          entityId: numStr,
          performedBy: admin?.username || 'admin',
          details: `El número ${numStr} cambió de estado a ${status}`,
        },
      });

      return updated;
    });

    notifyRaffleUpdate('NUMBER_STATUS_CHANGED', {
      number: numStr,
      status,
    });

    return NextResponse.json({
      success: true,
      message: `Número ${numStr} actualizado a ${status}`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error al actualizar número:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar estado del número' },
      { status: 400 }
    );
  }
}
