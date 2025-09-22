// Simple User Model Integration Test
// Tests basic user model functionality with in-memory database

import { userModel } from '../../../src/models/userModel';

describe('Simple User Model Integration', () => {
  it('should create a user with hashed password', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    const user = await userModel.create(userData);

    expect(user._id).toBeDefined();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    expect(user.password).not.toBe(userData.password); // Should be hashed
    expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
  });

  it('should validate email format', async () => {
    const user = new userModel({
      name: 'John Doe',
      email: 'invalid-email',
      password: 'password123',
    });

    await expect(user.save()).rejects.toThrow('Please enter a valid email');
  });

  it('should check password correctly', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    const user = await userModel.create(userData);

    const isValid = await user.checkPassword(userData.password);
    expect(isValid).toBe(true);

    const isInvalid = await user.checkPassword('wrongpassword');
    expect(isInvalid).toBe(false);
  });
});
