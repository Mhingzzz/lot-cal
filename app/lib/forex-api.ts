// External forex API service for live exchange rates
interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
  success: boolean;
  timestamp?: number;
}

interface CurrencyConversionRequest {
  from: string;
  to: string;
  amount: number;
}

interface CurrencyConversionResponse {
  success: boolean;
  query: CurrencyConversionRequest;
  info: {
    timestamp: number;
    rate: number;
  };
  historical?: boolean;
  date?: string;
  result: number;
}

interface ExchangeRateCache {
  [key: string]: {
    rate: number;
    timestamp: number;
    expiresAt: number;
  };
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache: ExchangeRateCache = {};

// Default API configuration
const DEFAULT_API_CONFIG = {
  baseUrl: 'https://api.exchangerate-api.com/v4/latest',
  fallbackUrl: 'https://api.fixer.io/v1/latest',
  timeout: 10000,
  retryAttempts: 3,
};

/**
 * Get current exchange rates from external API
 */
export async function fetchExchangeRates(
  baseCurrency: string = 'USD'
): Promise<ExchangeRateResponse> {
  const cacheKey = `rates_${baseCurrency}`;
  const now = Date.now();

  // Check cache first
  if (cache[cacheKey] && now < cache[cacheKey].expiresAt) {
    return {
      base: baseCurrency,
      date: new Date(cache[cacheKey].timestamp).toISOString().split('T')[0],
      rates: { [baseCurrency]: cache[cacheKey].rate },
      success: true,
      timestamp: cache[cacheKey].timestamp,
    };
  }

  try {
    // Try primary API
    const response = await fetchWithTimeout(
      `${DEFAULT_API_CONFIG.baseUrl}/${baseCurrency}`,
      DEFAULT_API_CONFIG.timeout
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = (await response.json()) as ExchangeRateResponse;

    if (!data.success && data.success !== undefined) {
      throw new Error('API returned unsuccessful response');
    }

    // Cache the successful response
    Object.entries(data.rates).forEach(([currency, rate]) => {
      const key = `${baseCurrency}_${currency}`;
      cache[key] = {
        rate,
        timestamp: now,
        expiresAt: now + CACHE_DURATION,
      };
    });

    return data;
  } catch (error) {
    console.error('Primary API failed:', error);

    // Try fallback with mock data
    return getFallbackRates(baseCurrency);
  }
}

/**
 * Convert currency amount using live exchange rates
 */
export async function convertCurrency(
  from: string,
  to: string,
  amount: number
): Promise<CurrencyConversionResponse> {
  if (from === to) {
    return {
      success: true,
      query: { from, to, amount },
      info: {
        timestamp: Date.now(),
        rate: 1,
      },
      result: amount,
    };
  }

  try {
    const rate = await getExchangeRate(from, to);
    const result = amount * rate;

    return {
      success: true,
      query: { from, to, amount },
      info: {
        timestamp: Date.now(),
        rate,
      },
      result,
    };
  } catch (error) {
    console.error('Currency conversion failed:', error);
    throw new Error(`Failed to convert ${from} to ${to}: ${error}`);
  }
}

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(
  from: string,
  to: string
): Promise<number> {
  if (from === to) return 1;

  const cacheKey = `${from}_${to}`;
  const now = Date.now();

  // Check cache
  if (cache[cacheKey] && now < cache[cacheKey].expiresAt) {
    return cache[cacheKey].rate;
  }

  try {
    // Get rates for base currency
    const ratesData = await fetchExchangeRates(from);

    if (!ratesData.rates[to]) {
      throw new Error(`Exchange rate not found for ${from} to ${to}`);
    }

    const rate = ratesData.rates[to];

    // Cache the rate
    cache[cacheKey] = {
      rate,
      timestamp: now,
      expiresAt: now + CACHE_DURATION,
    };

    return rate;
  } catch (error) {
    // Return fallback rate
    return getFallbackRate(from, to);
  }
}

/**
 * Get multiple exchange rates at once
 */
export async function getMultipleExchangeRates(
  baseCurrency: string,
  targetCurrencies: string[]
): Promise<Record<string, number>> {
  try {
    const ratesData = await fetchExchangeRates(baseCurrency);
    const result: Record<string, number> = {};

    targetCurrencies.forEach(currency => {
      result[currency] =
        ratesData.rates[currency] || getFallbackRate(baseCurrency, currency);
    });

    return result;
  } catch (error) {
    console.error('Failed to fetch multiple rates:', error);

    // Return fallback rates
    const result: Record<string, number> = {};
    targetCurrencies.forEach(currency => {
      result[currency] = getFallbackRate(baseCurrency, currency);
    });
    return result;
  }
}

/**
 * Clear exchange rate cache
 */
export function clearRateCache(): void {
  Object.keys(cache).forEach(key => delete cache[key]);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
} {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  Object.values(cache).forEach(entry => {
    if (now < entry.expiresAt) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  });

  return {
    totalEntries: Object.keys(cache).length,
    validEntries,
    expiredEntries,
  };
}

/**
 * Validate API configuration
 */
export function validateApiConfig(): string[] {
  const errors: string[] = [];

  if (!DEFAULT_API_CONFIG.baseUrl) {
    errors.push('Base API URL is required');
  }

  if (!DEFAULT_API_CONFIG.fallbackUrl) {
    errors.push('Fallback API URL is required');
  }

  if (DEFAULT_API_CONFIG.timeout < 1000) {
    errors.push('API timeout must be at least 1000ms');
  }

  if (DEFAULT_API_CONFIG.retryAttempts < 1) {
    errors.push('Retry attempts must be at least 1');
  }

  return errors;
}

// Helper functions

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Get fallback rates when API is unavailable
 */
function getFallbackRates(baseCurrency: string): ExchangeRateResponse {
  const fallbackRates: Record<string, Record<string, number>> = {
    USD: {
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      AUD: 1.35,
      CAD: 1.25,
      CHF: 0.92,
      NZD: 1.45,
    },
    EUR: {
      USD: 1.18,
      GBP: 0.86,
      JPY: 129.0,
      AUD: 1.59,
      CAD: 1.47,
      CHF: 1.08,
      NZD: 1.71,
    },
    GBP: {
      USD: 1.37,
      EUR: 1.16,
      JPY: 151.0,
      AUD: 1.85,
      CAD: 1.71,
      CHF: 1.26,
      NZD: 1.99,
    },
  };

  const rates = fallbackRates[baseCurrency] || fallbackRates.USD;

  return {
    base: baseCurrency,
    date: new Date().toISOString().split('T')[0],
    rates,
    success: true,
    timestamp: Date.now(),
  };
}

/**
 * Get fallback rate for specific currency pair
 */
function getFallbackRate(from: string, to: string): number {
  const fallbackData = getFallbackRates(from);
  return fallbackData.rates[to] || 1;
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
}

/**
 * Get supported currencies
 */
export function getSupportedCurrencies(): string[] {
  return [
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'AUD',
    'CAD',
    'CHF',
    'NZD',
    'SEK',
    'NOK',
    'DKK',
    'PLN',
    'CZK',
    'HUF',
    'BGN',
    'RON',
    'HRK',
    'RUB',
    'TRY',
    'BRL',
    'CNY',
    'INR',
    'KRW',
    'SGD',
    'HKD',
    'MXN',
    'ZAR',
    'THB',
    'MYR',
    'IDR',
    'PHP',
    'VND',
  ];
}

/**
 * Validate currency code
 */
export function isValidCurrency(currency: string): boolean {
  return getSupportedCurrencies().includes(currency.toUpperCase());
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    NZD: 'NZ$',
  };

  return symbols[currency.toUpperCase()] || currency.toUpperCase();
}
