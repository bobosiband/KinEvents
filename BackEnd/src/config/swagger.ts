type OpenAPIV3_0 = any

const swaggerDocument: OpenAPIV3_0 = {
  openapi: '3.0.0',
  info: {
    title: 'KinEvents API',
    version: '1.0.0',
    description: 'Comprehensive API for managing events, users, and notifications for family gatherings',
    contact: {
      name: 'KinEvents Support',
      url: 'https://kinevents.app',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Local development server',
    },
    {
      url: 'https://api.kinevents.app',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer token authorization',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'manager', 'member'] },
          accessStatus: { type: 'string', enum: ['pending', 'approved', 'rejected', 'revoked'] },
          birthday: { type: 'string', format: 'date' },
          capabilities: { type: 'array', items: { type: 'string' } },
          notificationPrefs: {
            type: 'object',
            properties: {
              level: { type: 'string', enum: ['all', 'important', 'none'] },
              channels: { type: 'array', items: { type: 'string', enum: ['email', 'push'] } },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Event: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          location: { type: 'string' },
          onlineLink: { type: 'string' },
          imageUrl: { type: 'string' },
          type: { type: 'string', enum: ['birthday', 'custom'] },
          locked: { type: 'boolean' },
          createdBy: { type: 'string', format: 'uuid' },
          rsvps: { type: 'object', additionalProperties: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AccessRequest: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          message: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
          requestedAt: { type: 'string', format: 'date-time' },
          resolvedAt: { type: 'string', format: 'date-time' },
          resolvedBy: { type: 'string' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: {
            type: 'string',
            enum: ['event_created', 'event_updated', 'event_reminder', 'birthday_reminder', 'birthday_today', 'access_approved', 'access_rejected'],
          },
          recipientId: { type: 'string', format: 'uuid' },
          payload: { type: 'object' },
          status: { type: 'string', enum: ['pending', 'sent', 'failed'] },
          createdAt: { type: 'string', format: 'date-time' },
          sentAt: { type: 'string', format: 'date-time' },
        },
      },
      ContentBlock: {
        type: 'object',
        properties: {
          key: { type: 'string', enum: ['homepage_title', 'homepage_subtitle', 'homepage_image_url', 'announcement'] },
          value: { type: 'string' },
          updatedAt: { type: 'string', format: 'date-time' },
          updatedBy: { type: 'string', format: 'uuid' },
        },
      },
      ApiSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          details: { type: 'object' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Check if the API is running',
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    env: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/request-access': {
      post: {
        tags: ['Authentication'],
        summary: 'Request access to the application',
        description: 'Submit a new access request',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Access request created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '400': {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/api/auth/approve-access': {
      post: {
        tags: ['Authentication'],
        summary: 'Approve access request',
        description: 'Approve a pending access request and create or update the user (Admin only)',
        security: [{ bearerAuth: [] }],
        'x-required-role': 'admin',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['accessRequestId'],
                properties: {
                  accessRequestId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Access approved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '401': {
            description: 'Missing or invalid authentication token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '403': {
            description: 'Insufficient permissions (admin role required)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '404': {
            description: 'Access request not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login to get authentication token',
        description: 'Authenticate with email and receive a JWT token (for approved users)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', description: 'User email address' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string', description: 'JWT Bearer token (valid for 7 days)' },
                      },
                    },
                    message: { type: 'string', example: 'Login successful' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '403': {
            description: 'User account is not approved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/api/auth/revoke-access': {
      post: {
        tags: ['Authentication'],
        summary: 'Revoke access request',
        description: 'Reject a pending access request (Admin only)',
        security: [{ bearerAuth: [] }],
        'x-required-role': 'admin',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['accessRequestId'],
                properties: {
                  accessRequestId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Access revoked successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '401': {
            description: 'Missing or invalid authentication token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '403': {
            description: 'Insufficient permissions (admin role required)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '404': {
            description: 'Access request not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users',
        description: 'Get all approved users (Authentication required)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of users',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '401': {
            description: 'Missing or invalid authentication token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user details',
        description: 'Get details for a specific user (Authentication required)',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '401': {
            description: 'Missing or invalid authentication token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user',
        description: 'Update user profile information (Authentication required)',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  birthday: { 
                    type: 'string', 
                    format: 'date',
                    description: 'Birthday in YYYY-MM-DD format (e.g., "1990-05-15")'
                  },
                  notificationPrefs: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '400': {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '401': {
            description: 'Missing or invalid authentication token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user',
        description: 'Delete a user (Authentication required)',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '401': {
            description: 'Missing or invalid authentication token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/api/users/promote': {
      post: {
        tags: ['Users'],
        summary: 'Promote user role',
        description: 'Promote a user to admin or manager',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'role'],
                properties: {
                  userId: { type: 'string', format: 'uuid' },
                  role: { type: 'string', enum: ['admin', 'manager', 'member'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User promoted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/api/events': {
      get: {
        tags: ['Events'],
        summary: 'List all events',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of events',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Events'],
        summary: 'Create event',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'date', 'createdBy'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  date: { type: 'string', format: 'date-time' },
                  createdBy: { type: 'string', format: 'uuid' },
                  location: { type: 'string' },
                  onlineLink: { type: 'string' },
                  imageUrl: { type: 'string' },
                  type: { type: 'string', enum: ['birthday', 'custom'] },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Event created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '400': {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/api/events/{id}': {
      get: {
        tags: ['Events'],
        summary: 'Get event details',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Event details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '404': {
            description: 'Event not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Events'],
        summary: 'Update event',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  date: { type: 'string', format: 'date-time' },
                  location: { type: 'string' },
                  onlineLink: { type: 'string' },
                  imageUrl: { type: 'string' },
                  locked: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Event updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '404': {
            description: 'Event not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Events'],
        summary: 'Delete event',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Event deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '404': {
            description: 'Event not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/api/events/rsvp': {
      post: {
        tags: ['Events'],
        summary: 'Set event RSVP',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['eventId', 'userId', 'status'],
                properties: {
                  eventId: { type: 'string', format: 'uuid' },
                  userId: { type: 'string', format: 'uuid' },
                  status: { type: 'string', enum: ['yes', 'no', 'maybe'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'RSVP recorded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '404': {
            description: 'Event not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/api/birthdays/upcoming': {
      get: {
        tags: ['Birthdays'],
        summary: 'Get upcoming birthdays',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10 },
          },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Upcoming birthdays',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
        },
      },
    },
    '/api/birthdays/generate': {
      post: {
        tags: ['Birthdays'],
        summary: 'Generate birthday events',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  year: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Birthday events generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
        },
      },
    },
    '/api/notifications/send': {
      post: {
        tags: ['Notifications'],
        summary: 'Send notification',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'recipientId', 'payload'],
                properties: {
                  type: { type: 'string' },
                  recipientId: { type: 'string', format: 'uuid' },
                  payload: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Notification created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '400': {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/api/admin/create-admin': {
      post: {
        tags: ['Admin'],
        summary: 'Create admin user',
        description: 'Create the first admin user (requires admin secret)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'secret'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  secret: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Admin user created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
          '400': {
            description: 'Admin already exists or validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
          '403': {
            description: 'Invalid admin secret',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/api/admin/content': {
      get: {
        tags: ['Admin'],
        summary: 'Get all content blocks',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of content blocks',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create or update content block',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['key', 'value', 'updatedBy'],
                properties: {
                  key: { type: 'string', enum: ['homepage_title', 'homepage_subtitle', 'homepage_image_url', 'announcement'] },
                  value: { type: 'string' },
                  updatedBy: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Content updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
        },
      },
    },
    '/api/admin/dashboard': {
      get: {
        tags: ['Admin'],
        summary: 'Get admin dashboard',
        description: 'Get dashboard metrics and summaries',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Dashboard data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
              },
            },
          },
        },
      },
    },
  },
}

export default swaggerDocument
