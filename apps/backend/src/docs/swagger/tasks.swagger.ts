/**
 * Task API Swagger Documentation
 * Clean separation of API documentation from controller logic
 */

export const taskSwaggerDocs = {
  '/api/v1/tasks': {
    get: {
      summary: "Get user's tasks",
      description:
        'Retrieve all tasks for the authenticated user, optionally filtered by todolist',
      tags: ['Tasks'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'todolist',
          schema: { type: 'string' },
          description: 'Filter tasks by todolist ID',
          example: '507f1f77bcf86cd799439012',
        },
      ],
      responses: {
        200: {
          description: 'Tasks retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TasksResponse' },
              examples: {
                success: {
                  summary: "User's tasks",
                  value: {
                    success: true,
                    data: {
                      tasks: [
                        {
                          _id: '507f1f77bcf86cd799439011',
                          name: 'Buy groceries',
                          description: 'Get milk, bread, and eggs',
                          checked: false,
                          todolist: {
                            _id: '507f1f77bcf86cd799439012',
                            name: 'Shopping List',
                          },
                          owner: '507f1f77bcf86cd799439010',
                          createdAt: '2024-01-15T10:30:45.123Z',
                          updatedAt: '2024-01-15T10:30:45.123Z',
                        },
                      ],
                    },
                    statusCode: 200,
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
        404: {
          description: 'Todolist not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    post: {
      summary: 'Create a new task',
      description: 'Create a new task in the specified todolist',
      tags: ['Tasks'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateTaskRequest' },
            examples: {
              example1: {
                summary: 'Create a new task',
                value: {
                  name: 'Buy groceries',
                  description: 'Get milk, bread, and eggs from the store',
                  todolist: '507f1f77bcf86cd799439012',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Task created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskResponse' },
              examples: {
                success: {
                  summary: 'Task created',
                  value: {
                    success: true,
                    data: {
                      task: {
                        _id: '507f1f77bcf86cd799439011',
                        name: 'Buy groceries',
                        description: 'Get milk, bread, and eggs from the store',
                        checked: false,
                        todolist: {
                          _id: '507f1f77bcf86cd799439012',
                          name: 'Shopping List',
                        },
                        owner: '507f1f77bcf86cd799439010',
                        createdAt: '2024-01-15T10:30:45.123Z',
                        updatedAt: '2024-01-15T10:30:45.123Z',
                      },
                    },
                    statusCode: 201,
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
        401: {
          description: 'User not authenticated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        404: {
          description: 'Todolist not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/v1/tasks/{id}': {
    put: {
      summary: 'Update a task',
      description: 'Update an existing task',
      tags: ['Tasks'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Task ID',
          example: '507f1f77bcf86cd799439011',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateTaskRequest' },
            examples: {
              example1: {
                summary: 'Update task',
                value: {
                  name: 'Buy groceries (updated)',
                  description: 'Get milk, bread, eggs, and cheese',
                  checked: true,
                  todolist: '507f1f77bcf86cd799439012',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Task updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskResponse' },
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
        401: {
          description: 'User not authenticated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        403: {
          description: 'Task not owned by user',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        404: {
          description: 'Task not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Delete a task',
      description: 'Delete an existing task',
      tags: ['Tasks'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Task ID',
          example: '507f1f77bcf86cd799439011',
        },
      ],
      responses: {
        204: {
          description: 'Task deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Task deleted successfully',
                      },
                    },
                  },
                  statusCode: { type: 'number', example: 204 },
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
        403: {
          description: 'Task not owned by user',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        404: {
          description: 'Task not found',
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
