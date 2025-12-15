<p align="center">
  <h1 align="center">🔍 FindIt UNAL - Backend API</h1>
  <p align="center">
    <strong>API RESTful para la gestión de objetos perdidos y encontrados en la Universidad Nacional de Colombia</strong>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"/>
  <img src="https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io"/>
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
</p>

---

## 📑 Tabla de Contenidos

- [📖 Descripción](#-descripción)
- [✨ Características](#-características)
- [🛠️ Tecnologías](#️-tecnologías)
- [📋 Requisitos Previos](#-requisitos-previos)
- [🚀 Instalación](#-instalación)
- [⚙️ Configuración](#️-configuración)
- [▶️ Ejecución](#️-ejecución)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🔗 API Endpoints](#-api-endpoints)
- [🗄️ Base de Datos](#️-base-de-datos)
- [🐳 Docker](#-docker)
- [📚 Documentación API](#-documentación-api)
- [🤝 Contribución](#-contribución)
- [📄 Licencia](#-licencia)

---

## 📖 Descripción

**FindIt UNAL Backend** es una API RESTful robusta diseñada para facilitar la gestión de objetos perdidos y encontrados dentro de la comunidad universitaria de la Universidad Nacional de Colombia. El sistema permite a los estudiantes y personal reportar objetos perdidos, publicar objetos encontrados, y comunicarse de manera segura para coordinar la devolución de pertenencias.

---

## ✨ Características

| Característica | Descripción |
|----------------|-------------|
| 🔐 **Autenticación OAuth 2.0** | Integración con Google OAuth exclusivo para correos `@unal.edu.co` |
| 📝 **Gestión de Reportes** | CRUD completo para reportes de objetos perdidos/encontrados |
| 💬 **Chat en Tiempo Real** | Sistema de mensajería usando Socket.IO |
| 🔔 **Notificaciones** | Sistema de notificaciones en tiempo real |
| 🛡️ **Panel de Administración** | Gestión de usuarios, reportes y quejas |
| 📷 **Gestión de Imágenes** | Subida y almacenamiento de imágenes con Multer |
| 📊 **Logs de Actividad** | Registro de acciones administrativas |
| 📖 **Documentación Swagger** | API completamente documentada con OpenAPI 3.0 |
| 🐳 **Docker Ready** | Configuración completa para contenedores |

---

## 🛠️ Tecnologías

### Core
- **Runtime:** Node.js 18+
- **Lenguaje:** TypeScript 5.7
- **Framework:** Express 4.21
- **Base de Datos:** MySQL 8.0

### Autenticación & Seguridad
- **OAuth 2.0:** Google Auth Library
- **JWT:** JSON Web Tokens para sesiones
- **Bcrypt:** Hash de contraseñas

### Comunicación en Tiempo Real
- **Socket.IO:** WebSockets para chat y notificaciones

### Utilidades
- **Zod:** Validación de esquemas
- **Multer:** Manejo de archivos
- **Swagger:** Documentación de API
- **Cookie Parser:** Gestión de cookies

### Desarrollo
- **Nodemon:** Hot reload
- **ESLint + Prettier:** Linting y formateo
- **Docker:** Containerización

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MySQL** >= 8.0 (o Docker)
- **Git**

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/finditunal-backend.git
cd finditunal-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones (ver [Configuración](#️-configuración)).

### 4. Inicializar la base de datos

Ejecuta el script SQL de inicialización:

```bash
mysql -u root -p < docker/mysql-init/init.sql
```

---

## ⚙️ Configuración

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# ===========================================
# 🔧 Configuración del Servidor
# ===========================================
PORT=3000
NODE_ENV=development

# ===========================================
# 🗄️ Base de Datos MySQL
# ===========================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=tu_contraseña
DB_NAME=finditunal_db

# ===========================================
# 🔐 JWT (JSON Web Tokens)
# ===========================================
ACCESS_TOKEN_SECRET=tu_secreto_access_muy_seguro_aqui
REFRESH_TOKEN_SECRET=tu_secreto_refresh_muy_seguro_aqui
ACCESS_TOKEN_EXPIRES_IN=10m
REFRESH_TOKEN_EXPIRES_IN=30m

# ===========================================
# 🔑 Google OAuth 2.0
# ===========================================
GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# ===========================================
# 🌐 URLs de la Aplicación
# ===========================================
FRONTEND_URL=http://localhost:5173

# ===========================================
# 🍪 Cookies
# ===========================================
COOKIE_SECURE=false  # Cambiar a true en producción

# ===========================================
# 👤 Administrador
# ===========================================
ADMIN_EMAIL=admin@unal.edu.co

# ===========================================
# 🤖 Bot (Opcional)
# ===========================================
BOT_ACCESS_TOKEN=
BOT_USER_ID=
BOT_ROLE=admin
```

---

## ▶️ Ejecución

### Desarrollo

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3000` con hot reload habilitado.

### Producción

```bash
# Compilar TypeScript
npm run build

# Ejecutar
npm start
```

### Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor en modo desarrollo con hot reload |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm start` | Ejecuta el servidor compilado en producción |
| `npm run lint` | Ejecuta ESLint para verificar el código |
| `npm run format` | Formatea el código con ESLint --fix |

---

## 📁 Estructura del Proyecto

```
finditunal-backend/
├── 📂 docker/
│   └── 📂 mysql-init/
│       └── 📄 init.sql          # Script de inicialización de BD
├── 📂 src/
│   ├── 📂 config/
│   │   └── 📄 swagger.ts        # Configuración de Swagger
│   ├── 📂 controllers/          # Controladores de rutas
│   │   ├── 📄 authController.ts
│   │   ├── 📄 reportController.ts
│   │   ├── 📄 userController.ts
│   │   ├── 📄 chatController.ts
│   │   └── 📄 ...
│   ├── 📂 database/
│   │   └── 📄 mysql.ts          # Conexión a MySQL
│   ├── 📂 middlewares/          # Middlewares de Express
│   │   ├── 📄 authMiddleware.ts
│   │   ├── 📄 corsMiddleware.ts
│   │   ├── 📄 errorHandler.ts
│   │   ├── 📄 multerMiddleware.ts
│   │   ├── 📄 roleMiddleware.ts
│   │   └── 📄 validationMiddleware.ts
│   ├── 📂 models/               # Modelos de datos
│   │   ├── 📄 UserModel.ts
│   │   ├── 📄 ReportModel.ts
│   │   ├── 📄 ConversationModel.ts
│   │   └── 📄 ...
│   ├── 📂 routes/               # Definición de rutas
│   │   ├── 📄 authRoutes.ts
│   │   ├── 📄 reportRoutes.ts
│   │   ├── 📄 chatRoutes.ts
│   │   └── 📄 ...
│   ├── 📂 schemas/              # Esquemas de validación Zod
│   │   ├── 📄 authSchemas.ts
│   │   ├── 📄 reportSchemas.ts
│   │   └── 📄 ...
│   ├── 📂 services/             # Lógica de negocio
│   │   ├── 📄 AuthService.ts
│   │   ├── 📄 ChatService.ts
│   │   ├── 📄 NotificationService.ts
│   │   └── 📄 ...
│   ├── 📂 utils/                # Utilidades
│   │   ├── 📄 errors.ts
│   │   └── 📄 responseHandler.ts
│   ├── 📄 config.ts             # Configuración central
│   ├── 📄 index.ts              # Punto de entrada principal
│   ├── 📄 modelTypes.ts         # Tipos de modelos
│   └── 📄 server-with-mysql.ts  # Servidor con MySQL
├── 📄 docker-compose.yml        # Docker Compose producción
├── 📄 docker-compose.dev.yml    # Docker Compose desarrollo
├── 📄 Dockerfile                # Imagen Docker
├── 📄 package.json
├── 📄 tsconfig.json
└── 📄 README.md
```

---

## 🔗 API Endpoints

### 🔐 Autenticación (`/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/auth/google` | Iniciar flujo OAuth con Google |
| `GET` | `/auth/google/callback` | Callback de Google OAuth |
| `POST` | `/auth/refresh` | Refrescar access token |
| `POST` | `/auth/logout` | Cerrar sesión |

### 📝 Reportes (`/user/reports`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/user/reports` | Listar todos los reportes |
| `GET` | `/user/reports/:id` | Obtener reporte por ID |
| `POST` | `/user/reports` | Crear nuevo reporte |
| `PUT` | `/user/reports/:id` | Actualizar reporte |
| `DELETE` | `/user/reports/:id` | Eliminar reporte |

### 💬 Chat (`/user/chat`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/user/chat/conversations` | Listar conversaciones |
| `POST` | `/user/chat/conversations` | Crear/obtener conversación |
| `GET` | `/user/chat/conversations/:id/messages` | Obtener mensajes |
| `POST` | `/user/chat/conversations/:id/messages` | Enviar mensaje |

### 👤 Usuarios (`/user`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/user/profile` | Obtener perfil del usuario |
| `PUT` | `/user/profile` | Actualizar perfil |
| `GET` | `/user/users` | Listar usuarios (admin) |

### 📍 Ubicaciones & Categorías

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/user/locations` | Listar ubicaciones |
| `GET` | `/user/categories` | Listar categorías |

### 🚨 Quejas (`/user/complaints`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/user/complaints` | Listar quejas |
| `POST` | `/user/complaints` | Crear queja |
| `PUT` | `/user/complaints/:id` | Resolver queja (admin) |

### 🔔 Notificaciones (`/user/notifications`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/user/notifications` | Listar notificaciones |
| `PUT` | `/user/notifications/:id/read` | Marcar como leída |
| `DELETE` | `/user/notifications/:id` | Eliminar notificación |

---

## 🗄️ Base de Datos

### Diagrama de Entidades

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   users     │     │  categories │     │  locations  │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ user_id PK  │     │ category_id │     │ location_id │
│ email       │     │ name        │     │ name        │
│ google_id   │     └─────────────┘     └─────────────┘
│ name        │            │                   │
│ role        │            │                   │
└─────────────┘            │                   │
       │                   │                   │
       │            ┌──────┴───────────────────┘
       │            │
       ▼            ▼
┌─────────────────────────┐
│        reports          │
├─────────────────────────┤
│ report_id PK            │
│ user_id FK              │
│ category_id FK          │
│ location_id FK          │
│ title, description      │
│ status (perdido/encontrado/entregado)
└─────────────────────────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────────┐
│   images    │    │  conversations  │
├─────────────┤    ├─────────────────┤
│ image_id PK │    │ conversation_id │
│ report_id FK│    │ report_id FK    │
│ image_url   │    │ user1_id FK     │
└─────────────┘    │ user2_id FK     │
                   └─────────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  messages   │
                   ├─────────────┤
                   │ message_id  │
                   │ conversation│
                   │ sender_id   │
                   │ message_text│
                   └─────────────┘
```

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios del sistema (autenticados via Google) |
| `reports` | Reportes de objetos perdidos/encontrados |
| `categories` | Categorías de objetos |
| `locations` | Ubicaciones dentro del campus |
| `images` | Imágenes asociadas a reportes |
| `conversations` | Conversaciones entre usuarios |
| `messages` | Mensajes dentro de conversaciones |
| `notifications` | Notificaciones del sistema |
| `complaints` | Quejas sobre reportes |
| `adminactions` | Log de acciones administrativas |

---

## 🐳 Docker

### Desarrollo con Docker

```bash
# Iniciar en modo desarrollo (con hot reload)
docker compose -f docker-compose.dev.yml up --build
```

### Producción con Docker

```bash
# Iniciar en modo producción
docker compose up --build
```

### Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| `app` | 3000 | API Backend |
| `db` | 3306 | MySQL Database |

### Variables de Entorno para Docker

Crea un archivo `.env` con las variables necesarias antes de ejecutar Docker Compose.

---

## 📚 Documentación API

La documentación interactiva de la API está disponible mediante **Swagger UI**:

- **URL:** `http://localhost:3000/swagger`
- **JSON Spec:** `http://localhost:3000/swagger.json`

### Características de la Documentación

- 📋 Listado completo de endpoints
- 🔐 Autenticación integrada
- 🧪 Pruebas interactivas
- 📖 Esquemas de request/response

---

## 🔌 WebSocket Events

### Eventos del Cliente → Servidor

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `conversation:join` | `{ conversation_id }` | Unirse a sala de conversación |
| `conversation:leave` | `{ conversation_id }` | Salir de sala de conversación |
| `message:send` | `{ conversation_id, message_text }` | Enviar mensaje |
| `conversation:read` | `{ conversation_id }` | Marcar conversación como leída |

### Eventos del Servidor → Cliente

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `message:new` | `{ conversation_id, message_id, ... }` | Nuevo mensaje recibido |
| `notification:new` | `{ type, ... }` | Nueva notificación |
| `conversation:read` | `{ conversation_id, user_id }` | Conversación marcada como leída |

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor, sigue estos pasos:

1. **Fork** el repositorio
2. **Crea** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add: nueva característica'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre** un Pull Request

### Convenciones de Commits

- `Add:` Nueva funcionalidad
- `Fix:` Corrección de bugs
- `Update:` Actualizaciones menores
- `Refactor:` Refactorización de código
- `Docs:` Cambios en documentación

---

## 📄 Licencia

Este proyecto está bajo la licencia **ISC**.

---

<p align="center">
  Desarrollado con ❤️ para la comunidad de la <strong>Universidad Nacional de Colombia</strong>
</p>

<p align="center">
  <a href="#-tabla-de-contenidos">⬆️ Volver arriba</a>
</p>

