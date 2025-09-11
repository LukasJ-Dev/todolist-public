import swaggerJsdoc from 'swagger-jsdoc';
import { validateServerEnv } from './env';

const env = validateServerEnv(process.env);

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TodoList API',
      version: '1.0.0',
      description:
        'A comprehensive todo list management API with authentication, task management, and todolist organization.',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url:
          env.NODE_ENV === 'production'
            ? 'https://api.example.com'
            : `http://${env.HOST}:${env.PORT}`,
        description:
          env.NODE_ENV === 'production'
            ? 'Production server'
            : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'JWT access token stored in HttpOnly cookie',
        },
        refreshToken: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'JWT refresh token stored in HttpOnly cookie',
        },
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'User display name',
              example: 'User Name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
            },
          },
          required: ['id', 'name', 'email'],
        },

        // Task schemas
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique task identifier',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'Task name',
              example: 'Buy groceries',
              maxLength: 200,
            },
            description: {
              type: 'string',
              description: 'Task description',
              example: 'Get milk, bread, and eggs from the store',
              maxLength: 1000,
            },
            checked: {
              type: 'boolean',
              description: 'Task completion status',
              example: false,
            },
            todolist: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '507f1f77bcf86cd799439012',
                },
                name: {
                  type: 'string',
                  example: 'Shopping List',
                },
              },
              description: 'Associated todolist',
            },
            owner: {
              type: 'string',
              description: 'Task owner ID',
              example: '507f1f77bcf86cd799439011',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task last update timestamp',
            },
          },
          required: ['id', 'name', 'checked', 'todolist', 'owner'],
        },

        // Todolist schemas
        Todolist: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique todolist identifier',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'Todolist name',
              example: 'Shopping List',
              maxLength: 100,
            },
            owner: {
              type: 'string',
              description: 'Todolist owner ID',
              example: '507f1f77bcf86cd799439011',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Todolist creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Todolist last update timestamp',
            },
          },
          required: ['id', 'name', 'owner'],
        },

        // Request schemas
        SignupRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'User display name',
              example: 'User Name',
              minLength: 1,
              maxLength: 50,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              description: 'User password',
              example: 'SecurePassword123!',
              minLength: 8,
            },
          },
          required: ['name', 'email', 'password'],
        },

        LoginRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              description: 'User password',
              example: 'SecurePassword123!',
            },
          },
          required: ['email', 'password'],
        },

        CreateTaskRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Task name',
              example: 'Buy groceries',
              minLength: 1,
              maxLength: 200,
            },
            description: {
              type: 'string',
              description: 'Task description',
              example: 'Get milk, bread, and eggs from the store',
              maxLength: 1000,
            },
            todolist: {
              type: 'string',
              description: 'Todolist ID',
              example: '507f1f77bcf86cd799439012',
            },
          },
          required: ['name', 'todolist'],
        },

        UpdateTaskRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Task name',
              example: 'Buy groceries',
              minLength: 1,
              maxLength: 200,
            },
            description: {
              type: 'string',
              description: 'Task description',
              example: 'Get milk, bread, and eggs from the store',
              maxLength: 1000,
            },
            checked: {
              type: 'boolean',
              description: 'Task completion status',
              example: true,
            },
            todolist: {
              type: 'string',
              description: 'Todolist ID',
              example: '507f1f77bcf86cd799439012',
            },
          },
        },

        CreateTodolistRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Todolist name',
              example: 'Shopping List',
              minLength: 1,
              maxLength: 100,
            },
          },
          required: ['name'],
        },

        UpdateTodolistRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Todolist name',
              example: 'Updated Shopping List',
              minLength: 1,
              maxLength: 100,
            },
          },
        },

        // Response schemas
        UserResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
          required: ['success', 'user'],
        },

        TaskResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            task: {
              $ref: '#/components/schemas/Task',
            },
          },
          required: ['success', 'task'],
        },

        TasksResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            tasks: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Task',
              },
            },
          },
          required: ['success', 'tasks'],
        },

        TodolistResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            todolist: {
              $ref: '#/components/schemas/Todolist',
            },
          },
          required: ['success', 'todolist'],
        },

        TodolistsResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            todolists: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Todolist',
              },
            },
          },
          required: ['success', 'todolists'],
        },

        // Error schemas
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  example: 'ValidationError',
                },
                message: {
                  type: 'string',
                  example: 'Invalid input data',
                },
                statusCode: {
                  type: 'integer',
                  example: 400,
                },
              },
              required: ['message', 'statusCode'],
            },
            stack: {
              type: 'string',
              description: 'Error stack trace (development only)',
            },
          },
          required: ['success', 'error'],
        },

        // Health check schemas
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'healthy',
              enum: ['healthy', 'unhealthy'],
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            uptime: {
              type: 'number',
              description: 'Server uptime in seconds',
              example: 3600,
            },
          },
          required: ['status', 'timestamp'],
        },

        DatabaseHealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'healthy',
              enum: ['healthy', 'unhealthy'],
            },
            details: {
              type: 'object',
              properties: {
                connectionState: {
                  type: 'string',
                  example: 'connected',
                },
                isConnected: {
                  type: 'boolean',
                  example: true,
                },
                connectionTime: {
                  type: 'string',
                  example: '45ms',
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['status', 'details', 'timestamp'],
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Tasks',
        description: 'Task management operations',
      },
      {
        name: 'Todolists',
        description: 'Todolist management operations',
      },
      {
        name: 'Health',
        description: 'System health and monitoring',
      },
    ],
  },
  apis: ['./src/controllers/*.ts', './src/routes/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
