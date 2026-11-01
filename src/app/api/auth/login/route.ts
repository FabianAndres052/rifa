import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken, COOKIE_NAME } from '@/lib/auth';

// Almacén global en memoria para control de intentos de autenticación y bloqueo temporal
interface AttemptRecord {
  count: number;
  lockedUntil: number;
}

const globalForLogin = globalThis as unknown as {
  loginAttemptsMap: Map<string, AttemptRecord> | undefined;
};

const loginAttempts = globalForLogin.loginAttemptsMap ?? new Map<string, AttemptRecord>();
if (process.env.NODE_ENV !== 'production') {
  globalForLogin.loginAttemptsMap = loginAttempts;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

function getClientIdentifier(request: Request, username: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'local';
  return `${ip}::${username.trim().toLowerCase()}`;
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Debe ingresar usuario y contraseña' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    const identifier = getClientIdentifier(request, cleanUsername);
    const now = Date.now();
    const attemptRecord = loginAttempts.get(identifier);

    // 1. Verificar si está en periodo de bloqueo temporal
    if (attemptRecord && attemptRecord.lockedUntil > now) {
      const remainingMinutes = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
      return NextResponse.json(
        {
          error: `Acceso bloqueado por seguridad debido a ${MAX_ATTEMPTS} intentos fallidos consecutivos. Intente nuevamente en ${remainingMinutes} minuto(s).`,
          isLocked: true,
          remainingMinutes,
        },
        { status: 429 }
      );
    }

    // 2. Si el bloqueo ya expiró, reiniciar contador
    if (attemptRecord && attemptRecord.lockedUntil <= now && attemptRecord.lockedUntil > 0) {
      loginAttempts.delete(identifier);
    }

    // 3. Buscar administrador en MySQL
    const admin = await prisma.administrator.findUnique({
      where: { username: cleanUsername },
    });

    const isValid = admin ? await comparePassword(password, admin.passwordHash) : false;

    // 4. Si las credenciales son incorrectas
    if (!admin || !isValid) {
      const currentAttempts = (attemptRecord ? attemptRecord.count : 0) + 1;
      const isNowLocked = currentAttempts >= MAX_ATTEMPTS;
      const lockedUntil = isNowLocked ? now + LOCKOUT_DURATION_MS : 0;

      loginAttempts.set(identifier, {
        count: currentAttempts,
        lockedUntil,
      });

      // Trazabilidad en auditoría
      try {
        await prisma.auditLog.create({
          data: {
            action: isNowLocked ? 'ADMIN_LOGIN_LOCKED' : 'ADMIN_LOGIN_FAILED',
            entity: 'administrators',
            entityId: admin?.id || cleanUsername,
            performedBy: cleanUsername,
            details: isNowLocked
              ? `Bloqueo temporal de 15 minutos activado tras ${MAX_ATTEMPTS} intentos fallidos consecutivos.`
              : `Intento de acceso fallido (${currentAttempts}/${MAX_ATTEMPTS}).`,
          },
        });
      } catch (logErr) {
        console.error('Error registrando auditoría de intento fallido:', logErr);
      }

      if (isNowLocked) {
        return NextResponse.json(
          {
            error: `Ha alcanzado el límite de ${MAX_ATTEMPTS} intentos fallidos. Su acceso ha sido bloqueado temporalmente por 15 minutos.`,
            isLocked: true,
            remainingMinutes: 15,
          },
          { status: 429 }
        );
      }

      const remainingAttempts = MAX_ATTEMPTS - currentAttempts;
      return NextResponse.json(
        {
          error: `Credenciales inválidas. Le restan ${remainingAttempts} intento(s) antes del bloqueo de seguridad.`,
          remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 5. Autenticación exitosa: reiniciar contador de intentos
    loginAttempts.delete(identifier);

    // 6. Generar JWT firmado con algoritmo robusto
    const token = signToken({
      id: admin.id,
      username: admin.username,
      fullName: admin.fullName,
      role: admin.role,
    });

    // 7. Registro de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_LOGIN_SUCCESS',
        entity: 'administrators',
        entityId: admin.id,
        performedBy: admin.username,
        details: `Inicio de sesión exitoso del administrador ${admin.username}`,
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

    // 8. Configurar cookie segura (HttpOnly, Secure, SameSite Lax)
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
      { error: 'Error interno en el servidor de autenticación' },
      { status: 500 }
    );
  }
}
