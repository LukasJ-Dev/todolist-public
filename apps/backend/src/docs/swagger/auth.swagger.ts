/**
 * Authentication API Swagger Documentation
 * Clean separation of API documentation from controller logic
 */

export const authSwaggerDocs = {
  '/api/v1/auth/signup': {
    post: {
      summary: 'Register a new user',
      description: 'Create a new user account and establish a session',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SignupRequest' },
            examples: {
              example1: {
                summary: 'New user registration',
                value: {
                  name: 'User Name',
                  email: 'user@example.com',
                  password: 'SecurePassword123!',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'User registered successfully',
          headers: {
            'Set-Cookie': {
              description:
                'HttpOnly cookies containing access and refresh tokens',
              schema: {
                type: 'string',
                example:
                  'accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict',
              },
            },
          },
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserResponse' },
              examples: {
                example1: {
                  summary: 'Successful registration',
                  value: {
                    success: true,
                    data: {
                      user: {
                        _id: '507f1f77bcf86cd799439011',
                        name: 'User Name',
                        email: 'user@example.com',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid input data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        409: {
          description: 'Email already exists',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        429: {
          description: 'Too many registration attempts',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/v1/auth/login': {
    post: {
      summary: 'Login user',
      description: 'Authenticate user and establish a session',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
            examples: {
              example1: {
                summary: 'User login',
                value: {
                  email: 'user@example.com',
                  password: 'SecurePassword123!',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          headers: {
            'Set-Cookie': {
              description:
                'HttpOnly cookies containing access and refresh tokens',
              schema: {
                type: 'string',
                example:
                  'accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict',
              },
            },
          },
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserResponse' },
              examples: {
                example1: {
                  summary: 'Successful login',
                  value: {
                    success: true,
                    data: {
                      user: {
                        _id: '507f1f77bcf86cd799439011',
                        name: 'User Name',
                        email: 'user@example.com',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Invalid credentials',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        429: {
          description: 'Too many login attempts',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/v1/auth/refresh': {
    post: {
      summary: 'Refresh access token using refresh token',
      description:
        'Get a new access token using the refresh token from cookies',
      tags: ['Authentication'],
      security: [{ refreshToken: [] }],
      responses: {
        204: {
          description: 'Token refreshed successfully',
          headers: {
            'Set-Cookie': {
              description: 'New HttpOnly cookies containing refreshed tokens',
              schema: {
                type: 'string',
                example:
                  'accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict',
              },
            },
          },
        },
        401: {
          description: 'Invalid or expired refresh token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        429: {
          description: 'Too many refresh attempts',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/v1/auth/logout': {
    post: {
      summary: 'Logout user and invalidate session',
      description: 'Logout the current user and invalidate their session',
      tags: ['Authentication'],
      security: [{ cookieAuth: [] }],
      responses: {
        204: {
          description: 'Logout successful',
          headers: {
            'Set-Cookie': {
              description: 'Cleared HttpOnly cookies',
              schema: {
                type: 'string',
                example:
                  'accessToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
              },
            },
          },
        },
        401: {
          description: 'User not authenticated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/v1/auth/me': {
    get: {
      summary: 'Get current user information',
      description:
        'Retrieve information about the currently authenticated user',
      tags: ['Authentication'],
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'User information retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserResponse' },
              examples: {
                example1: {
                  summary: 'Current user info',
                  value: {
                    success: true,
                    data: {
                      user: {
                        _id: '507f1f77bcf86cd799439011',
                        name: 'User Name',
                        email: 'user@example.com',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'User not authenticated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/v1/auth/sessions': {
    get: {
      summary: 'Get all active sessions for the current user',
      description:
        'Retrieve information about all active sessions for the current user',
      tags: ['Authentication'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Number of sessions per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
          },
        },
      ],
      responses: {
        200: {
          description: 'Sessions retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      sessions: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            familyId: {
                              type: 'string',
                              description: 'Unique session family ID',
                            },
                            createdAt: {
                              type: 'string',
                              format: 'date-time',
                              description: 'When the session was first created',
                            },
                            lastUsedAt: {
                              type: 'string',
                              format: 'date-time',
                              description: 'Last time the session was used',
                            },
                            ipAddress: {
                              type: 'string',
                              description: 'IP address of the session',
                            },
                            userAgent: {
                              type: 'string',
                              description: 'Browser/device information',
                            },
                            active: {
                              type: 'boolean',
                              description:
                                'Whether the session is currently active',
                            },
                            tokenCount: {
                              type: 'integer',
                              description:
                                'Number of tokens in this session family',
                            },
                          },
                        },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          limit: { type: 'integer' },
                          total: { type: 'integer' },
                          pages: { type: 'integer' },
                        },
                      },
                      statusCode: { type: 'number', example: 200 },
                    },
                  },
                },
              },
              examples: {
                example1: {
                  summary: 'Active sessions',
                  value: {
                    success: true,
                    data: {
                      sessions: [
                        {
                          familyId: 'session-family-123',
                          createdAt: '2024-01-15T10:30:00Z',
                          lastUsedAt: '2024-01-15T14:45:00Z',
                          ipAddress: '192.168.1.100',
                          userAgent:
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                          active: true,
                          tokenCount: 1,
                        },
                      ],
                      pagination: {
                        page: 1,
                        limit: 10,
                        total: 1,
                        pages: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'User not authenticated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
};
