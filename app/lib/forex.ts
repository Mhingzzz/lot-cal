import { Decimal } from 'decimal.js';

// Configure Decimal.js for high precision forex calculations
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
});

export interface CalculationInput {
  accountBalance: number;
  riskPercentage: number;
  entryPrice: number;
  stopLossPrice: number;
  currencyPair: string;
  accountCurrency?: string;
  leverage?: number;
}

export interface CalculationResult {
  lotSize: number;
  riskAmount: number;
  positionValue: number;
  marginRequired: number;
  pipValue: number;
  pipDistance: number;
  totalRisk: number;
}

export interface CurrencyPairInfo {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  pipPosition: number;
  contractSize: number;
}

/**
 * Standard currency pair information
 */
export const CURRENCY_PAIRS: Record<string, CurrencyPairInfo> = {
  EURUSD: {
    symbol: 'EURUSD',
    baseCurrency: 'EUR',
    quoteCurrency: 'USD',
    pipPosition: 4,
    contractSize: 100000,
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    baseCurrency: 'GBP',
    quoteCurrency: 'USD',
    pipPosition: 4,
    contractSize: 100000,
  },
  USDJPY: {
    symbol: 'USDJPY',
    baseCurrency: 'USD',
    quoteCurrency: 'JPY',
    pipPosition: 2,
    contractSize: 100000,
  },
  GBPJPY: {
    symbol: 'GBPJPY',
    baseCurrency: 'GBP',
    quoteCurrency: 'JPY',
    pipPosition: 2,
    contractSize: 100000,
  },
  AUDUSD: {
    symbol: 'AUDUSD',
    baseCurrency: 'AUD',
    quoteCurrency: 'USD',
    pipPosition: 4,
    contractSize: 100000,
  },
  USDCAD: {
    symbol: 'USDCAD',
    baseCurrency: 'USD',
    quoteCurrency: 'CAD',
    pipPosition: 4,
    contractSize: 100000,
  },
  USDCHF: {
    symbol: 'USDCHF',
    baseCurrency: 'USD',
    quoteCurrency: 'CHF',
    pipPosition: 4,
    contractSize: 100000,
  },
  NZDUSD: {
    symbol: 'NZDUSD',
    baseCurrency: 'NZD',
    quoteCurrency: 'USD',
    pipPosition: 4,
    contractSize: 100000,
  },
};

/**
 * Calculate pip value for a given currency pair and lot size
 */
export function calculatePipValue(
  currencyPair: string,
  lotSize: number,
  accountCurrency: string = 'USD',
  exchangeRate?: number
): number {
  const pairInfo = CURRENCY_PAIRS[currencyPair.toUpperCase()];
  if (!pairInfo) {
    throw new Error(`Unsupported currency pair: ${currencyPair}`);
  }

  const pipSize = new Decimal(10).pow(-pairInfo.pipPosition);
  const contractSize = new Decimal(pairInfo.contractSize);
  const lots = new Decimal(lotSize);

  // Base pip value calculation
  const basePipValue = pipSize.mul(contractSize).mul(lots);

  // Convert to account currency if needed
  if (pairInfo.quoteCurrency === accountCurrency) {
    return basePipValue.toNumber();
  }

  // For cross-currency pairs, use exchange rate if provided
  if (exchangeRate) {
    return basePipValue.mul(exchangeRate).toNumber();
  }

  // Default approximation for USD account
  return basePipValue.toNumber();
}

/**
 * Calculate pip distance between entry and stop loss prices
 */
export function calculatePipDistance(
  entryPrice: number,
  stopLossPrice: number,
  currencyPair: string
): number {
  const pairInfo = CURRENCY_PAIRS[currencyPair.toUpperCase()];
  if (!pairInfo) {
    throw new Error(`Unsupported currency pair: ${currencyPair}`);
  }

  const entry = new Decimal(entryPrice);
  const stopLoss = new Decimal(stopLossPrice);
  const pipMultiplier = new Decimal(10).pow(pairInfo.pipPosition);

  return entry.minus(stopLoss).abs().mul(pipMultiplier).toNumber();
}

/**
 * Main lot size calculation function
 */
