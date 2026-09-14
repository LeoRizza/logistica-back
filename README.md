# Logística API

Una API RESTful profesional para un sistema de gestión de logística, construida con **Node.js**, **Express**, **TypeScript** y **Prisma ORM**.

## 📋 Características

- ✅ Arquitectura en capas (Routes → Controllers → Services)
- ✅ TypeScript con tipado estricto
- ✅ Prisma ORM con PostgreSQL
- ✅ CORS configurado en modo estricto
- ✅ Middleware global para manejo de errores
- ✅ Logging de solicitudes HTTP
- ✅ Validación de datos con utilidades reutilizables
- ✅ ESLint y Prettier configurados
- ✅ Cierre graceful del servidor

## 📁 Estructura del Proyecto

```
logistica-nico/
├── src/
│   ├── controllers/          # Controladores (lógica de respuesta HTTP)
│   │   ├── baseController.ts
│   │   ├── userController.ts
│   │   ├── driverController.ts
│   │   ├── vehicleController.ts
│   │   ├── tripController.ts
│   │   └── expenseController.ts
│   ├── services/             # Servicios (lógica de negocio)
│   │   ├── baseService.ts
│   │   ├── userService.ts
│   │   ├── driverService.ts
│   │   ├── vehicleService.ts
│   │   ├── tripService.ts
│   │   └── expenseService.ts
│   ├── routes/               # Definición de rutas
│   │   └── index.ts
│   ├── middleware/           # Middlewares globales
│   │   ├── errorHandler.ts
│   │   ├── requestLogger.ts
│   │   ├── auth.ts
│   │   └── asyncHandler.ts
│   ├── config/               # Configuración
│   │   ├── database.ts
│   │   └── server.ts
│   ├── types/                # Tipos TypeScript
│   │   └── index.ts
│   ├── utils/                # Funciones utilitarias
│   │   ├── responseHandler.ts
│   │   └── validators.ts
│   ├── models/               # Modelos (para futuro uso)
│   └── index.ts              # Punto de entrada
├── prisma/
│   └── schema.prisma         # Esquema de base de datos
├── dist/                     # Código compilado (generado)
├── .eslintrc.json            # Configuración de ESLint
├── .prettierrc.json          # Configuración de Prettier
├── .prettierignore           # Archivos a ignorar en Prettier
├── .gitignore                # Archivos a ignorar en Git
├── tsconfig.json             # Configuración de TypeScript
├── package.json              # Dependencias del proyecto
└── README.md                 # Este archivo
```

## 🗄️ Modelos de Base de Datos

### User (Usuarios)
- `id`: CUID (Identificador único)
- `name`: Nombre del usuario
- `email`: Email único
- `password_hash`: Hash de contraseña
- `role`: Rol (ADMIN, MANAGER, DISPATCHER, DRIVER, ACCOUNTANT)
- `created_at`, `updated_at`, `deleted_at`: Timestamps

### Driver (Conductores)
- `id`: CUID
- `full_name`: Nombre completo
- `type`: Tipo (PROPIO, CONTRATADO)
- `license_exp_date`: Fecha de vencimiento de licencia
- `is_active`: Estado activo
- `license_number`: Número de licencia
- `phone`: Teléfono
- `document_number`: Número de documento
- Relación: Pertenece a un User

### Vehicle (Vehículos)
- `id`: CUID
- `plate`: Placa del vehículo
- `is_owned`: Es propio
- `truck_rto_exp_date`: Fecha de vencimiento RTO del camión
- `trailer_plate`: Placa del remolque
- `trailer_rto_exp_date`: Fecha de vencimiento RTO del remolque
- `is_active`: Estado activo
- `vehicle_type`: Tipo de vehículo
- `capacity_tons`: Capacidad en toneladas
- `capacity_m3`: Capacidad en metros cúbicos

### DriverVehicle (Relación Conductor-Vehículo)
- Tabla de unión entre Driver y Vehicle
- Permite asignación de múltiples vehículos a conductores

