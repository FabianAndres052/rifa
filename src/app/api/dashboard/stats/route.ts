import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      statusGroups,
      totalCustomersCount,
      customersWithNumbers,
      paymentsSum,
    ] = await Promise.all([
      // 1. Conteo agrupado rápido de números por estado
      prisma.raffleNumber.groupBy({
        by: ['status'],
        _count: { number: true },
      }),
      // 2. Conteo total de clientes
      prisma.customer.count(),
      // 3. Clientes con números asignados (solo campos estrictamente necesarios)
      prisma.customer.findMany({
        where: { numbers: { some: {} } },
        select: {
          id: true,
          numbers: { select: { price: true } },
          payments: { select: { amount: true } },
        },
      }),
      // 4. Suma exacta de dinero recaudado en la tabla de pagos
      prisma.payment.aggregate({
        _sum: { amount: true },
      }),
    ]);

    const totalNumbers = 100;
    const ticketPrice = 40000;
    const totalPotentialRevenue = totalNumbers * ticketPrice; // $4.000.000 COP

    let availableNumbers = 0;
    let reservedNumbers = 0;
    let paidNumbers = 0;
    let pendingNumbers = 0;

    for (const group of statusGroups) {
      const count = group._count.number;
      if (group.status === 'AVAILABLE') availableNumbers = count;
      else if (group.status === 'RESERVED') reservedNumbers = count;
      else if (group.status === 'SOLD_PAID') paidNumbers = count;
      else if (group.status === 'SOLD_PENDING') pendingNumbers = count;
    }

    const soldNumbers = paidNumbers + pendingNumbers;

    // Dinero efectivamente recaudado (suma real y confirmada de pagos/abonos en payments)
    const totalCollected = Number(paymentsSum._sum.amount || 0);

    // Valor total de los números vendidos
    const totalSoldValue = soldNumbers * ticketPrice;

    // Dinero pendiente por cobrar (valor total vendido menos lo efectivamente recaudado)
    const totalPending = Math.max(0, totalSoldValue - totalCollected);

    // Conteo exacto de clientes según estado de pago
    let paidCustomersCount = 0;
    let pendingCustomersCount = 0;

    for (const customer of customersWithNumbers) {
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
      totalCustomers: totalCustomersCount,
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

