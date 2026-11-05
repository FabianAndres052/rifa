import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyRaffleUpdate } from '@/lib/events';
import { getCurrentAdmin } from '@/lib/auth';

// GET: Historial completo de pagos y abonos
export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Se requiere sesión activa de administrador.' },
        { status: 401 }
      );
    }
    const payments = await prisma.payment.findMany({
      orderBy: { paidAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            numbers: { select: { number: true, price: true } },
            payments: { select: { amount: true } },
          },
        },
      },
    });

    const ticketPrice = 40000;

    const formatted = payments.map((p) => {
      const customerNumbers = p.customer?.numbers?.map((n) => n.number) || [];
      const customerTotalPurchased = p.customer?.numbers
        ? p.customer.numbers.reduce((s, n) => s + Number(n.price || ticketPrice), 0)
        : customerNumbers.length * ticketPrice;
      const customerTotalPaid = p.customer?.payments
        ? p.customer.payments.reduce((s, pay) => s + Number(pay.amount), 0)
        : Number(p.amount);
      const customerPendingBalance = Math.max(0, customerTotalPurchased - customerTotalPaid);

      return {
        id: p.id,
        customerId: p.customerId,
        customerName: p.customer?.fullName || 'Cliente desconocido',
        customerPhone: p.customer?.phone || '',
        customerNumbers,
        customerTotalPurchased,
        customerTotalPaid,
        customerPendingBalance,
        amount: Number(p.amount),
        paymentType: p.paymentType,
        paymentMethod: p.paymentMethod,
        reference: p.reference,
        paidAt: p.paidAt.toISOString(),
        notes: p.notes,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error al listar pagos:', error);
    return NextResponse.json(
      { error: 'Error al consultar historial de pagos' },
      { status: 500 }
    );
  }
}

// POST: Registrar un nuevo abono o pago
export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Se requiere sesión activa de administrador.' },
        { status: 401 }
      );
    }
    const body = await request.json();
    const {
      customerId,
      amount,
      paymentType = 'ABONO', // 'TOTAL' o 'ABONO'
      paymentMethod = 'EFECTIVO',
      reference,
      notes,
    } = body;

    const numericAmount = Number(amount);
    if (!customerId || !numericAmount || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'Debe especificar el cliente y un monto válido mayor a 0' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        include: { numbers: true, payments: true },
      });

      if (!customer) {
        throw new Error('El cliente no existe');
      }

      // Calcular deuda total y saldo ya pagado
      const totalCost = customer.numbers.reduce(
        (acc, n) => acc + Number(n.price || 40000),
        0
      );
      const alreadyPaid = customer.payments.reduce(
        (acc, p) => acc + Number(p.amount),
        0
      );
      const pendingBalance = Math.max(0, totalCost - alreadyPaid);

      if (pendingBalance <= 0) {
        throw new Error(
          `El cliente ${customer.fullName} ya tiene todos sus números 100% cancelados ($${alreadyPaid.toLocaleString('es-CO')} COP pagados). Saldo pendiente: $0.`
        );
      }

      let newPayment;

      // Si el pago es TOTAL (pago completo de la deuda):
      if (paymentType === 'TOTAL') {
        // Eliminar cualquier abono parcial previo para que no se sume con el pago total
        await tx.payment.deleteMany({
          where: { customerId, paymentType: 'ABONO' },
        });

        // Crear el registro de pago TOTAL único con el valor completo de los números
        newPayment = await tx.payment.create({
          data: {
            customerId,
            amount: totalCost,
            paymentType: 'TOTAL',
            paymentMethod,
            reference: reference?.trim() || null,
            notes: notes?.trim() || `Pago total completado`,
          },
        });

        // Marcar números y asignaciones como SOLD_PAID
        await tx.raffleNumber.updateMany({
          where: { customerId },
          data: { status: 'SOLD_PAID' },
        });

        await tx.numberAssignment.updateMany({
          where: { customerId },
          data: { status: 'PAID' },
        });
      } else {
        // Es un ABONO parcial
        let finalAmount = numericAmount;
        if (finalAmount > pendingBalance) {
          throw new Error(
            `El monto ingresado ($${finalAmount.toLocaleString('es-CO')} COP) supera el saldo pendiente del cliente ($${pendingBalance.toLocaleString('es-CO')} COP).`
          );
        }

        const newTotalPaid = alreadyPaid + finalAmount;

        // Si con este abono se completa el 100% de la deuda total:
        if (newTotalPaid >= totalCost) {
          // Eliminar los abonos anteriores y consolidar en un único pago TOTAL
          await tx.payment.deleteMany({
            where: { customerId, paymentType: 'ABONO' },
          });

          newPayment = await tx.payment.create({
            data: {
              customerId,
              amount: totalCost,
              paymentType: 'TOTAL',
              paymentMethod,
              reference: reference?.trim() || null,
              notes: notes?.trim() || 'Pago completado al 100% mediante abonos',
            },
          });

          await tx.raffleNumber.updateMany({
            where: { customerId },
            data: { status: 'SOLD_PAID' },
          });

          await tx.numberAssignment.updateMany({
            where: { customerId },
            data: { status: 'PAID' },
          });
        } else {
          // El abono aún no cubre el total: se guarda como ABONO parcial
          newPayment = await tx.payment.create({
            data: {
              customerId,
              amount: finalAmount,
              paymentType: 'ABONO',
              paymentMethod,
              reference: reference?.trim() || null,
              notes: notes?.trim() || null,
            },
          });
        }
      }

      // Auditoría
      await tx.auditLog.create({
        data: {
          action: 'RECORD_PAYMENT',
          entity: 'payments',
          entityId: newPayment.id,
          performedBy: admin?.username || 'admin',
          details: `Abono/Pago registrado por $${Number(newPayment.amount).toLocaleString('es-CO')} COP para ${customer.fullName}. Método: ${paymentMethod}`,
        },
      });

      return newPayment;
    });

    notifyRaffleUpdate('PAYMENT_RECORDED', {
      customerId,
      amount: result.amount,
    });

    return NextResponse.json({
      success: true,
      message: 'Pago registrado exitosamente',
      payment: result,
    });
  } catch (error: any) {
    console.error('Error al registrar pago:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el pago' },
      { status: 400 }
    );
  }
}

