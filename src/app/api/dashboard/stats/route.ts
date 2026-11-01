import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      numbers,
      customers,
      paymentsSum,
    ] = await Promise.all([
      prisma.raffleNumber.findMany({
        select: {
          number: true,
          status: true,
          price: true,
        },
      }),
      prisma.customer.findMany({
        include: {
          numbers: true,
          payments: true,
        },
      }),
      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
      }),
    ]);

    const totalNumbers = 100;
    let availableNumbers = 0;
    let reservedNumbers = 0;
    let paidNumbers = 0;
    let pendingNumbers = 0;

    for (const num of numbers) {
      if (num.status === 'AVAILABLE') availableNumbers++;
      else if (num.status === 'RESERVED') reservedNumbers++;
      else if (num.status === 'SOLD_PAID') paidNumbers++;
      else if (num.status === 'SOLD_PENDING') pendingNumbers++;
    }

    const soldNumbers = paidNumbers + pendingNumbers;
    const ticketPrice = 40000;
    const totalPotentialRevenue = totalNumbers * ticketPrice; // $4,000,000 COP

    // Dinero efectivamente recaudado (suma de todos los pagos registrados en payments)
    const totalCollected = paymentsSum._sum.amount
      ? Number(paymentsSum._sum.amount)
      : paidNumbers * ticketPrice;

    // Dinero pendiente de recaudar: valor de los números vendidos pendientes
    const totalPending = pendingNumbers * ticketPrice;

    // Conteo de clientes según estado de pago
    let paidCustomersCount = 0;
    let pendingCustomersCount = 0;

    for (const customer of customers) {
      const customerCost = customer.numbers.reduce(
        (sum, n) => sum + Number(n.price || ticketPrice),
        0
      );
      const customerPaid = customer.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );

      if (customerCost > 0 && customerPaid >= customerCost) {
        paidCustomersCount++;
      } else {
        pendingCustomersCount++;
      }
    }

    return NextResponse.json({
      totalNumbers,
      soldNumbers,
      reservedNumbers,
      availableNumbers,
      paidNumbers,
      pendingNumbers,
      totalCollected,
      totalPending,
      totalPotentialRevenue,
      totalCustomers: customers.length,
      paidCustomersCount,
      pendingCustomersCount,
    });
  } catch (error) {
    console.error('Error calculando estadísticas del dashboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del dashboard' },
      { status: 500 }
    );
  }
}
