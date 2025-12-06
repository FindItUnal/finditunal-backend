import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FindIt UNAL Backend API',
      version: '1.0.0',
      description:
        'API REST para el sistema de objetos perdidos y encontrados de la Universidad Nacional de Colombia. ' +
        'Esta API permite gestionar reportes de objetos perdidos/encontrados, usuarios, categorías, ubicaciones e imágenes.',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo',
      },
      {
        url: 'https://api.finditunal.com',
        description: 'Servidor de producción',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description:
            'Autenticación mediante cookie HTTP-only. El token se obtiene mediante el flujo OAuth de Google. ' +
            'Para obtener el token, primero debe iniciar sesión con Google en /auth/google',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'ID único del usuario',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario',
              example: 'usuario@unal.edu.co',
            },
            google_id: {
              type: 'string',
              description: 'ID de Google del usuario',
              example: '123456789',
            },
            name: {
              type: 'string',
              description: 'Nombre completo del usuario',
              example: 'Juan Pérez',
            },
            phone_number: {
              type: 'string',
              nullable: true,
              description: 'Número de teléfono del usuario',
              example: '+57 300 123 4567',
            },
            is_confirmed: {
              type: 'boolean',
              description: 'Indica si el usuario está confirmado',
              example: true,
            },
            is_active: {
              type: 'boolean',
              description: 'Indica si el usuario está activo',
              example: true,
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'Rol del usuario',
              example: 'user',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
              example: '2024-01-15T10:30:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización',
              example: '2024-01-15T10:30:00Z',
            },
          },
        },
        UpdateUser: {
          type: 'object',
          properties: {
            phone_number: {
              type: 'string',
              minLength: 7,
              maxLength: 20,
              nullable: true,
              description: 'Número de teléfono del usuario',
              example: '+57 300 123 4567',
            },
          },
        },
        Report: {
          type: 'object',
          properties: {
            report_id: {
              type: 'integer',
              description: 'ID único del reporte',
              example: 1,
            },
            user_id: {
              type: 'string',
              description: 'ID del usuario que creó el reporte',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            category_id: {
              type: 'integer',
              description: 'ID de la categoría',
              example: 1,
            },
            location_id: {
              type: 'integer',
              description: 'ID de la ubicación',
              example: 1,
            },
            title: {
              type: 'string',
              description: 'Título del reporte',
              example: 'Billetera encontrada en biblioteca',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Descripción detallada del objeto',
              example: 'Billetera negra con documentos de identidad',
            },
            status: {
              type: 'string',
              enum: ['perdido', 'encontrado', 'entregado'],
              description: 'Estado del reporte',
              example: 'encontrado',
            },
            date_lost_or_found: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha en que se perdió o encontró el objeto',
              example: '2024-01-15T12:00:00Z',
            },
            contact_method: {
              type: 'string',
              description: 'Método de contacto',
              example: 'email: usuario@unal.edu.co',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación del reporte',
              example: '2024-01-15T10:30:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización',
              example: '2024-01-15T10:30:00Z',
            },
          },
        },
        CreateReport: {
          type: 'object',
          required: ['category_id', 'location_id', 'title', 'status', 'date_lost_or_found', 'contact_method'],
          properties: {
            category_id: {
              type: 'string',
              description: 'ID de la categoría (se convierte a número)',
              example: '1',
            },
            location_id: {
              type: 'string',
              description: 'ID de la ubicación (se convierte a número)',
              example: '1',
            },
            title: {
              type: 'string',
              minLength: 1,
              description: 'Título del reporte',
              example: 'Billetera encontrada en biblioteca',
            },
            description: {
              type: 'string',
              description: 'Descripción detallada del objeto',
              example: 'Billetera negra con documentos de identidad',
            },
            status: {
              type: 'string',
              enum: ['perdido', 'encontrado', 'entregado'],
              description: 'Estado del reporte',
              example: 'encontrado',
            },
            date_lost_or_found: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
              description: 'Fecha en formato YYYY-MM-DD',
              example: '2024-01-15',
            },
            contact_method: {
              type: 'string',
              minLength: 1,
              description: 'Método de contacto',
              example: 'email: usuario@unal.edu.co',
            },
            image: {
              type: 'string',
              format: 'binary',
              description: 'Imagen del objeto (multipart/form-data)',
            },
          },
        },
        UpdateReport: {
          type: 'object',
          properties: {
            category_id: {
              type: 'string',
              description: 'ID de la categoría (se convierte a número)',
              example: '1',
            },
            location_id: {
              type: 'string',
              description: 'ID de la ubicación (se convierte a número)',
              example: '1',
            },
            title: {
              type: 'string',
              minLength: 1,
              description: 'Título del reporte',
              example: 'Billetera encontrada en biblioteca',
            },
            description: {
              type: 'string',
              description: 'Descripción detallada del objeto',
              example: 'Billetera negra con documentos de identidad',
            },
            status: {
              type: 'string',
              enum: ['perdido', 'encontrado', 'entregado'],
              description: 'Estado del reporte',
              example: 'encontrado',
            },
            date_lost_or_found: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
              description: 'Fecha en formato YYYY-MM-DD',
              example: '2024-01-15',
            },
            contact_method: {
              type: 'string',
              minLength: 1,
              description: 'Método de contacto',
              example: 'email: usuario@unal.edu.co',
            },
          },
        },
        Complaint: {
          type: 'object',
          properties: {
            complaint_id: {
              type: 'integer',
              description: 'ID único de la denuncia',
              example: 10,
            },
            report_id: {
              type: 'integer',
              description: 'ID del reporte denunciado',
              example: 5,
            },
            reporter_user_id: {
              type: 'string',
              description: 'Usuario que envió la denuncia',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            reason: {
              type: 'string',
              enum: ['spam', 'inappropriate', 'fraud', 'other'],
              description: 'Motivo de la denuncia',
              example: 'spam',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Detalle enviado por el usuario',
              example: 'El reporte incluye información ofensiva.',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_review', 'resolved', 'rejected'],
              description: 'Estado de revisión',
              example: 'pending',
            },
            admin_notes: {
              type: 'string',
              nullable: true,
              description: 'Notas internas del administrador',
              example: 'Se solicitó más evidencia al denunciante.',
            },
            resolved_by: {
              type: 'string',
              nullable: true,
              description: 'ID del administrador que resolvió la denuncia',
              example: 'admin-user-id',
            },
            resolved_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha de resolución',
              example: '2024-02-10T15:00:00Z',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
              example: '2024-02-09T12:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Última actualización',
              example: '2024-02-10T16:00:00Z',
            },
          },
        },
        CreateComplaint: {
          type: 'object',
          required: ['reason'],
          properties: {
            reason: {
              type: 'string',
              enum: ['spam', 'inappropriate', 'fraud', 'other'],
              description: 'Motivo seleccionado',
              example: 'fraud',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Explicación opcional del usuario',
              example: 'Se está intentando vender un artículo inexistente.',
            },
          },
        },
        UpdateComplaint: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'in_review', 'resolved', 'rejected'],
              description: 'Nuevo estado de la denuncia',
              example: 'in_review',
            },
            admin_notes: {
              type: 'string',
              description: 'Notas internas para dejar trazabilidad',
              example: 'Se está verificando la información con el denunciante.',
            },
          },
        },
        ChatConversation: {
          type: 'object',
          properties: {
            conversation_id: {
              type: 'integer',
              description: 'ID unico de la conversacion',
              example: 1,
            },
            report_id: {
              type: 'integer',
              description: 'ID del reporte asociado',
              example: 10,
            },
            user1_id: {
              type: 'string',
              description: 'ID del usuario propietario del reporte',
              example: 'user_owner_1234',
            },
            user2_id: {
              type: 'string',
              description: 'ID del usuario interesado',
              example: 'user_interested_5678',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creacion de la conversacion',
              example: '2024-02-10T12:00:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de ultima actividad en la conversacion',
              example: '2024-02-10T13:00:00Z',
            },
          },
        },
        ChatConversationSummary: {
          type: 'object',
          properties: {
            conversation_id: {
              type: 'integer',
              description: 'ID unico de la conversacion',
              example: 1,
            },
            report_id: {
              type: 'integer',
              description: 'ID del reporte asociado',
              example: 10,
            },
            report_title: {
              type: 'string',
              description: 'Titulo del reporte asociado',
              example: 'Billetera perdida en la biblioteca',
            },
            other_user_id: {
              type: 'string',
              description: 'ID del otro usuario participante',
              example: 'user_interested_5678',
            },
            other_user_name: {
              type: 'string',
              description: 'Nombre del otro usuario participante',
              example: 'Juan Perez',
            },
            last_message_text: {
              type: 'string',
              nullable: true,
              description: 'Contenido del ultimo mensaje enviado en la conversacion',
              example: 'Muchas gracias por responder',
            },
            last_message_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha del ultimo mensaje',
              example: '2024-02-10T13:00:00Z',
            },
            unread_count: {
              type: 'integer',
              description: 'Cantidad de mensajes no leidos por el usuario',
              example: 2,
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de ultima actividad en la conversacion',
              example: '2024-02-10T13:00:00Z',
            },
          },
        },
        ChatMessage: {
          type: 'object',
          properties: {
            message_id: {
              type: 'integer',
              description: 'ID unico del mensaje',
              example: 1,
            },
            conversation_id: {
              type: 'integer',
              description: 'ID de la conversacion a la que pertenece',
              example: 1,
            },
            sender_id: {
              type: 'string',
              description: 'ID del usuario que envio el mensaje',
              example: 'user_owner_1234',
            },
            message_text: {
              type: 'string',
              description: 'Contenido del mensaje',
              example: 'Hola, vi tu publicacion sobre la billetera',
            },
            is_read: {
              type: 'boolean',
              description: 'Indica si el mensaje ya fue leido por el destinatario',
              example: false,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de envio del mensaje',
              example: '2024-02-10T12:30:00Z',
            },
          },
        },
        CreateChatMessage: {
          type: 'object',
          required: ['message_text'],
          properties: {
            message_text: {
              type: 'string',
              description: 'Texto del mensaje a enviar',
              example: 'Hola, estoy interesado en tu publicacion',
            },
          },
        },
        Object: {
          type: 'object',
          properties: {
            report_id: {
              type: 'integer',
              description: 'ID del reporte',
              example: 1,
            },
            title: {
              type: 'string',
              description: 'Título del objeto',
              example: 'Billetera encontrada en biblioteca',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Descripción del objeto',
              example: 'Billetera negra con documentos de identidad',
            },
            category: {
              type: 'string',
              description: 'Nombre de la categoría',
              example: 'Billeteras',
            },
            location: {
              type: 'string',
              description: 'Nombre de la ubicación',
              example: 'Biblioteca Central',
            },
            status: {
              type: 'string',
              enum: ['perdido', 'encontrado', 'entregado'],
              description: 'Estado del objeto',
              example: 'encontrado',
            },
            contact_method: {
              type: 'string',
              description: 'Método de contacto',
              example: 'email: usuario@unal.edu.co',
            },
            date_lost_or_found: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha en que se perdió o encontró',
              example: '2024-01-15T12:00:00Z',
            },
            image_url: {
              type: 'string',
              nullable: true,
              description: 'URL de la imagen del objeto',
              example: 'http://localhost:3000/user/user_id/images/image.jpg',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            category_id: {
              type: 'integer',
              description: 'ID único de la categoría',
              example: 1,
            },
            name: {
              type: 'string',
              description: 'Nombre de la categoría',
              example: 'Billeteras',
            },
          },
        },
        Location: {
          type: 'object',
          properties: {
            location_id: {
              type: 'integer',
              description: 'ID único de la ubicación',
              example: 1,
            },
            name: {
              type: 'string',
              description: 'Nombre de la ubicación',
              example: 'Biblioteca Central',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de éxito',
              example: 'Operación realizada exitosamente',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de error',
              example: 'Error en la operación',
            },
            errors: {
              type: 'object',
              description: 'Errores de validación (opcional)',
              additionalProperties: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ok', 'error'],
              example: 'ok',
            },
            message: {
              type: 'string',
              example: 'El servidor está funcionando correctamente',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
            database: {
              type: 'string',
              enum: ['connected', 'disconnected'],
              example: 'connected',
            },
            uptime: {
              type: 'number',
              description: 'Tiempo de actividad del servidor en segundos',
              example: 3600,
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'No autenticado o token inválido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                message: 'Token no proporcionado',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'No tiene permisos para realizar esta acción',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                message: 'No tienes permiso para realizar esta acción',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                message: 'Recurso no encontrado',
              },
            },
          },
        },
        ValidationError: {
          description: 'Error de validación',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                message: 'Error de validación',
                errors: {
                  title: ['El título es requerido'],
                  date_lost_or_found: ['Formato de fecha inválido (YYYY-MM-DD)'],
                },
              },
            },
          },
        },
        InternalServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                message: 'Error en el servidor',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Endpoints de salud del servidor',
      },
      {
        name: 'Auth',
        description: 'Endpoints de autenticación y autorización',
      },
      {
        name: 'Users',
        description: 'Endpoints de gestión de usuarios',
      },
      {
        name: 'Reports',
        description: 'Endpoints de gestión de reportes de objetos',
      },
      {
        name: 'Objects',
        description: 'Endpoints de consulta de objetos',
      },
      {
        name: 'Categories',
        description: 'Endpoints de categorías',
      },
      {
        name: 'Locations',
        description: 'Endpoints de ubicaciones',
      },
      {
        name: 'Images',
        description: 'Endpoints de imágenes',
      },
      {
        name: 'Complaints',
        description: 'Endpoints para denuncias de publicaciones',
      },
      {
        name: 'Chats',
        description: 'Endpoints de conversaciones y mensajes privados',
      },
    ],
  },
  apis: ['./src/index.ts', './src/routes/*.ts', './src/routes/*Routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