// DELETE: Eliminar un abono o pago registrado
export async function DELETE(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Se requiere sesión activa de administrador.' },
        { status: 401 }
      );
    }

    // Obtener ID desde URL query params o cuerpo JSON
    const { searchParams } = new URL(request.url);
    let paymentId = searchParams.get('id');

    if (!paymentId) {
      try {
        const body = await request.json();
        paymentId = body.id;
      } catch {}
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Debe especificar el ID del abono/pago a eliminar' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          customer: {
            include: {
              numbers: true,
              payments: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error('El registro de abono/pago no existe o ya fue eliminado');
      }

      // Eliminar el registro del abono
      await tx.payment.delete({
        where: { id: paymentId },
      });

      // Recalcular saldo del cliente tras eliminar este abono
      if (payment.customer) {
        const customer = payment.customer;
        const totalCost = customer.numbers.reduce(
          (acc, n) => acc + Number(n.price || 40000),
          0
        );
        const otherPayments = customer.payments.filter((p) => p.id !== paymentId);
        const newTotalPaid = otherPayments.reduce((acc, p) => acc + Number(p.amount), 0);

        // Si el cliente tenía números marcados como PAID pero ahora ya no cubre la deuda total:
        if (newTotalPaid < totalCost && customer.numbers.length > 0) {
          await tx.raffleNumber.updateMany({
            where: { customerId: customer.id },
            data: { status: 'SOLD_PENDING' },
          });

          await tx.numberAssignment.updateMany({
            where: { customerId: customer.id },
            data: { status: 'PENDING' },
          });
        }
      }

      // Registrar auditoría
      await tx.auditLog.create({
        data: {
          action: 'DELETE_PAYMENT',
          entity: 'payments',
          entityId: paymentId,
          performedBy: admin?.username || 'admin',
          details: `Abono/Pago de $${Number(payment.amount).toLocaleString('es-CO')} eliminado para ${payment.customer?.fullName || 'N/A'}.`,
        },
      });

      return payment;
    });

    notifyRaffleUpdate('PAYMENT_DELETED', {
      id: paymentId,
      customerId: result.customerId,
    });

    return NextResponse.json({
      success: true,
      message: 'Abono/pago eliminado correctamente',
    });
  } catch (error: any) {
    console.error('Error al eliminar abono/pago:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar el abono' },
      { status: 400 }
    );
  }
}