export function calculateLotSize(input: CalculationInput): CalculationResult {
  // Validate inputs
  if (input.accountBalance <= 0) {
    throw new Error('Account balance must be positive');
  }
  if (input.riskPercentage <= 0 || input.riskPercentage > 10) {
    throw new Error('Risk percentage must be between 0.1% and 10%');
  }
  if (input.entryPrice <= 0 || input.stopLossPrice <= 0) {
    throw new Error('Entry and stop loss prices must be positive');
  }

  const accountBalance = new Decimal(input.accountBalance);
  const riskPercentage = new Decimal(input.riskPercentage);
  const entryPrice = new Decimal(input.entryPrice);
  const leverage = new Decimal(input.leverage || 100);

  // Calculate risk amount
  const riskAmount = accountBalance.mul(riskPercentage).div(100);

  // Calculate pip distance
  const pipDistance = calculatePipDistance(
    input.entryPrice,
    input.stopLossPrice,
    input.currencyPair
  );

  if (pipDistance === 0) {
    throw new Error('Entry and stop loss prices cannot be the same');
  }

  // Calculate initial lot size estimate
  const pipDistanceDecimal = new Decimal(pipDistance);
  const estimatedLotSize = riskAmount.div(pipDistanceDecimal);

  // Adjust for pip value (simplified calculation)
  const pairInfo = CURRENCY_PAIRS[input.currencyPair.toUpperCase()];
  const pipValuePerLot = pairInfo.pipPosition === 4 ? 10 : 100; // Simplified
  const adjustedLotSize = estimatedLotSize.div(pipValuePerLot);

  // Calculate position value
  const positionValue = adjustedLotSize
    .mul(pairInfo.contractSize)
    .mul(entryPrice);

  // Calculate margin required
  const marginRequired = positionValue.div(leverage);

  // Calculate actual pip value for this lot size
  const actualPipValue = calculatePipValue(
    input.currencyPair,
    adjustedLotSize.toNumber(),
    input.accountCurrency
  );

  return {
    lotSize: Math.round(adjustedLotSize.toNumber() * 100) / 100, // Round to 2 decimal places
    riskAmount: riskAmount.toNumber(),
    positionValue: positionValue.toNumber(),
    marginRequired: marginRequired.toNumber(),
    pipValue: actualPipValue,
    pipDistance: pipDistance,
    totalRisk: riskAmount.toNumber(),
  };
}

/**
 * Validate calculation input parameters
 */
export function validateCalculationInput(input: any): string[] {
  const errors: string[] = [];

  if (!input.accountBalance || typeof input.accountBalance !== 'number') {
    errors.push('Account balance is required and must be a number');
  } else if (input.accountBalance < 100) {
    errors.push('Account balance must be at least $100');
  } else if (input.accountBalance > 1000000) {
    errors.push('Account balance cannot exceed $1,000,000');
  }

  if (!input.riskPercentage || typeof input.riskPercentage !== 'number') {
    errors.push('Risk percentage is required and must be a number');
  } else if (input.riskPercentage < 0.1) {
    errors.push('Risk percentage must be at least 0.1%');
  } else if (input.riskPercentage > 10) {
    errors.push('Risk percentage cannot exceed 10%');
  }

  if (!input.entryPrice || typeof input.entryPrice !== 'number') {
    errors.push('Entry price is required and must be a number');
  } else if (input.entryPrice <= 0) {
    errors.push('Entry price must be positive');
  }

  if (!input.stopLossPrice || typeof input.stopLossPrice !== 'number') {
    errors.push('Stop loss price is required and must be a number');
  } else if (input.stopLossPrice <= 0) {
    errors.push('Stop loss price must be positive');
  }

  if (!input.currencyPair || typeof input.currencyPair !== 'string') {
    errors.push('Currency pair is required and must be a string');
  } else if (!CURRENCY_PAIRS[input.currencyPair.toUpperCase()]) {
    errors.push(`Unsupported currency pair: ${input.currencyPair}`);
  }

  if (
    input.entryPrice &&
    input.stopLossPrice &&
    input.entryPrice === input.stopLossPrice
  ) {
    errors.push('Entry price and stop loss price cannot be the same');
  }

  if (
    input.leverage &&
    (typeof input.leverage !== 'number' ||
      input.leverage < 1 ||
      input.leverage > 500)
  ) {
    errors.push('Leverage must be between 1 and 500');
  }

  return errors;
}

/**
 * Format calculation results for display
 */
export function formatCalculationResult(
  result: CalculationResult
): Record<string, string> {
  return {
    lotSize: result.lotSize.toFixed(2),
    riskAmount: `$${result.riskAmount.toFixed(2)}`,
    positionValue: `$${result.positionValue.toFixed(2)}`,
    marginRequired: `$${result.marginRequired.toFixed(2)}`,
    pipValue: `$${result.pipValue.toFixed(2)}`,
    pipDistance: result.pipDistance.toFixed(1),
    totalRisk: `$${result.totalRisk.toFixed(2)}`,
  };
}
