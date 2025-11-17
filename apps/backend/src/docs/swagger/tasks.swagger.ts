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
        {
          in: 'query',
          name: 'filter',
          schema: {
            type: 'string',
            enum: [
              'all',
              'due_today',
              'due_this_week',
              'overdue',
              'recurring',
              'subtasks',
            ],
          },
          description: 'Filter tasks by status',
          example: 'due_today',
        },
        {
          in: 'query',
          name: 'sort',
          schema: {
            type: 'string',
            enum: ['due_date', 'priority', 'created', 'name'],
          },
          description: 'Sort tasks by criteria',
          example: 'due_date',
        },
        {
          in: 'query',
          name: 'priority',
          schema: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
          },
          description: 'Filter tasks by priority',
          example: 'high',
        },
        {
          in: 'query',
          name: 'tags',
          schema: { type: 'string' },
          description: 'Filter tasks by tags (comma-separated)',
          example: 'work,urgent',
        },
        {
          in: 'query',
          name: 'include',
          schema: {
            type: 'string',
            enum: ['subtasks'],
          },
          description:
            'Include related data (subtasks will be populated as full objects)',
          example: 'subtasks',
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
                          dueDate: '2024-01-20T18:00:00.000Z',
                          startDate: '2024-01-18T09:00:00.000Z',
                          priority: 'medium',
                          isRecurring: false,
                          tags: ['shopping', 'food'],
                          subtasks: [
                            '507f1f77bcf86cd799439013',
                            '507f1f77bcf86cd799439014',
                          ],
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
                withSubtasks: {
                  summary: 'Tasks with populated subtasks (include=subtasks)',
                  value: {
                    success: true,
                    data: {
                      tasks: [
                        {
                          _id: '507f1f77bcf86cd799439011',
                          name: 'Buy groceries',
                          description: 'Get milk, bread, and eggs',
                          checked: false,
                          dueDate: '2024-01-20T18:00:00.000Z',
                          startDate: '2024-01-18T09:00:00.000Z',
                          priority: 'medium',
                          isRecurring: false,
                          tags: ['shopping', 'food'],
                          subtasks: [
                            {
                              _id: '507f1f77bcf86cd799439013',
                              name: 'Get milk',
                              description: '2% milk',
                              checked: false,
                              priority: 'low',
                              tags: ['dairy'],
                            },
                            {
                              _id: '507f1f77bcf86cd799439014',
                              name: 'Get bread',
                              description: 'Whole wheat bread',
                              checked: false,
                              priority: 'low',
                              tags: ['bakery'],
                            },
                          ],
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
                summary: 'Create a basic task',
                value: {
                  name: 'Buy groceries',
                  description: 'Get milk, bread, and eggs from the store',
                  todolist: '507f1f77bcf86cd799439012',
                },
              },
              example2: {
                summary: 'Create an enhanced task with all features',
                value: {
                  name: 'Complete project proposal',
                  description:
                    'Write and submit the quarterly project proposal',
                  todolist: '507f1f77bcf86cd799439012',
                  dueDate: '2024-01-25T17:00:00.000Z',
                  startDate: '2024-01-20T09:00:00.000Z',
                  priority: 'high',
                  isRecurring: false,
                  tags: ['work', 'urgent', 'project'],
                },
              },
              example3: {
                summary: 'Create a recurring task',
                value: {
                  name: 'Weekly team meeting',
                  description: 'Attend the weekly team standup',
                  todolist: '507f1f77bcf86cd799439012',
                  dueDate: '2024-01-22T10:00:00.000Z',
                  priority: 'medium',
                  isRecurring: true,
                  recurrenceType: 'weekly',
                  recurrenceInterval: 1,
                  tags: ['meeting', 'team'],
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
                        dueDate: '2024-01-20T18:00:00.000Z',
                        startDate: '2024-01-18T09:00:00.000Z',
                        priority: 'medium',
                        isRecurring: false,
                        tags: ['shopping', 'food'],
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
                summary: 'Update basic task fields',
                value: {
                  name: 'Buy groceries (updated)',
                  description: 'Get milk, bread, eggs, and cheese',
                  checked: true,
                },
              },
              example2: {
                summary: 'Update task with enhanced features',
                value: {
                  name: 'Complete project proposal',
                  description:
                    'Write and submit the quarterly project proposal',
                  dueDate: '2024-01-30T17:00:00.000Z',
                  startDate: '2024-01-25T09:00:00.000Z',
                  priority: 'high',
                  tags: ['work', 'urgent', 'project', 'deadline'],
                },
              },
              example3: {
                summary: 'Remove due date and update priority',
                value: {
                  dueDate: null,
                  priority: 'low',
                  checked: false,
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
