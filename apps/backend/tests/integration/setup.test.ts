// Simple integration test to verify setup works
// This test verifies that the in-memory database is working

import mongoose from 'mongoose';

describe('Integration Test Setup', () => {
  it('should connect to in-memory MongoDB', async () => {
    expect(mongoose.connection.readyState).toBe(1); // Connected
  });

  it('should have access to mongoose models', async () => {
    const collections = mongoose.connection.collections;
    expect(collections).toBeDefined();
  });

  it('should be able to perform basic database operations', async () => {
    // Test that we can create a simple document
    const testCollection = mongoose.connection.db.collection('test');
    const result = await testCollection.insertOne({ test: 'data' });
    expect(result.insertedId).toBeDefined();

    // Clean up
    await testCollection.deleteOne({ _id: result.insertedId });
  });
});
