import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyRaffleUpdate } from '@/lib/events';
import { getCurrentAdmin } from '@/lib/auth';

// GET: Consultar un cliente específico
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Se requiere sesión activa de administrador.' },
        { status: 401 }
      );
    }
    const { id } = await context.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        numbers: true,
        payments: {
          orderBy: { paidAt: 'desc' },
        },
        assignments: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const ticketPrice = 40000;
    const totalPurchased = customer.numbers.reduce(
      (sum, n) => sum + Number(n.price || ticketPrice),
      0
    );
    const totalPaid = customer.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const pendingBalance = Math.max(0, totalPurchased - totalPaid);

    return NextResponse.json({
      ...customer,
      totalPurchased,
      totalPaid,
      pendingBalance,
    });
  } catch (error) {
    console.error('Error al consultar cliente:', error);
    return NextResponse.json(
      { error: 'Error al consultar datos del cliente' },
      { status: 500 }
    );
  }
}

// PUT: Modificar información del cliente
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Se requiere sesión activa de administrador.' },
        { status: 401 }
      );
    }
    const { id } = await context.params;
    const body = await request.json();
    const { fullName, phone, address, notes, paymentStatus } = body;

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.customer.findUnique({
        where: { id },
        include: { numbers: true },
      });

      if (!existing) {
        throw new Error('Cliente no encontrado');
      }

      // Actualizar datos básicos
      const customer = await tx.customer.update({
        where: { id },
        data: {
          fullName: fullName ? fullName.trim() : existing.fullName,
          phone: phone ? phone.trim() : existing.phone,
          address: address ? address.trim() : existing.address,
          notes: notes !== undefined ? notes?.trim() : existing.notes,
        },
      });

      // Si se desea actualizar el estado de pago de todos sus números asociados
      if (paymentStatus) {
        const newStatus =
          paymentStatus === 'PAID'
            ? 'SOLD_PAID'
            : paymentStatus === 'RESERVED'
            ? 'RESERVED'
            : 'SOLD_PENDING';

        const assignmentStatus =
          paymentStatus === 'PAID'
            ? 'PAID'
            : paymentStatus === 'RESERVED'
            ? 'RESERVED'
            : 'PENDING';

        // Actualizar números del cliente
        await tx.raffleNumber.updateMany({
          where: { customerId: id },
          data: { status: newStatus },
        });

        // Actualizar asignaciones
        await tx.numberAssignment.updateMany({
          where: { customerId: id },
          data: { status: assignmentStatus },
        });

        // Si se cambia a PAID y no había pagado, registrar el pago restante
        if (paymentStatus === 'PAID') {
          const totalCost = existing.numbers.reduce(
            (sum, n) => sum + Number(n.price || 40000),
            0
          );
          const currentPayments = await tx.payment.aggregate({
            where: { customerId: id },
            _sum: { amount: true },
          });
          const currentTotal = Number(currentPayments._sum.amount || 0);
          const diff = totalCost - currentTotal;

          if (diff > 0) {
            await tx.payment.create({
              data: {
                customerId: id,
                amount: diff,
                paymentType: 'TOTAL',
                paymentMethod: 'EFECTIVO',
                notes: 'Pago total completado desde edición de cliente',
              },
            });
          }
        } else if (paymentStatus === 'PENDING' || paymentStatus === 'RESERVED') {
          // Si pasa a pendiente o reservado, revertir pagos totales para reflejar la realidad en Finanzas
          await tx.payment.deleteMany({
            where: {
              customerId: id,
              paymentType: 'TOTAL',
            },
          });
        }
      }

      // Auditoría
      await tx.auditLog.create({
        data: {
          action: 'UPDATE_CUSTOMER',
          entity: 'customers',
          entityId: id,
          performedBy: admin?.username || 'admin',
          details: `Información del cliente ${customer.fullName} actualizada. Modificado por: ${admin?.username || 'admin'}`,
        },
      });

      return customer;
    });

    notifyRaffleUpdate('CUSTOMER_UPDATED', { id });

    return NextResponse.json({
      success: true,
      message: 'Cliente actualizado correctamente',
      customer: updated,
    });
  } catch (error: any) {
    console.error('Error al editar cliente:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar información del cliente' },
      { status: 400 }
    );
  }
}

// DELETE: Eliminar cliente y liberar sus números transaccionalmente
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Se requiere sesión activa de administrador.' },
        { status: 401 }
      );
    }
    const { id } = await context.params;

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id },
        include: { numbers: true },
      });

      if (!customer) {
        throw new Error('El cliente a eliminar no existe');
      }

      const assignedNumbers = customer.numbers.map((n) => n.number);

      // 1. Liberar todos los números asignados al cliente
      if (assignedNumbers.length > 0) {
        await tx.raffleNumber.updateMany({
          where: { number: { in: assignedNumbers } },
          data: {
            status: 'AVAILABLE',
            customerId: null,
          },
        });

        await tx.numberAssignment.deleteMany({
          where: { number: { in: assignedNumbers } },
        });
      }

      // 2. Eliminar cliente (cascada borrará pagos asociados)
      await tx.customer.delete({
        where: { id },
      });

      // 3. Registrar auditoría completa de eliminación
      await tx.auditLog.create({
        data: {
          action: 'DELETE_CUSTOMER',
          entity: 'customers',
          entityId: id,
          performedBy: admin?.username || 'admin',
          details: `Cliente eliminado: ${customer.fullName} (Tel: ${customer.phone}). Se liberaron ${assignedNumbers.length} números: [${assignedNumbers.join(', ')}]`,
        },
      });

      return { customerName: customer.fullName, freedNumbers: assignedNumbers };
    });

    notifyRaffleUpdate('CUSTOMER_DELETED', {
      freedNumbers: result.freedNumbers,
    });

    return NextResponse.json({
      success: true,
      message: `Cliente ${result.customerName} eliminado y ${result.freedNumbers.length} números liberados.`,
    });
  } catch (error: any) {
    console.error('Error al eliminar cliente:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar cliente' },
      { status: 400 }
    );
  }
}
