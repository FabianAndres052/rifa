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
          },
        },
      },
    });

    const formatted = payments.map((p) => ({
      id: p.id,
      customerId: p.customerId,
      customerName: p.customer.fullName,
      customerPhone: p.customer.phone,
      amount: Number(p.amount),
      paymentType: p.paymentType,
      paymentMethod: p.paymentMethod,
      reference: p.reference,
      paidAt: p.paidAt.toISOString(),
      notes: p.notes,
    }));

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

      // Crear el registro de pago
      const newPayment = await tx.payment.create({
        data: {
          customerId,
          amount: numericAmount,
          paymentType,
          paymentMethod,
          reference: reference?.trim() || null,
          notes: notes?.trim() || null,
        },
      });

      // Calcular si con este abono se completa el pago de todos sus números
      const totalCost = customer.numbers.length * 40000;
      const alreadyPaid = customer.payments.reduce(
        (acc, p) => acc + Number(p.amount),
        0
      );
      const newTotalPaid = alreadyPaid + numericAmount;

      // Si completó o superó la deuda total, marcar los números como SOLD_PAID
      if (newTotalPaid >= totalCost && customer.numbers.length > 0) {
        await tx.raffleNumber.updateMany({
          where: { customerId },
          data: { status: 'SOLD_PAID' },
        });

        await tx.numberAssignment.updateMany({
          where: { customerId },
          data: { status: 'PAID' },
        });
      }

      // Auditoría
      await tx.auditLog.create({
        data: {
          action: 'RECORD_PAYMENT',
          entity: 'payments',
          entityId: newPayment.id,
          performedBy: admin?.username || 'admin',
          details: `Abono/Pago registrado por $${numericAmount.toLocaleString('es-CO')} COP para ${customer.fullName}. Método: ${paymentMethod}`,
        },
      });

      return newPayment;
    });

    notifyRaffleUpdate('PAYMENT_RECORDED', {
      customerId,
      amount: numericAmount,
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
