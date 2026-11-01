# GUÍA DE INSTALACIÓN, CONEXIÓN CON MYSQL WORKBENCH Y DESPLIEGUE EN VERCEL

Esta guía detalla los pasos para administrar, conectar y desplegar la plataforma web de la **Super Rifa Navideña (Moto Eléctrica GW E-MAX 800W - 100 Números)**.

---

## 1. CONEXIÓN LOCAL CON MYSQL WORKBENCH

La base de datos local `rifa_db` ya se encuentra creada y sincronizada en su motor local MySQL 8.0.

### Datos de Conexión Local:
- **Host / IP**: `localhost` o `127.0.0.1`
- **Puerto**: `3306`
- **Usuario**: `root`
- **Contraseña**: `1234`
- **Nombre de la Base de Datos**: `rifa_db`

### Pasos en MySQL Workbench:
1. Abra **MySQL Workbench**.
2. En la pantalla principal, haga clic en el botón **(+)** junto a *MySQL Connections*.
3. Configure los campos:
   - **Connection Name**: `Rifa Local - MySQL80`
   - **Hostname**: `127.0.0.1`
   - **Port**: `3306`
   - **Username**: `root`
4. Haga clic en **Store in Vault...** e ingrese su contraseña: `1234`.
5. En la pestaña **Default Schema**, coloque: `rifa_db`.
6. Haga clic en **Test Connection** (debe mostrar *Successfully made the MySQL connection*).
7. Haga clic en **OK** y abra la conexión.

### Importar o revisar el Script SQL:
- Encontrará el archivo de creación completo con todas las tablas, índices, llaves foráneas y datos iniciales en:
  `database/schema.sql`
- Puede abrir este archivo desde el menú: **File > Open SQL Script...** y ejecutarlo (icono del rayo) si desea recrear la base de datos en cualquier momento.

---

## 2. BASE DE DATOS EN LA NUBE COMPATIBLE CON VERCEL

Para que la aplicación funcione en vivo en Vercel, debe utilizar un servicio de MySQL en la nube compatible con conexiones Serverless. Recomendamos cualquiera de las siguientes opciones gratuitas/freemium:

### Opciones recomendadas:
1. **TiDB Cloud (MySQL Serverless)**: [https://tidbcloud.com](https://tidbcloud.com) (Muy rápido, 100% compatible con MySQL 8.0 y Prisma).
2. **Aiven for MySQL**: [https://aiven.io](https://aiven.io).
3. **Railway**: [https://railway.app](https://railway.app) (Crea un servicio MySQL en 1 clic).
4. **Clever Cloud**: [https://www.clever-cloud.com](https://www.clever-cloud.com).

### Pasos para crear la base de datos en la nube:
1. Regístrese en su proveedor elegido (ej. **TiDB Cloud** o **Railway**).
2. Cree un clúster o base de datos MySQL llamado `rifa_db`.
3. Obtenga la URL de conexión que proporciona el servicio. Tendrá un formato como este:
   ```env
   DATABASE_URL="mysql://usuario:password@gateway.tidbcloud.com:4000/rifa_db?sslaccept=strict"
   ```
4. **Importar tablas en la nube**:
   - Abra MySQL Workbench y cree una nueva conexión con los datos de host, usuario y puerto de su base de datos en la nube.
   - Abra el archivo `database/schema.sql` y ejecútelo.
   - Alternativamente, ejecute desde su terminal local:
     ```bash
     node node_modules/prisma/build/index.js db push
     node prisma/seed.js
     ```

---

## 3. CONFIGURACIÓN DE VARIABLES DE ENTORNO

En el archivo `.env` del proyecto (o en la sección **Environment Variables** de Vercel), configure:

```env
# URL de conexión a MySQL
DATABASE_URL="mysql://usuario:password@host_en_la_nube:3306/rifa_db?sslaccept=strict"

# Llave secreta para generación de tokens JWT de administrador
JWT_SECRET="clave_secreta_super_segura_de_mas_de_32_caracteres_rifa_2026"

# Nombre de la cookie de sesión
ADMIN_SESSION_COOKIE="rifa_admin_token"

# Configuración del sorteo
NEXT_PUBLIC_APP_NAME="Super Rifa Navideña - Moto Eléctrica"
NEXT_PUBLIC_TICKET_PRICE="40000"
```

---

## 4. CONECTAR CON GITHUB Y DESPLEGAR EN VERCEL

### Paso 1: Subir el proyecto a GitHub
Desde la carpeta del proyecto `c:\Users\MARIA ANGELICA\Desktop\rifa`:

```bash
git init
git add .
git commit -m "feat: plataforma completa de administracion de rifa"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

*(Nota: el archivo `.env` está protegido en `.gitignore` para no filtrar credenciales).*

### Paso 2: Importar el proyecto en Vercel
1. Inicie sesión en [Vercel](https://vercel.com).
2. Haga clic en **Add New... > Project**.
3. Seleccione su repositorio de GitHub.
4. En **Build & Development Settings**, Vercel detectará automáticamente Next.js.
5. En la sección **Environment Variables**, agregue las variables descritas arriba:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ADMIN_SESSION_COOKIE`
   - `NEXT_PUBLIC_APP_NAME`
   - `NEXT_PUBLIC_TICKET_PRICE`
6. En **Build Command**, coloque:
   ```bash
   prisma generate && next build
   ```
7. Haga clic en **Deploy**.

---

## 5. CREDENCIALES DE ACCESO AL PANEL ADMINISTRATIVO

- **Ruta de acceso**: `/login` (ej: `https://rifa-rifa-1373.vercel.app/login`)
- **Usuario**: `Samuel2305`
- **Contraseña**: La contraseña asignada por el propietario del sistema (cifrada con Bcrypt).
- **Protección de Seguridad**: Bloqueo preventivo temporal automático tras 5 intentos fallidos consecutivos.

---

## 6. VERIFICACIÓN Y PRUEBAS REALIZADAS

1. **Persistencia MySQL**:
   - Cada cliente registrado, número asignado, pago y registro de auditoría se guarda permanentemente en las tablas de MySQL.
2. **Prevención de Venta Duplicada**:
   - Bloqueo transaccional atómico mediante Prisma `$transaction` y restricción `UNIQUE` en la tabla `number_assignments`. Si dos clientes intentan comprar el mismo número, el sistema rechaza la segunda compra con estado 409 Conflict.
3. **Actualización en Tiempo Real**:
   - Conexión Server-Sent Events (SSE) a través de `/api/realtime`. Cualquier cambio realizado desde un computador se refleja en vivo en tablets y celulares sin recargar la página.
4. **Cálculos Financieros Automáticos**:
   - 100 números × $40.000 COP = $4.000.000 COP meta total.
   - Cálculo automático del monto por cliente según la cantidad de números seleccionados.
5. **Fidelidad al Cartón Original**:
   - Modo de cartón ilustrado que superpone una cuadrícula de 10×10 matemáticamente alineada sobre la imagen del póster oficial con la moto eléctrica roja GW E-MAX 800W.
