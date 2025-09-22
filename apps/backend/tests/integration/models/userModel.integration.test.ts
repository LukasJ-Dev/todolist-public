// User Model Integration Tests
// Tests user model behavior with real database operations

import { userModel } from '../../../src/models/userModel';
import { testUserData } from '../../setup/auth';

describe('User Model Integration', () => {
  describe('Password Hashing', () => {
    it('should hash password on save', async () => {
      const user = new userModel({
        name: testUserData.name,
        email: testUserData.email,
        password: testUserData.password,
      });

      await user.save();

      expect(user.password).not.toBe(testUserData.password);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should not hash password if not modified', async () => {
      const user = new userModel({
        name: testUserData.name,
        email: testUserData.email,
        password: testUserData.password,
      });

      await user.save();
      const originalHash = user.password;

      // Update name but not password
      user.name = 'Updated Name';
      await user.save();

      expect(user.password).toBe(originalHash);
    });

    it('should handle bcrypt errors gracefully', async () => {
      const user = new userModel({
        name: testUserData.name,
        email: testUserData.email,
        password: testUserData.password,
      });

      // Mock bcrypt to throw an error
      const originalHash = require('bcryptjs').hash;
      require('bcryptjs').hash = jest
        .fn()
        .mockRejectedValue(new Error('Bcrypt error'));

      await expect(user.save()).rejects.toThrow('Bcrypt error');

      // Restore original function
      require('bcryptjs').hash = originalHash;
    });
  });

  describe('Validation', () => {
    it('should validate email format', async () => {
      const user = new userModel({
        name: testUserData.name,
        email: 'invalid-email',
        password: testUserData.password,
      });

      await expect(user.save()).rejects.toThrow('Please enter a valid email');
    });

    it('should validate name length', async () => {
      const user = new userModel({
        name: 'A', // Too short
        email: testUserData.email,
        password: testUserData.password,
      });

      await expect(user.save()).rejects.toThrow(
        'Name must be at least 2 characters'
      );
    });

    it('should validate password length', async () => {
      const user = new userModel({
        name: testUserData.name,
        email: testUserData.email,
        password: '123', // Too short
      });

      await expect(user.save()).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });

    it('should enforce unique email constraint', async () => {
      // Create first user
      await userModel.create({
        name: testUserData.name,
        email: testUserData.email,
        password: testUserData.password,
      });

      // Try to create second user with same email
      const duplicateUser = new userModel({
        name: 'Another User',
        email: testUserData.email,
        password: 'differentpassword',
      });

      await expect(duplicateUser.save()).rejects.toThrow('duplicate key error');
    });
  });

  describe('Methods', () => {
    it('should validate credentials correctly', async () => {
      await userModel.create({
        name: testUserData.name,
        email: testUserData.email,
        password: testUserData.password,
      });

      const result = await userModel.validateCredentials(
        testUserData.email,
        testUserData.password
      );

      expect(result).toBeTruthy();
      expect(result?.email).toBe(testUserData.email);
      expect(result?.password).toBeUndefined(); // Should be removed
    });

    it('should return null for invalid credentials', async () => {
      await userModel.create({
        name: testUserData.name,
        email: testUserData.email,
        password: testUserData.password,
      });

      const result = await userModel.validateCredentials(
        testUserData.email,
        'wrongpassword'
      );

      expect(result).toBeNull();
    });

    it('should check password correctly', async () => {
      const user = await userModel.create({
        name: testUserData.name,
        email: testUserData.email,
        password: testUserData.password,
      });

      const isValid = await user.checkPassword(testUserData.password);
      expect(isValid).toBe(true);

      const isInvalid = await user.checkPassword('wrongpassword');
      expect(isInvalid).toBe(false);
    });

    it('should handle missing password in checkPassword', async () => {
      const user = new userModel({
        name: testUserData.name,
        email: testUserData.email,
        password: testUserData.password,
      });

      // Don't save the user, so password won't be hashed
      const isValid = await user.checkPassword(testUserData.password);
      expect(isValid).toBe(false);
    });
  });

  describe('Database Operations', () => {
    it('should create user with valid data', async () => {
      const user = await userModel.create({
        name: testUserData.name,
        email: testUserData.email,
        password: testUserData.password,
      });

      expect(user._id).toBeDefined();
      expect(user.name).toBe(testUserData.name);
      expect(user.email).toBe(testUserData.email);
      expect(user.password).not.toBe(testUserData.password);
    });

    it('should find user by email', async () => {
      await userModel.create({
        name: testUserData.name,
        email: testUserData.email,
        password: testUserData.password,
      });

      const foundUser = await userModel.findOne({ email: testUserData.email });
      expect(foundUser).toBeTruthy();
      expect(foundUser?.email).toBe(testUserData.email);
    });

    it('should select password when explicitly requested', async () => {
      await userModel.create({
        name: testUserData.name,
        email: testUserData.email,
        password: testUserData.password,
      });

      const userWithoutPassword = await userModel.findOne({
        email: testUserData.email,
      });
      expect(userWithoutPassword?.password).toBeUndefined();

      const userWithPassword = await userModel
        .findOne({ email: testUserData.email })
        .select('+password');
      expect(userWithPassword?.password).toBeDefined();
    });
  });
});
