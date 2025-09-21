import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { POST as CalculateAPI } from '../../app/api/calculate/route';
import { createMockPrisma, createTestRequest } from '../helpers/test-utils';

// Create mock prisma instance
const mockPrisma = createMockPrisma();

// Mock external API calls
jest.mock('../../app/lib/forex-api', () => ({
  getExchangeRate: jest.fn(() => Promise.resolve(1.085)),
}));

// Mock the database
jest.mock('../../app/lib/db', () => ({
  prisma: mockPrisma,
}));

describe('POST /api/calculate - Lot Size Calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully calculate lot size with valid EUR/USD parameters', async () => {
    const request = createTestRequest('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountBalance: 10000,
        riskPercentage: 2,
        entryPrice: 1.085,
        stopLossPrice: 1.08,
        currencyPair: 'EURUSD',
        accountCurrency: 'USD',
        leverage: 100,
      }),
    });

    const response = await CalculateAPI(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.lotSize).toBeGreaterThan(0);
    expect(result.data.riskAmount).toBe(200); // 2% of 10000
    expect(result.data.currencyPair).toBe('EURUSD');
    expect(result.data.accountCurrency).toBe('USD');
    expect(result.data.timestamp).toBeDefined();
  });

  it('should handle GBP/JPY calculation correctly', async () => {
    const request = createTestRequest('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountBalance: 50000,
        riskPercentage: 1.5,
        entryPrice: 155.5,
        stopLossPrice: 154.0,
        currencyPair: 'GBPJPY',
        accountCurrency: 'USD',
        leverage: 200,
      }),
    });

    const response = await CalculateAPI(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.lotSize).toBeGreaterThan(0);
    expect(result.data.riskAmount).toBe(750); // 1.5% of 50000
    expect(result.data.pipDistance).toBe(150); // 155.50 - 154.00 in pips
  });

  it('should validate required fields', async () => {
    const invalidRequests = [
      {
        name: 'missing accountBalance',
        data: {
          riskPercentage: 2,
          entryPrice: 1.085,
          stopLossPrice: 1.08,
          currencyPair: 'EURUSD',
        },
      },
      {
        name: 'missing currencyPair',
        data: {
          accountBalance: 10000,
          riskPercentage: 2,
          entryPrice: 1.085,
          stopLossPrice: 1.08,
        },
      },
      {
        name: 'invalid riskPercentage',
        data: {
          accountBalance: 10000,
          riskPercentage: 15, // Too high
          entryPrice: 1.085,
          stopLossPrice: 1.08,
          currencyPair: 'EURUSD',
        },
      },
    ];

    for (const testCase of invalidRequests) {
      const request = createTestRequest('http://localhost:3000/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data),
      });

      const response = await CalculateAPI(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    }
  });

  it('should handle same entry and stop loss prices', async () => {
    const request = createTestRequest('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountBalance: 10000,
        riskPercentage: 2,
        entryPrice: 1.085,
        stopLossPrice: 1.085, // Same as entry
        currencyPair: 'EURUSD',
        accountCurrency: 'USD',
      }),
    });

    const response = await CalculateAPI(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error).toContain('cannot be the same');
  });

  it('should handle unsupported currency pair', async () => {
    const request = createTestRequest('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountBalance: 10000,
        riskPercentage: 2,
        entryPrice: 1.5,
        stopLossPrice: 1.49,
        currencyPair: 'INVALID',
        accountCurrency: 'USD',
      }),
    });

    const response = await CalculateAPI(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported currency pair');
  });

  it('should use default values when optional parameters are missing', async () => {
    const request = createTestRequest('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountBalance: 10000,
        riskPercentage: 2,
        entryPrice: 1.085,
        stopLossPrice: 1.08,
        currencyPair: 'EURUSD',
        // Missing accountCurrency and leverage
      }),
    });

    const response = await CalculateAPI(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.accountCurrency).toBe('USD'); // Default
  });

  it('should handle API errors gracefully', async () => {
    const request = createTestRequest('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountBalance: -1000, // Invalid negative balance
        riskPercentage: 2,
        entryPrice: 1.085,
        stopLossPrice: 1.08,
        currencyPair: 'EURUSD',
      }),
    });

    const response = await CalculateAPI(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error).toContain('must be positive');
  });

  it('should include exchange rate when needed', async () => {
    const request = createTestRequest('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountBalance: 10000,
        riskPercentage: 2,
        entryPrice: 1.085,
        stopLossPrice: 1.08,
        currencyPair: 'EURUSD',
        accountCurrency: 'EUR', // Different from quote currency
      }),
    });

    const response = await CalculateAPI(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.exchangeRate).toBeDefined();
    expect(result.data.exchangeRate).toBeGreaterThan(0);
  });

  it('should handle malformed JSON', async () => {
    const request = createTestRequest('http://localhost:3000/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"invalid": json}', // Malformed JSON
    });

    let response;
    try {
      response = await CalculateAPI(request);
    } catch (error) {
      // If JSON parsing fails before reaching the API
      expect(error).toBeDefined();
      return;
    }

    // If it reaches the API, it should return an error
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
