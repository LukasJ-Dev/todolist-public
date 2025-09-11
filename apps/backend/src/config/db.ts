import mongoose, { ConnectionStates } from 'mongoose';
import { validateServerEnv } from './env';
import { logger } from '../utils/logger';

// Get validated environment variables
const env = validateServerEnv(process.env);

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;
const maxRetries = 5;
const retryDelay = 5000; // 5 seconds

// Connection options
const connectionOptions = {
  maxPoolSize: env.DATABASE_POOL_SIZE, // Maintain socket connections
  serverSelectionTimeoutMS: env.DATABASE_CONNECT_TIMEOUT_MS, // Keep trying to send operations
  socketTimeoutMS: env.DATABASE_SOCKET_TIMEOUT_MS, // Close sockets after inactivity
  bufferCommands: false, // Disable mongoose buffering
  retryWrites: true,
  retryReads: true,
};

// Database connection with retry logic
export async function connectToDB(): Promise<void> {
  if (
    isConnected &&
    mongoose.connection.readyState === ConnectionStates.connected
  ) {
    logger.info('Database already connected');
    return;
  }

  if (!env.DATABASE) {
    throw new Error(
      "Couldn't find the database URL in the environment configuration."
    );
  }

  const startTime = Date.now();
  try {
    await mongoose.connect(env.DATABASE, connectionOptions);
    isConnected = true;
    connectionAttempts = 0;
    const connectionTime = Date.now() - startTime;

    logger.info(
      {
        connectionTime: `${connectionTime}ms`,
        database: env.DATABASE.replace(/\/\/.*@/, '//***@'), // Hide credentials
      },
      'Database connected successfully'
    );

    // Set up connection event listeners
    setupConnectionListeners();
  } catch (error) {
    connectionAttempts++;
    logger.error(
      {
        attempt: connectionAttempts,
        maxRetries,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Database connection failed'
    );

    if (connectionAttempts < maxRetries) {
      logger.info(
        {
          retryIn: `${retryDelay / 1000} seconds`,
          attempt: connectionAttempts + 1,
          maxRetries,
        },
        'Retrying database connection'
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return connectToDB();
    } else {
      logger.fatal(
        {
          totalAttempts: connectionAttempts,
          maxRetries,
        },
        'Max database connection attempts reached. Exiting...'
      );
      process.exit(1);
    }
  }
}

// Setup connection event listeners
function setupConnectionListeners(): void {
  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connected to MongoDB');
    isConnected = true;
  });

  mongoose.connection.on('error', (error) => {
    logger.error(
      {
        error: error.message,
        stack: error.stack,
      },
      'Mongoose connection error'
    );
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose disconnected from MongoDB');
    isConnected = false;
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('Mongoose reconnected to MongoDB');
    isConnected = true;
  });

  // Handle application termination
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(
    {
      signal,
    },
    'Received shutdown signal. Starting graceful shutdown...'
  );

  try {
    await mongoose.connection.close();
    logger.info('Database connection closed gracefully');
    process.exit(0);
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        signal,
      },
      'Error during graceful shutdown'
    );
    process.exit(1);
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connected: boolean;
    readyState: string;
    host: string;
    name: string;
    uptime?: number;
  };
}> {
  try {
    const state = mongoose.connection.readyState;
    const isHealthy = state === ConnectionStates.connected;

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      details: {
        connected: isHealthy,
        readyState: getConnectionStateName(state),
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown',
        uptime: isHealthy ? process.uptime() : undefined,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        readyState: 'error',
        host: 'unknown',
        name: 'unknown',
      },
    };
  }
}

// Helper function to get connection state name
function getConnectionStateName(state: ConnectionStates): string {
  const states: Record<number, string> = {
    [ConnectionStates.disconnected]: 'disconnected',
    [ConnectionStates.connected]: 'connected',
    [ConnectionStates.connecting]: 'connecting',
    [ConnectionStates.disconnecting]: 'disconnecting',
  };
  return states[state] || 'unknown';
}

// Export connection status
export { isConnected };
