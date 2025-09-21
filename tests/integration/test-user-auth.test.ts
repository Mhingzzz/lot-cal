import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as RegisterPost } from '../../app/api/auth/register/route';
import { POST as LoginPost } from '../../app/api/auth/login/route';
import { prisma } from '../../app/lib/db';

// Mock the database for integration testing
jest.mock('../../app/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Integration Test: User Registration and Login Flow', () => {
  // Test complete user authentication journey

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Complete Registration Flow', () => {
    it('should successfully register a new user with valid data', async () => {
      // Mock user does not exist yet
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Mock successful user creation
      const mockCreatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser as any);

      // Registration request
      const registrationData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        name: 'Test User',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registrationData),
        }
      );

      // Execute registration
      const response = await RegisterPost(request);
      const result = await response.json();

      // Verify successful registration
      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration successful');

      // Verify user data in response
      expect(result.data.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: mockCreatedUser.createdAt,
        updatedAt: mockCreatedUser.updatedAt,
      });

      // Verify session token is provided
      expect(result.data.session.token).toBeDefined();
      expect(result.data.session.expiresAt).toBeDefined();

      // Verify database interactions
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    });

    it('should handle registration validation errors', async () => {
      const invalidRegistrations = [
        {
          name: 'Missing email',
          data: {
            password: 'SecurePassword123!',
            confirmPassword: 'SecurePassword123!',
            name: 'Test User',
          },
          expectedStatus: 400,
          expectedError: 'Validation failed',
        },
        {
          name: 'Invalid email format',
          data: {
            email: 'invalid-email',
            password: 'SecurePassword123!',
            confirmPassword: 'SecurePassword123!',
            name: 'Test User',
          },
          expectedStatus: 400,
          expectedError: 'Validation failed',
        },
        {
          name: 'Weak password',
          data: {
            email: 'test@example.com',
            password: 'weak',
            confirmPassword: 'weak',
            name: 'Test User',
          },
          expectedStatus: 400,
          expectedError: 'Validation failed',
        },
        {
          name: 'Password mismatch',
          data: {
            email: 'test@example.com',
            password: 'SecurePassword123!',
            confirmPassword: 'DifferentPassword123!',
            name: 'Test User',
          },
          expectedStatus: 400,
          expectedError: 'Validation failed',
        },
        {
          name: 'Missing name',
          data: {
            email: 'test@example.com',
            password: 'SecurePassword123!',
            confirmPassword: 'SecurePassword123!',
            name: '',
          },
          expectedStatus: 400,
          expectedError: 'Validation failed',
        },
      ];

      for (const testCase of invalidRegistrations) {
        const request = new NextRequest(
          'http://localhost:3000/api/auth/register',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testCase.data),
          }
        );

        const response = await RegisterPost(request);
        const result = await response.json();

        expect(response.status).toBe(testCase.expectedStatus);
        expect(result.success).toBe(false);
        expect(result.error).toContain(testCase.expectedError);
      }
    });

    it('should prevent duplicate email registration', async () => {
      // Mock existing user
      const existingUser = {
        id: 'existing-user-123',
        email: 'test@example.com',
        name: 'Existing User',
      };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser as any);

      const request = new NextRequest(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'SecurePassword123!',
            confirmPassword: 'SecurePassword123!',
            name: 'Test User',
          }),
        }
      );

      const response = await RegisterPost(request);
      const result = await response.json();

      expect(response.status).toBe(409);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');

      // Verify user creation was not attempted
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('Complete Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      // Mock existing user
      const existingUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser as any);

      const loginData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      // Execute login
      const response = await LoginPost(request);
      const result = await response.json();

      // Verify successful login
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');

      // Verify user data in response
      expect(result.data.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: existingUser.createdAt,
        updatedAt: existingUser.updatedAt,
      });

      // Verify session token is provided
      expect(result.data.session.token).toBeDefined();
      expect(result.data.session.expiresAt).toBeDefined();

      // Verify database interaction
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should handle login validation errors', async () => {
      const invalidLogins = [
        {
          name: 'Missing email',
          data: {
            password: 'SecurePassword123!',
          },
          expectedStatus: 400,
          expectedError: 'Validation failed',
        },
        {
          name: 'Invalid email format',
          data: {
            email: 'invalid-email',
            password: 'SecurePassword123!',
          },
          expectedStatus: 400,
          expectedError: 'Validation failed',
        },
        {
          name: 'Missing password',
          data: {
            email: 'test@example.com',
          },
          expectedStatus: 400,
          expectedError: 'Validation failed',
        },
        {
          name: 'Empty password',
          data: {
            email: 'test@example.com',
            password: '',
          },
          expectedStatus: 400,
          expectedError: 'Validation failed',
        },
      ];

      for (const testCase of invalidLogins) {
        const request = new NextRequest(
          'http://localhost:3000/api/auth/login',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testCase.data),
          }
        );

        const response = await LoginPost(request);
        const result = await response.json();

        expect(response.status).toBe(testCase.expectedStatus);
        expect(result.success).toBe(false);
        expect(result.error).toContain(testCase.expectedError);
      }
    });

    it('should reject login with non-existent email', async () => {
      // Mock user not found
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123!',
        }),
      });

      const response = await LoginPost(request);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should handle case insensitive email login', async () => {
      // Mock existing user with lowercase email
      const existingUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser as any);

      // Login with mixed case email
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'TEST@EXAMPLE.COM',
          password: 'SecurePassword123!',
        }),
      });

      const response = await LoginPost(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      // Verify database was queried with lowercase email
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('Complete Registration-to-Login Flow', () => {
    it('should allow immediate login after successful registration', async () => {
      // Step 1: Registration
      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // User doesn't exist
      const newUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        name: 'New User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.create.mockResolvedValue(newUser as any);

      const registerRequest = new NextRequest(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'newuser@example.com',
            password: 'SecurePassword123!',
            confirmPassword: 'SecurePassword123!',
            name: 'New User',
          }),
        }
      );

      const registerResponse = await RegisterPost(registerRequest);
      const registerResult = await registerResponse.json();

      expect(registerResponse.status).toBe(201);
      expect(registerResult.success).toBe(true);

      // Step 2: Immediate login with same credentials
      mockPrisma.user.findUnique.mockResolvedValueOnce(newUser as any); // User now exists

      const loginRequest = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'newuser@example.com',
            password: 'SecurePassword123!',
          }),
        }
      );

      const loginResponse = await LoginPost(loginRequest);
      const loginResult = await loginResponse.json();

      expect(loginResponse.status).toBe(200);
      expect(loginResult.success).toBe(true);
      expect(loginResult.data.user.email).toBe('newuser@example.com');
    });
  });

  describe('Session Management', () => {
    it('should provide valid session tokens for authenticated users', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(user as any);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePassword123!',
        }),
      });

      const response = await LoginPost(request);
      const result = await response.json();

      // Verify session data structure
      expect(result.data.session).toEqual({
        token: expect.stringContaining('session_user-123_'),
        expiresAt: expect.any(String),
      });

      // Verify session expires in 24 hours
      const expiryTime = new Date(result.data.session.expiresAt);
      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Allow 1 minute tolerance for test execution time
      expect(expiryTime.getTime()).toBeGreaterThan(
        expectedExpiry.getTime() - 60000
      );
      expect(expiryTime.getTime()).toBeLessThan(
        expectedExpiry.getTime() + 60000
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during registration', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'SecurePassword123!',
            confirmPassword: 'SecurePassword123!',
            name: 'Test User',
          }),
        }
      );

      const response = await RegisterPost(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Registration failed');
    });

    it('should handle database errors during login', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePassword123!',
        }),
      });

      const response = await LoginPost(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Login failed');
    });
  });
});
