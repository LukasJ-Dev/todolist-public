/**
 * Swagger Documentation Index
 * Combines all API documentation into a single object
 */

import { taskSwaggerDocs } from './tasks.swagger';
import { authSwaggerDocs } from './auth.swagger';

/**
 * Combined Swagger documentation for all API endpoints
 */
export const swaggerPaths = {
  ...taskSwaggerDocs,
  ...authSwaggerDocs,
  // Add more API docs here as you create them
  // ...todolistSwaggerDocs,
  // ...userSwaggerDocs,
};
