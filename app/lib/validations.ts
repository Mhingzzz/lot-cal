import { z } from 'zod';

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .optional(),
});

// Currency pair validation schemas
export const currencyPairSchema = z.object({
  baseCurrency: z
    .string()
    .length(3, 'Currency code must be 3 characters')
    .toUpperCase(),
  quoteCurrency: z
    .string()
    .length(3, 'Currency code must be 3 characters')
    .toUpperCase(),
  symbol: z
    .string()
    .length(6, 'Symbol must be 6 characters (e.g., EURUSD)')
    .toUpperCase(),
  pipSize: z.number().positive('Pip size must be positive').default(0.0001),
  isActive: z.boolean().default(true),
});

// Exchange rate validation schemas
export const exchangeRateSchema = z.object({
  rate: z.number().positive('Exchange rate must be positive'),
  currencyPairId: z.string().cuid('Invalid currency pair ID'),
  source: z.string().optional(),
});

// Lot size calculation input validation schema
export const lotSizeCalculationSchema = z.object({
  accountBalance: z
    .number()
    .positive('Account balance must be positive')
    .min(100, 'Account balance must be at least $100'),

  riskPercentage: z
    .number()
    .positive('Risk percentage must be positive')
    .max(10, 'Risk percentage should not exceed 10%')
    .min(0.1, 'Risk percentage must be at least 0.1%'),

  entryPrice: z.number().positive('Entry price must be positive'),

  stopLossPrice: z.number().positive('Stop loss price must be positive'),

  accountCurrency: z
    .string()
    .length(3, 'Account currency must be 3 characters')
    .toUpperCase()
    .default('USD'),

  currencyPairId: z.string().cuid('Invalid currency pair ID'),
});

// Calculation result validation schema
export const calculationResultSchema = z.object({
  accountBalance: z.number().positive(),
  riskPercentage: z.number().positive(),
  entryPrice: z.number().positive(),
  stopLossPrice: z.number().positive(),
  accountCurrency: z.string().length(3),
  currencyPairId: z.string().cuid(),
  riskAmount: z.number().positive(),
  pipValue: z.number().positive(),
  lotSize: z.number().positive(),
  pipDistance: z.number().positive(),
  userId: z.string().cuid().optional(),
});

// API response schemas
export const lotSizeCalculationResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      riskAmount: z.number(),
      pipValue: z.number(),
      lotSize: z.number(),
      pipDistance: z.number(),
      calculationId: z.string().cuid().optional(), // Only present if saved
    })
    .optional(),
  error: z.string().optional(),
});

export const currencyPairListResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .array(
      z.object({
        id: z.string().cuid(),
        symbol: z.string(),
        baseCurrency: z.string(),
        quoteCurrency: z.string(),
        pipSize: z.number(),
        isActive: z.boolean(),
        currentRate: z.number().optional(),
      })
    )
    .optional(),
  error: z.string().optional(),
});

export const calculationHistoryResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .array(
      z.object({
        id: z.string().cuid(),
        accountBalance: z.number(),
        riskPercentage: z.number(),
        entryPrice: z.number(),
        stopLossPrice: z.number(),
        accountCurrency: z.string(),
        riskAmount: z.number(),
        pipValue: z.number(),
        lotSize: z.number(),
        pipDistance: z.number(),
        createdAt: z.string().datetime(),
        currencyPair: z.object({
          symbol: z.string(),
          baseCurrency: z.string(),
          quoteCurrency: z.string(),
        }),
      })
    )
    .optional(),
  error: z.string().optional(),
});

// Form validation schemas for client-side
export const lotCalculatorFormSchema = z.object({
  accountBalance: z
    .string()
    .min(1, 'Account balance is required')
    .transform(val => parseFloat(val))
    .refine(
      val => !isNaN(val) && val > 0,
      'Account balance must be a positive number'
    ),

  riskPercentage: z
    .string()
    .min(1, 'Risk percentage is required')
    .transform(val => parseFloat(val))
    .refine(
      val => !isNaN(val) && val > 0 && val <= 10,
      'Risk percentage must be between 0.1% and 10%'
    ),

  entryPrice: z
    .string()
    .min(1, 'Entry price is required')
    .transform(val => parseFloat(val))
    .refine(
      val => !isNaN(val) && val > 0,
      'Entry price must be a positive number'
    ),

  stopLossPrice: z
    .string()
    .min(1, 'Stop loss price is required')
    .transform(val => parseFloat(val))
    .refine(
      val => !isNaN(val) && val > 0,
      'Stop loss price must be a positive number'
    ),

  currencyPair: z
    .string()
    .min(1, 'Currency pair is required')
    .cuid('Invalid currency pair selection'),

  accountCurrency: z
    .string()
    .length(3, 'Account currency must be 3 characters')
    .toUpperCase()
    .default('USD'),
});

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Type exports for TypeScript
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CurrencyPairInput = z.infer<typeof currencyPairSchema>;
export type ExchangeRateInput = z.infer<typeof exchangeRateSchema>;
export type LotSizeCalculationInput = z.infer<typeof lotSizeCalculationSchema>;
export type CalculationResultInput = z.infer<typeof calculationResultSchema>;
export type LotCalculatorFormInput = z.infer<typeof lotCalculatorFormSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
