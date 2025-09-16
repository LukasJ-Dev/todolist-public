// E2E test setup
// This file sets up the environment for end-to-end tests
// E2E tests may start the full application, use real HTTP requests, etc.

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start in-memory MongoDB instance for E2E tests
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
  
  // TODO: Start the actual Express server for E2E tests
  // This would typically involve importing and starting your app
});

afterAll(async () => {
  // Clean up database connection
  await mongoose.disconnect();
  await mongoServer.stop();
  
  // TODO: Stop the Express server
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
