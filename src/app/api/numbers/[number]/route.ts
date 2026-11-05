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
        // Revertir pagos asociados si tenía cliente
        if (existing.customerId) {
          const otherNumbersCount = await tx.raffleNumber.count({
            where: {
              customerId: existing.customerId,
              number: { not: numStr },
            },
          });

          if (otherNumbersCount === 0) {
            // Si era el único número del cliente, eliminar todos sus pagos registrados
            await tx.payment.deleteMany({
              where: { customerId: existing.customerId },
            });
          } else {
            // Si tiene otros números, eliminar el pago asociado a este número específico si existe
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

        let amountToPay = 0;

        // Si antes estaba pendiente o reservado y tiene cliente, registrar el pago total del número
        // eliminando cualquier abono previo para no duplicar ni sumar abonos con pagos completos
        if (existing.customerId && existing.status !== 'SOLD_PAID') {
          const customer = await tx.customer.findUnique({
            where: { id: existing.customerId },
            include: {
              numbers: true,
              payments: true,
            },
          });

          if (customer) {
            const ticketPrice = Number(existing.price || 40000);

            // 1. Eliminar cualquier abono previo del cliente para que no se sume con el pago total
            await tx.payment.deleteMany({
              where: {
                customerId: existing.customerId,
                paymentType: 'ABONO',
              },
            });

            // 2. Calcular cuántos números pagados tiene el cliente ahora
            const paidNumbersCount = customer.numbers.filter(
              (n) => n.number === numStr || n.status === 'SOLD_PAID'
            ).length;
            const requiredTotalPaid = paidNumbersCount * ticketPrice;

            // 3. Consultar pagos TOTAL vigentes del cliente
            const currentTotalPayments = await tx.payment.findMany({
              where: {
                customerId: existing.customerId,
                paymentType: 'TOTAL',
              },
            });
            const currentTotalPaid = currentTotalPayments.reduce(
              (sum, p) => sum + Number(p.amount),
              0
            );

            amountToPay = Math.max(0, requiredTotalPaid - currentTotalPaid);

            if (amountToPay > 0) {
              await tx.payment.create({
                data: {
                  customerId: existing.customerId,
                  amount: amountToPay,
                  paymentType: 'TOTAL',
                  paymentMethod,
                  notes: notes || `Pago confirmado para el número ${numStr}`,
                },
              });
            }

            // Si todos los números del cliente ya están pagados, sincronizar asignaciones
            const allPaid = customer.numbers.every(
              (n) => n.number === numStr || n.status === 'SOLD_PAID'
            );
            if (allPaid) {
              await tx.numberAssignment.updateMany({
                where: { customerId: customer.id },
                data: { status: 'PAID' },
              });
            }
          }
        }

        await tx.auditLog.create({
          data: {
            action: 'CONFIRM_PAYMENT_NUMBER',
            entity: 'raffle_numbers',
            entityId: numStr,
            performedBy: admin?.username || 'admin',
            details: `El número ${numStr} fue marcado como PAGADO para el cliente ${
              existing.customer?.fullName || 'N/A'
            }${amountToPay > 0 ? `. Pago liquidado: $${amountToPay.toLocaleString('es-CO')} COP` : ' (ya completado con abonos previos)'}`,
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
