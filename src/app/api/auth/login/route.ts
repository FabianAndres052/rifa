import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Debe ingresar usuario y contraseña' },
        { status: 400 }
      );
    }

    const admin = await prisma.administrator.findUnique({
      where: { username },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const token = signToken({
      id: admin.id,
      username: admin.username,
      fullName: admin.fullName,
      role: admin.role,
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_LOGIN',
        entity: 'administrators',
        entityId: admin.id,
        performedBy: admin.username,
        details: `Inicio de sesión exitoso para el usuario ${admin.username}`,
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno en el servidor' },
      { status: 500 }
    );
  }
}
