import { VerifiedAccessToken } from '../services/auth/accessService';

// Extend Express Request interface with custom properties
declare global {
  namespace Express {
    interface Request {
      // Authentication properties
      auth?: VerifiedAccessToken;
      user?: { id: string; name: string; email: string } | null;

      // Request correlation ID
      id: string;
    }
  }
}

// This file is used to extend the Express Request interface
// Import this file in your main app.ts or server.ts to ensure types are available
export {};
