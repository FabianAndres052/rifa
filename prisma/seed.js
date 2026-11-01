const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando verificación y poblado de datos en MySQL...');

  // 1. Administrador del sistema
  const existingAdmin = await prisma.administrator.findFirst({
    where: { username: 'Samuel2305' },
  });

  if (!existingAdmin) {
    const defaultPass = process.env.INITIAL_ADMIN_PASSWORD || 'SamuelRicardo2305';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPass, salt);

    await prisma.administrator.create({
      data: {
        id: 'adm-00000000-0000-0000-0000-000000000001',
        username: 'Samuel2305',
        passwordHash,
        fullName: 'Samuel Ricardo',
        role: 'SUPERADMIN',
      },
    });
    console.log('✓ Administrador principal creado');
  } else {
    console.log('✓ Administrador ya existe en la base de datos');
  }

  // 2. Los 4 sorteos oficiales
  const draws = [
    {
      id: 'draw-1',
      title: '1° Sorteo Anticipado',
      prize: '$100.000 COP en efectivo',
      drawDate: new Date('2026-11-30T22:30:00Z'),
      lottery: 'Lotería Sinuano Noche',
      isMain: false,
    },
    {
      id: 'draw-2',
      title: '2° Sorteo Anticipado',
      prize: '$100.000 COP en efectivo',
      drawDate: new Date('2026-12-04T22:30:00Z'),
      lottery: 'Lotería Sinuano Noche',
      isMain: false,
    },
    {
      id: 'draw-3',
      title: '3° Sorteo Anticipado',
      prize: '$100.000 COP en efectivo',
      drawDate: new Date('2026-12-18T22:30:00Z'),
      lottery: 'Lotería Sinuano Noche',
      isMain: false,
    },
    {
      id: 'draw-4',
      title: 'Gran Sorteo Mayor Navideño',
      prize: '¡MOTO ELÉCTRICA GW E-MAX 800W - ROJO!',
      drawDate: new Date('2026-12-23T22:30:00Z'),
      lottery: 'Lotería Sinuano Noche',
      isMain: true,
    },
  ];

  for (const draw of draws) {
    await prisma.raffleDraw.upsert({
      where: { id: draw.id },
      update: {},
      create: draw,
    });
  }
  console.log('✓ 4 sorteos oficiales registrados');

  // 3. Poblar los 100 números (00 a 99)
  const numbersCount = await prisma.raffleNumber.count();
  if (numbersCount < 100) {
    for (let i = 0; i < 100; i++) {
      const numStr = i.toString().padStart(2, '0');
      await prisma.raffleNumber.upsert({
        where: { number: numStr },
        update: {},
        create: {
          number: numStr,
          status: 'AVAILABLE',
          price: 40000.0,
        },
      });
    }
    console.log('✓ 100 números (00-99) verificados/creados');
  } else {
    console.log(`✓ Los 100 números ya existen en la base de datos (${numbersCount} registrados)`);
  }

  console.log('¡Base de datos lista y sincronizada!');
}

main()
  .catch((e) => {
    console.error('Error al poblar la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
