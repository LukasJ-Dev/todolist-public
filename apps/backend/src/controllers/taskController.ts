import { Response, Request } from 'express';
import { TaskModel } from '../models/taskModel';
import { TodolistModel } from '../models/todolistModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import response from '../utils/response';
import {
  toObjectId,
  handleDatabaseError,
  validateOwnership,
} from '../utils/database';

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Get user's tasks
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: todolist
 *         schema:
 *           type: string
 *         description: Filter tasks by todolist ID
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TasksResponse'
 *             examples:
 *               success:
 *                 summary: User's tasks
 *                 value:
 *                   success: true
 *                   tasks:
 *                     - id: "507f1f77bcf86cd799439011"
 *                       name: "Buy groceries"
 *                       description: "Get milk, bread, and eggs"
 *                       checked: false
 *                       todolist:
 *                         id: "507f1f77bcf86cd799439012"
 *                         name: "Shopping List"
 *                       owner: "507f1f77bcf86cd799439010"
 *                       createdAt: "2024-01-15T10:30:45.123Z"
 *                       updatedAt: "2024-01-15T10:30:45.123Z"
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Todolist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getMyTasks = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  try {
    let tasks;

    if (req.query.todolist) {
      // Validate todolist ID
      const todolistId = toObjectId(req.query.todolist as string);

      // Verify todolist exists and belongs to user
      const todolist = await TodolistModel.findOne({
        _id: todolistId,
        owner: userId,
      });

      if (!todolist) {
        throw new AppError('Todolist not found', 404);
      }

      // Get tasks for specific todolist
      tasks = await TaskModel.find({
        todolist: todolistId,
        owner: userId,
      }).populate('todolist', 'name');
    } else {
      // Get all tasks for user
      tasks = await TaskModel.find({ owner: userId })
        .populate('todolist', 'name')
        .sort({ createdAt: -1 });
    }

    response.ok(res, { tasks });
  } catch (error) {
    throw handleDatabaseError(error);
  }
});

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *           examples:
 *             example1:
 *               summary: Create a new task
 *               value:
 *                 name: "Buy groceries"
 *                 description: "Get milk, bread, and eggs from the store"
 *                 todolist: "507f1f77bcf86cd799439012"
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *             examples:
 *               success:
 *                 summary: Task created
 *                 value:
 *                   success: true
 *                   task:
 *                     id: "507f1f77bcf86cd799439011"
 *                     name: "Buy groceries"
 *                     description: "Get milk, bread, and eggs from the store"
 *                     checked: false
 *                     todolist:
 *                       id: "507f1f77bcf86cd799439012"
 *                       name: "Shopping List"
 *                     owner: "507f1f77bcf86cd799439010"
 *                     createdAt: "2024-01-15T10:30:45.123Z"
 *                     updatedAt: "2024-01-15T10:30:45.123Z"
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Todolist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const createTask = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Log task creation attempt
  req.log.info(
    {
      userId,
      todolistId: req.body.todolist,
      taskName: req.body.name,
    },
    'Creating task'
  );

  try {
    // Validate todolist ID
    const todolistId = toObjectId(req.body.todolist);

    // Verify todolist exists and belongs to user
    const todolist = await TodolistModel.findOne({
      _id: todolistId,
      owner: userId,
    });

    if (!todolist) {
      req.log.warn(
        {
          userId,
          todolistId: req.body.todolist,
        },
        'Task creation failed - todolist not found'
      );
      throw new AppError('Todolist not found', 404);
    }

    const newTask = await TaskModel.create({
      name: req.body.name,
      todolist: todolistId,
      description: req.body.description,
      owner: userId,
      checked: false,
    });

    // Populate the todolist reference
    await newTask.populate('todolist', 'name');

    // Log successful task creation
    req.log.info(
      {
        userId,
        taskId: newTask._id,
        todolistId,
        taskName: req.body.name,
      },
      'Task created successfully'
    );

    response.created(res, { task: newTask });
  } catch (error) {
    req.log.error(
      {
        userId,
        todolistId: req.body.todolist,
        taskName: req.body.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Task creation failed'
    );
    throw handleDatabaseError(error);
  }
});

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskRequest'
 *           examples:
 *             example1:
 *               summary: Update task
 *               value:
 *                 name: "Buy groceries (updated)"
 *                 description: "Get milk, bread, eggs, and cheese"
 *                 checked: true
 *                 todolist: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskResponse'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Task not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateTask = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Log task update attempt
  req.log.info(
    {
      userId,
      taskId: req.params.task,
      updates: Object.keys(req.body),
    },
    'Updating task'
  );

  try {
    // Validate task ID
    const taskId = toObjectId(req.params.task);

    // Find and validate ownership
    const task = await TaskModel.findOne({
      _id: taskId,
      owner: userId,
    });

    validateOwnership(task, userId, 'Task');

    // If updating todolist, verify it exists and belongs to user
    if (req.body.todolist) {
      const todolistId = toObjectId(req.body.todolist);
      const todolist = await TodolistModel.findOne({
        _id: todolistId,
        owner: userId,
      });

      if (!todolist) {
        req.log.warn(
          {
            userId,
            taskId,
            todolistId: req.body.todolist,
          },
          'Task update failed - todolist not found'
        );
        throw new AppError('Todolist not found', 404);
      }
    }

    const editedTask = await TaskModel.findOneAndUpdate(
      { _id: taskId, owner: userId },
      req.body,
      { new: true, runValidators: true }
    ).populate('todolist', 'name');

    // Log successful task update
    req.log.info(
      {
        userId,
        taskId,
        updates: Object.keys(req.body),
      },
      'Task updated successfully'
    );

    response.ok(res, { task: editedTask });
  } catch (error) {
    req.log.error(
      {
        userId,
        taskId: req.params.task,
        updates: Object.keys(req.body),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Task update failed'
    );
    throw handleDatabaseError(error);
  }
});

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       204:
 *         description: Task deleted successfully
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Task not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Log task deletion attempt
  req.log.info(
    {
      userId,
      taskId: req.params.task,
    },
    'Deleting task'
  );

  try {
    // Validate task ID
    const taskId = toObjectId(req.params.task);

    // Find and validate ownership
    const task = await TaskModel.findOne({
      _id: taskId,
      owner: userId,
    });

    validateOwnership(task, userId, 'Task');

    // Delete the task
    await TaskModel.deleteOne({ _id: taskId, owner: userId });

    // Log successful task deletion
    req.log.info(
      {
        userId,
        taskId,
      },
      'Task deleted successfully'
    );

    response.noContent(res, { message: 'Task deleted successfully' });
  } catch (error) {
    req.log.error(
      {
        userId,
        taskId: req.params.task,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Task deletion failed'
    );
    throw handleDatabaseError(error);
  }
});
