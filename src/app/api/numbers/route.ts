import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyRaffleUpdate } from '@/lib/events';
import { getCurrentAdmin } from '@/lib/auth';

// GET: Obtener los 100 números con su estado actual y cliente asignado
export async function GET() {
  try {
    const numbers = await prisma.raffleNumber.findMany({
      orderBy: { number: 'asc' },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            address: true,
          },
        },
        assignment: {
          select: {
            id: true,
            status: true,
            assignedAt: true,
            notes: true,
          },
        },
      },
    });

    const formatted = numbers.map((n) => ({
      number: n.number,
      status: n.status,
      price: Number(n.price),
      customerId: n.customerId,
      updatedAt: n.updatedAt.toISOString(),
      customer: n.customer,
      assignment: n.assignment
        ? {
            ...n.assignment,
            assignedAt: n.assignment.assignedAt.toISOString(),
          }
        : null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error al listar números de rifa:', error);
    return NextResponse.json(
      { error: 'Error al consultar números de la rifa' },
      { status: 500 }
    );
  }
}

// POST: Asignación transaccional de uno o varios números a un cliente
export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    const body = await request.json();
    const { customerId, numbers, status = 'SOLD_PAID', notes } = body;

    if (!customerId || !Array.isArray(numbers) || numbers.length === 0) {
      return NextResponse.json(
        { error: 'Debe especificar el cliente y al menos un número' },
        { status: 400 }
      );
    }

    // Ejecución TRANSACCIONAL ATÓMICA en MySQL
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verificar existencia del cliente
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) {
        throw new Error('El cliente especificado no existe en el sistema');
      }

      // 2. Verificar que NINGUNO de los números solicitados esté ocupado
      const currentNumbers = await tx.raffleNumber.findMany({
        where: { number: { in: numbers } },
      });

      if (currentNumbers.length !== numbers.length) {
        throw new Error('Algunos números solicitados no son válidos (del 00 al 99)');
      }

      const occupied = currentNumbers.filter((n) => n.status !== 'AVAILABLE');
      if (occupied.length > 0) {
        const occupiedList = occupied.map((o) => o.number).join(', ');
        throw new Error(`Los siguientes números ya no están disponibles: ${occupiedList}`);
      }

      // 3. Determinar estado de la asignación
      const assignmentStatus =
        status === 'SOLD_PAID' ? 'PAID' : status === 'RESERVED' ? 'RESERVED' : 'PENDING';

      // 4. Actualizar cada número y crear la asignación
      for (const num of numbers) {
        await tx.raffleNumber.update({
          where: { number: num },
          data: {
            status,
            customerId,
          },
        });

        await tx.numberAssignment.create({
          data: {
            customerId,
            number: num,
            status: assignmentStatus,
            notes: notes || null,
          },
        });
      }

      // 5. Si es compra pagada, registrar el pago total en la tabla payments
      const totalAmount = numbers.length * 40000;
      if (status === 'SOLD_PAID') {
        await tx.payment.create({
          data: {
            customerId,
            amount: totalAmount,
            paymentType: 'TOTAL',
            paymentMethod: body.paymentMethod || 'EFECTIVO',
            reference: body.paymentReference || null,
            notes: `Pago total por asignación de números: ${numbers.join(', ')}`,
          },
        });
      }

      // 6. Registro de auditoría
      await tx.auditLog.create({
        data: {
          action: 'ASSIGN_NUMBERS',
          entity: 'raffle_numbers',
          entityId: numbers.join(','),
          performedBy: admin?.username || 'admin',
          details: `Asignación de ${numbers.length} números (${numbers.join(', ')}) al cliente ${customer.fullName} con estado ${status}. Total: $${totalAmount.toLocaleString('es-CO')} COP`,
        },
      });

      return { customer, count: numbers.length, totalAmount };
    });

    // 7. Notificar a todas las sesiones activas en tiempo real
    notifyRaffleUpdate('NUMBERS_ASSIGNED', {
      numbers,
      customerId,
      status,
    });

    return NextResponse.json({
      success: true,
      message: `Se asignaron exitosamente ${result.count} números`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error transaccional al asignar números:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la asignación de números' },
      { status: 409 }
    );
  }
}
