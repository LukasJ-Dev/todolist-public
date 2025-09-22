// Integration test setup
// This file sets up the environment for integration tests
// Uses in-memory MongoDB for fast, isolated testing

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Set required environment variables for tests
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.HOST = 'localhost';
process.env.DATABASE = 'mongodb://localhost:27017/test';
process.env.DATABASE_POOL_SIZE = '10';
process.env.DATABASE_CONNECT_TIMEOUT_MS = '10000';
process.env.DATABASE_SOCKET_TIMEOUT_MS = '45000';
process.env.DATABASE_SERVER_SELECTION_TIMEOUT_MS = '5000';
process.env.DATABASE_MAX_IDLE_TIME_MS = '30000';
process.env.DATABASE_HEARTBEAT_FREQUENCY_MS = '10000';
process.env.JWT_ALG = 'HS256';
process.env.JWT_SECRET = 'your-super-secret-jwt-key-minimum-32-characters-long';
process.env.JWT_PRIVATE_KEY = 'your-jwt-private-key';
process.env.JWT_PUBLIC_KEY = 'your-jwt-public-key';
process.env.JWT_ISS = 'test-issuer';
process.env.JWT_AUD = 'test-audience';
process.env.JWT_KID = 'test-kid';
process.env.LOG_LEVEL = 'info';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
process.env.SESSION_SECRET =
  'your-super-secret-session-key-minimum-32-characters-long';
process.env.REFRESH_HASH_SECRET =
  'your-super-secret-refresh-hash-key-minimum-32-characters-long';
process.env.REFRESH_TOKEN_TTL_MS = '604800000';
process.env.COOKIE_SAMESITE = 'lax';
process.env.COOKIE_SECURE = 'false';
process.env.COOKIE_DOMAIN = 'localhost';
process.env.ACCESS_COOKIE_NAME = 'accessToken';
process.env.REFRESH_COOKIE_NAME = 'refreshToken';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  try {
    // Start in-memory MongoDB instance with faster setup
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '6.0.14',
        downloadDir: './mongodb-binaries',
      },
      instance: {
        dbName: 'test-db',
      },
    });
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    console.log('✅ Connected to in-memory MongoDB for integration tests');
  } catch (error) {
    console.error('❌ Failed to connect to in-memory database:', error);
    throw error;
  }
}, 60000); // 60 second timeout

afterAll(async () => {
  try {
    // Clean up database connection
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('✅ Disconnected from in-memory MongoDB');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}, 10000); // 10 second timeout

beforeEach(async () => {
  // Clean database between tests for isolation
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Export utilities for use in tests
export { mongoServer };
