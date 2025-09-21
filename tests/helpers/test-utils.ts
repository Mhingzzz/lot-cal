import { jest } from '@jest/globals';

// Create a properly mocked Prisma client for integration tests
export function createMockPrisma() {
  return {
    user: {
      create: jest.fn() as jest.MockedFunction<any>,
      findUnique: jest.fn() as jest.MockedFunction<any>,
      findMany: jest.fn() as jest.MockedFunction<any>,
      update: jest.fn() as jest.MockedFunction<any>,
      delete: jest.fn() as jest.MockedFunction<any>,
    },
    calculation: {
      create: jest.fn() as jest.MockedFunction<any>,
      findUnique: jest.fn() as jest.MockedFunction<any>,
      findMany: jest.fn() as jest.MockedFunction<any>,
      update: jest.fn() as jest.MockedFunction<any>,
      delete: jest.fn() as jest.MockedFunction<any>,
    },
    currencyPair: {
      create: jest.fn() as jest.MockedFunction<any>,
      findUnique: jest.fn() as jest.MockedFunction<any>,
      findMany: jest.fn() as jest.MockedFunction<any>,
      update: jest.fn() as jest.MockedFunction<any>,
      delete: jest.fn() as jest.MockedFunction<any>,
    },
    exchangeRate: {
      create: jest.fn() as jest.MockedFunction<any>,
      findUnique: jest.fn() as jest.MockedFunction<any>,
      findMany: jest.fn() as jest.MockedFunction<any>,
      update: jest.fn() as jest.MockedFunction<any>,
      delete: jest.fn() as jest.MockedFunction<any>,
    },
    $connect: jest.fn() as jest.MockedFunction<any>,
    $disconnect: jest.fn() as jest.MockedFunction<any>,
    $transaction: jest.fn() as jest.MockedFunction<any>,
  };
}

// Create a NextRequest compatible with Jest testing
export function createTestRequest(url: string, options: RequestInit = {}) {
  // Use standard Request constructor and cast to NextRequest
  // This avoids the read-only url property issue
  const request = new Request(url, options);

  // Add NextJS-specific properties that might be needed
  Object.defineProperty(request, 'nextUrl', {
    value: new URL(url),
    writable: false,
    enumerable: true,
  });

  Object.defineProperty(request, 'cookies', {
    value: new Map(),
    writable: false,
    enumerable: true,
  });

  return request as any; // Cast to NextRequest type
}