### Trip (Viajes)
- `id`: CUID
- `reference_number`: Número de referencia único
- `origin`: Origen del viaje
- `destination`: Destino del viaje
- `status`: Estado (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- `scheduled_date`: Fecha programada
- `actual_start_date`: Fecha real de inicio
- `actual_end_date`: Fecha real de fin
- `distance_km`: Distancia en kilómetros
- `estimated_cost`: Costo estimado
- `actual_cost`: Costo real
- `load_description`: Descripción de carga
- Relaciones: Driver, Vehicle, User

### CompanyExpense (Gastos de la Empresa)
- `id`: CUID
- `name`: Nombre del gasto
- `category`: Categoría (SALARIES, FUEL, MAINTENANCE, INSURANCE, RENT)
- `amount`: Monto
- `currency`: Moneda (por defecto USD)
- `expense_date`: Fecha del gasto
- `due_date`: Fecha de vencimiento
- `is_recurring`: Es recurrente
- `recurrence_period`: Período de recurrencia (MONTHLY, QUARTERLY, ANNUALLY)
- `payment_status`: Estado (PENDING, PARTIAL, PAID, CANCELLED)
- Relación: Creado por User

## 🚀 Instalación

### Requisitos previos
- Node.js 18+
- npm o yarn
- PostgreSQL 12+

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd logistica-nico
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Editar `.env` con tus credenciales de base de datos.

4. **Configurar Prisma**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 📦 Scripts disponibles

```bash
# Desarrollo
npm run dev              # Inicia el servidor en modo desarrollo con hot reload

# Compilación
npm run build            # Compila TypeScript a JavaScript

# Producción
npm start                # Ejecuta el código compilado

# Linting y Formato
npm run lint             # Verifica el código con ESLint
npm run lint:fix         # Corrige automáticamente los errores de ESLint
npm run format           # Formatea el código con Prettier
npm run format:check     # Verifica el formato sin cambiar

# Prisma
npm run prisma:generate # Genera el cliente de Prisma
npm run prisma:migrate  # Crea y aplica migraciones
npm run prisma:migrate:prod # Aplica migraciones en producción
npm run prisma:studio   # Abre Prisma Studio para ver la BD
```

## 🏗️ Arquitectura

### Patrón en Capas

```
Request → Routes → Controllers → Services → Database (Prisma)
   ↓
Response
```

#### Routes
- Definen los endpoints y mapean las solicitudes a controladores
- Incluyen validación básica de parámetros

#### Controllers
- Heredan de `BaseController`
- Manejan la lógica de respuesta HTTP
- Formatean y envían respuestas al cliente
- Delegan lógica de negocio a servicios

#### Services
- Heredan de `BaseService`
- Contienen toda la lógica de negocio
- Interactúan con Prisma para acceder a la BD
- Retornan `ServiceResponse<T>`

#### Middleware
- `errorHandler`: Manejo global de errores
- `requestLogger`: Logging de solicitudes HTTP
- `auth`: Autenticación y autorización (placeholder)
- `asyncHandler`: Wrapper para manejo de errores async

## 📝 Convenciones de Código

### Tipos de Respuesta

**Exitosa:**
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { /* datos */ },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/users"
}
```

**Paginada:**
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "data": [ /* items */ ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/users"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error al procesar la solicitud",
  "errors": {
    "email": ["Email inválido"]
  },
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/users"
}
```

## 🔒 CORS Configuration

Se ha configurado CORS en modo estricto:
- Solo acepta solicitudes de orígenes permitidos (configurables en `.env`)
- Métodos permitidos: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers permitidos: Content-Type, Authorization
- Credentials habilitadas para cookies/sesiones

## 🛠️ Próximos Pasos

1. **Implementar Controladores**
   - Cada controlador tiene métodos marcados con `TODO`
   - Seguir la estructura en `UserController` como referencia

2. **Implementar Servicios**
   - Cada servicio tiene métodos marcados con `TODO`
   - Implementar la lógica de negocio con Prisma

3. **Implementar Rutas**
   - Crear archivos de rutas para cada módulo
   - Conectar con los controladores

4. **Autenticación JWT**
   - Implementar middleware de autenticación
   - Proteger rutas según roles

5. **Validación de Datos**
   - Crear validadores específicos por modelo
   - Implementar en rutas y controladores

6. **Testing**
   - Configurar Jest para testing
   - Escribir tests para servicios y controladores

## 📚 Documentación Adicional

- [Express.js](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)

## 📄 Licencia

MIT

## 👥 Autor

Logistica Nico

---

**Última actualización:** Enero 2024
