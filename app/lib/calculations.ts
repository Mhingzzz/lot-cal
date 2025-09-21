import { Decimal } from 'decimal.js';

// Types for calculation inputs and results
export interface CalculationInput {
  accountBalance: number;
  riskPercentage: number;
  entryPrice: number;
  stopLossPrice: number;
  accountCurrency: string;
  baseCurrency: string;
  quoteCurrency: string;
}

export interface CalculationResult {
  riskAmount: number;
  pipDistance: number;
  pipValue: number;
  lotSize: number;
}

/**
 * Calculate the risk amount based on account balance and risk percentage
 */
export function calculateRiskAmount(
  accountBalance: number,
  riskPercentage: number
): number {
  const balance = new Decimal(accountBalance);
  const risk = new Decimal(riskPercentage).div(100);
  return balance.mul(risk).toNumber();
}

/**
 * Calculate pip distance between entry and stop loss prices
 */
export function calculatePipDistance(
  entryPrice: number,
  stopLossPrice: number,
  baseCurrency: string,
  quoteCurrency: string
): number {
  const entry = new Decimal(entryPrice);
  const stopLoss = new Decimal(stopLossPrice);
  const difference = entry.sub(stopLoss).abs();

  // For JPY pairs, pip is in the 2nd decimal place (0.01)
  // For other pairs, pip is in the 4th decimal place (0.0001)
  const isJpyPair = baseCurrency === 'JPY' || quoteCurrency === 'JPY';
  const pipSize = isJpyPair ? new Decimal(0.01) : new Decimal(0.0001);

  return difference.div(pipSize).toNumber();
}

/**
 * Calculate pip value for a currency pair
 */
export function calculatePipValue(
  baseCurrency: string,
  quoteCurrency: string,
  accountCurrency: string,
  exchangeRate?: number
): number {
  const isJpyPair = baseCurrency === 'JPY' || quoteCurrency === 'JPY';
  const pipSize = isJpyPair ? 0.01 : 0.0001;

  // Standard lot size
  const standardLotSize = 100000;

  if (quoteCurrency === accountCurrency) {
    // Direct quote: EUR/USD with USD account
    return pipSize * standardLotSize;
  } else if (baseCurrency === accountCurrency) {
    // Indirect quote: USD/CHF with USD account
    // Need to convert using exchange rate
    if (!exchangeRate) {
      throw new Error('Exchange rate required for indirect quote calculation');
    }
    return (pipSize * standardLotSize) / exchangeRate;
  } else {
    // Cross currency: EUR/GBP with USD account
    // This requires additional conversion - simplified for now
    if (!exchangeRate) {
      throw new Error('Exchange rate required for cross currency calculation');
    }
    return pipSize * standardLotSize * exchangeRate;
  }
}

/**
 * Calculate lot size based on risk parameters
 */
export function calculateLotSize(
  riskAmount: number,
  pipDistance: number,
  pipValue: number
): number {
  if (pipDistance <= 0 || pipValue <= 0) {
    throw new Error('Pip distance and pip value must be positive');
  }

  const risk = new Decimal(riskAmount);
  const distance = new Decimal(pipDistance);
  const value = new Decimal(pipValue);

  // Lot size = Risk Amount / (Pip Distance * Pip Value per pip)
  const lotSize = risk.div(distance.mul(value));

  return lotSize.toNumber();
}

/**
 * Main calculation function that combines all calculations
 */
export function performLotSizeCalculation(
  input: CalculationInput,
  exchangeRate?: number
): CalculationResult {
  // Validate inputs
  if (input.accountBalance <= 0) {
    throw new Error('Account balance must be positive');
  }
  if (input.riskPercentage <= 0 || input.riskPercentage > 100) {
    throw new Error('Risk percentage must be between 0 and 100');
  }
  if (input.entryPrice <= 0) {
    throw new Error('Entry price must be positive');
  }
  if (input.stopLossPrice <= 0) {
    throw new Error('Stop loss price must be positive');
  }
  if (input.entryPrice === input.stopLossPrice) {
    throw new Error('Entry price and stop loss price cannot be equal');
  }

  try {
    // Calculate each component
    const riskAmount = calculateRiskAmount(
      input.accountBalance,
      input.riskPercentage
    );
    const pipDistance = calculatePipDistance(
      input.entryPrice,
      input.stopLossPrice,
      input.baseCurrency,
      input.quoteCurrency
    );
    const pipValue = calculatePipValue(
      input.baseCurrency,
      input.quoteCurrency,
      input.accountCurrency,
      exchangeRate
    );
    const lotSize = calculateLotSize(riskAmount, pipDistance, pipValue);

    return {
      riskAmount,
      pipDistance,
      pipValue,
      lotSize,
    };
  } catch (error) {
    throw new Error(
      `Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Utility function to format lot size for display
 */
export function formatLotSize(lotSize: number): string {
  if (lotSize >= 1) {
    return lotSize.toFixed(2) + ' standard lots';
  } else if (lotSize >= 0.1) {
    return (lotSize * 10).toFixed(1) + ' mini lots';
  } else {
    return (lotSize * 1000).toFixed(0) + ' micro lots';
  }
}

/**
 * Utility function to validate business rules
 */
export function validateBusinessRules(input: CalculationInput): string[] {
  const errors: string[] = [];

  // Risk percentage should not exceed 10% (best practice)
  if (input.riskPercentage > 10) {
    errors.push('Risk percentage exceeds recommended maximum of 10%');
  }

  // Account balance should be reasonable (at least $100)
  if (input.accountBalance < 100) {
    errors.push('Account balance is too low (minimum $100)');
  }

  // Entry and stop loss should make sense for trade direction
  const isLongTrade = input.entryPrice < input.stopLossPrice;
  const isShortTrade = input.entryPrice > input.stopLossPrice;

  if (!isLongTrade && !isShortTrade) {
    errors.push('Entry price and stop loss price must be different');
  }

  return errors;
}
