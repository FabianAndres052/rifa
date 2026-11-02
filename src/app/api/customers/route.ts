import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyRaffleUpdate } from '@/lib/events';
import { getCurrentAdmin } from '@/lib/auth';

// GET: Consultar clientes con búsqueda y filtro de estado de pago
export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Se requiere sesión activa de administrador.' },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const statusFilter = searchParams.get('status') || 'ALL'; // ALL, PAID, PENDING, PARTIAL
    const minimal = searchParams.get('minimal') === 'true';

    // Si se solicita versión mínima (solo id y nombre para selectores/combos)
    if (minimal) {
      const minimalCustomers = await prisma.customer.findMany({
        select: {
          id: true,
          fullName: true,
        },
        orderBy: { fullName: 'asc' },
      });
      return NextResponse.json(minimalCustomers);
    }

    // Obtener todos los clientes con sus números y pagos
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        numbers: {
          select: {
            number: true,
            status: true,
            price: true,
          },
          orderBy: { number: 'asc' },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    const ticketPrice = 40000;

    // Formatear y calcular balance
    const formatted = customers.map((c) => {
      const totalPurchased = c.numbers.reduce(
        (sum, n) => sum + Number(n.price || ticketPrice),
        0
      );
      const totalPaid = c.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const pendingBalance = Math.max(0, totalPurchased - totalPaid);

      let paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL' = 'PENDING';
      if (totalPurchased > 0 && totalPaid >= totalPurchased) {
        paymentStatus = 'PAID';
      } else if (totalPaid > 0 && totalPaid < totalPurchased) {
        paymentStatus = 'PARTIAL';
      }

      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        address: c.address,
        notes: c.notes,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        numbers: c.numbers.map((n) => ({
          number: n.number,
          status: n.status,
          price: Number(n.price),
        })),
        payments: c.payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          paymentType: p.paymentType,
          paymentMethod: p.paymentMethod,
          reference: p.reference,
          paidAt: p.paidAt.toISOString(),
          notes: p.notes,
        })),
        totalPurchased,
        totalPaid,
        pendingBalance,
        paymentStatus,
      };
    });

    // Filtrar según query y estado
    let filtered = formatted;

    if (q) {
      const lower = q.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.fullName.toLowerCase().includes(lower) ||
          c.phone.toLowerCase().includes(lower) ||
          c.numbers.some((n) => n.number.includes(lower))
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((c) => c.paymentStatus === statusFilter);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error al consultar clientes:', error);
    return NextResponse.json(
      { error: 'Error al consultar lista de clientes' },
      { status: 500 }
    );
  }
}

// POST: Registrar un nuevo cliente y asignarle números con transacción atómica
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
      fullName,
      phone,
      address,
      numbers,
      paymentStatus = 'SOLD_PAID', // 'SOLD_PAID', 'SOLD_PENDING', 'RESERVED'
      paymentMethod = 'EFECTIVO',
      notes,
    } = body;

    // Validación de campos obligatorios
    if (!fullName || !phone || !address) {
      return NextResponse.json(
        { error: 'Nombre, teléfono y dirección son obligatorios' },
        { status: 400 }
      );
    }

    if (!Array.isArray(numbers) || numbers.length === 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar al menos un número para el cliente' },
        { status: 400 }
      );
    }

    const ticketPrice = 40000;
    const totalAmount = numbers.length * ticketPrice;

    // TRANSACCIÓN ATÓMICA EN MYSQL
    const newCustomer = await prisma.$transaction(async (tx) => {
      // 1. Verificar disponibilidad de los números
      const selected = await tx.raffleNumber.findMany({
        where: { number: { in: numbers } },
      });

      if (selected.length !== numbers.length) {
        throw new Error('Uno o más números especificados no existen');
      }

      const unavailable = selected.filter((n) => n.status !== 'AVAILABLE');
      if (unavailable.length > 0) {
        const busy = unavailable.map((u) => u.number).join(', ');
        throw new Error(`Los números ${busy} ya están asignados o reservados`);
      }

      // 2. Crear el cliente
      const customer = await tx.customer.create({
        data: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          notes: notes?.trim() || null,
        },
      });

      // 3. Asignar los números
      const assignmentStatus =
        paymentStatus === 'SOLD_PAID'
          ? 'PAID'
          : paymentStatus === 'RESERVED'
          ? 'RESERVED'
          : 'PENDING';

      for (const num of numbers) {
        await tx.raffleNumber.update({
          where: { number: num },
          data: {
            status: paymentStatus,
            customerId: customer.id,
          },
        });

        await tx.numberAssignment.create({
          data: {
            customerId: customer.id,
            number: num,
            status: assignmentStatus,
            notes: notes || null,
          },
        });
      }

      // 4. Si el pago fue confirmado, registrar el pago inicial
      if (paymentStatus === 'SOLD_PAID') {
        await tx.payment.create({
          data: {
            customerId: customer.id,
            amount: totalAmount,
            paymentType: 'TOTAL',
            paymentMethod,
            notes: `Pago total al registrar cliente por los números: ${numbers.join(', ')}`,
          },
        });
      }

      // 5. Auditoría
      await tx.auditLog.create({
        data: {
          action: 'REGISTER_CUSTOMER',
          entity: 'customers',
          entityId: customer.id,
          performedBy: admin?.username || 'admin',
          details: `Cliente registrado: ${customer.fullName} con ${numbers.length} números (${numbers.join(', ')}). Valor total: $${totalAmount.toLocaleString('es-CO')} COP. Estado: ${paymentStatus}`,
        },
      });

      return customer;
    });

    // 6. Notificar en tiempo real a todas las sesiones
    notifyRaffleUpdate('CUSTOMER_CREATED', {
      customer: newCustomer,
      numbers,
      totalAmount,
    });

    return NextResponse.json({
      success: true,
      message: 'Cliente registrado y números asignados exitosamente',
      customer: newCustomer,
    });
  } catch (error: any) {
    console.error('Error al registrar cliente:', error);
    return NextResponse.json(
      { error: error.message || 'Error al registrar cliente' },
      { status: 409 }
    );
  }
}
