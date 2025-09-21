import { NextRequest, NextResponse } from 'next/server';
import {
  fetchExchangeRates,
  convertCurrency,
  getExchangeRate,
  getMultipleExchangeRates,
  getSupportedCurrencies,
  isValidCurrency,
  formatCurrency,
  getCacheStats,
} from '@/app/lib/forex-api';

interface ExchangeRatesResponse {
  success: boolean;
  data?: {
    base: string;
    date: string;
    rates: Record<string, number>;
    timestamp?: number;
    source: string;
    cached?: boolean;
  };
  error?: string;
}

interface ConversionResponse {
  success: boolean;
  data?: {
    from: string;
    to: string;
    amount: number;
    result: number;
    rate: number;
    timestamp: number;
    formatted?: {
      input: string;
      output: string;
    };
  };
  error?: string;
}

interface SupportedCurrenciesResponse {
  success: boolean;
  data?: {
    currencies: string[];
    majorPairs: string[];
    cacheStats?: {
      totalEntries: number;
      validEntries: number;
      expiredEntries: number;
    };
  };
  error?: string;
}

// GET /api/rates - Get exchange rates
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const base = url.searchParams.get('base')?.toUpperCase() || 'USD';
    const target = url.searchParams.get('target')?.toUpperCase();
    const convert = url.searchParams.get('convert');
    const amount = parseFloat(url.searchParams.get('amount') || '1');
    const format = url.searchParams.get('format') === 'true';

    // Validate base currency
    if (!isValidCurrency(base)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported base currency: ${base}`,
        },
        { status: 400 }
      );
    }

    // Handle specific conversion request
    if (convert && target) {
      if (!isValidCurrency(convert) || !isValidCurrency(target)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid currency codes for conversion',
          },
          { status: 400 }
        );
      }

      const conversionResult = await convertCurrency(convert, target, amount);

      const response: ConversionResponse = {
        success: true,
        data: {
          from: convert,
          to: target,
          amount,
          result: conversionResult.result,
          rate: conversionResult.info.rate,
          timestamp: conversionResult.info.timestamp,
        },
      };

      if (format) {
        response.data!.formatted = {
          input: formatCurrency(amount, convert),
          output: formatCurrency(conversionResult.result, target),
        };
      }

      return NextResponse.json(response, { status: 200 });
    }

    // Handle single rate request
    if (target) {
      if (!isValidCurrency(target)) {
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported target currency: ${target}`,
          },
          { status: 400 }
        );
      }

      const rate = await getExchangeRate(base, target);

      return NextResponse.json(
        {
          success: true,
          data: {
            base,
            target,
            rate,
            timestamp: Date.now(),
            formatted: format
              ? {
                  rate: `1 ${base} = ${rate.toFixed(4)} ${target}`,
                }
              : undefined,
          },
        },
        { status: 200 }
      );
    }

    // Handle multiple rates request
    const targets = url.searchParams
      .get('targets')
      ?.split(',')
      .map(c => c.toUpperCase());
    if (targets && targets.length > 0) {
      // Validate all target currencies
      const invalidCurrencies = targets.filter(curr => !isValidCurrency(curr));
      if (invalidCurrencies.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported currencies: ${invalidCurrencies.join(', ')}`,
          },
          { status: 400 }
        );
      }

      const rates = await getMultipleExchangeRates(base, targets);

      return NextResponse.json(
        {
          success: true,
          data: {
            base,
            date: new Date().toISOString().split('T')[0],
            rates,
            timestamp: Date.now(),
            source: 'api',
          },
        },
        { status: 200 }
      );
    }

    // Default: get all available rates for base currency
    const exchangeData = await fetchExchangeRates(base);

    const response: ExchangeRatesResponse = {
      success: true,
      data: {
        base: exchangeData.base,
        date: exchangeData.date,
        rates: exchangeData.rates,
        timestamp: exchangeData.timestamp || Date.now(),
        source: 'external-api',
        cached: false, // This would need cache detection logic
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Exchange rates API error:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('not found') ||
        error.message.includes('Unsupported')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch exchange rates',
      },
      { status: 500 }
    );
  }
}

// POST /api/rates - Batch conversion or rate updates
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Handle batch conversions
    if (body.conversions && Array.isArray(body.conversions)) {
      const results = [];

      for (const conversion of body.conversions) {
        if (!conversion.from || !conversion.to || !conversion.amount) {
          results.push({
            success: false,
            error: 'Missing required fields: from, to, amount',
            input: conversion,
          });
          continue;
        }

        try {
          const result = await convertCurrency(
            conversion.from.toUpperCase(),
            conversion.to.toUpperCase(),
            Number(conversion.amount)
          );

          results.push({
            success: true,
            data: {
              from: conversion.from.toUpperCase(),
              to: conversion.to.toUpperCase(),
              amount: Number(conversion.amount),
              result: result.result,
              rate: result.info.rate,
              timestamp: result.info.timestamp,
            },
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Conversion failed',
            input: conversion,
          });
        }
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            conversions: results,
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request format. Expected { conversions: [...] }',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Batch rates API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process batch request',
      },
      { status: 500 }
    );
  }
}

// GET /api/rates/currencies - Get supported currencies
export async function currencies(): Promise<
  NextResponse<SupportedCurrenciesResponse>
> {
  try {
    const supportedCurrencies = getSupportedCurrencies();
    const majorPairs = [
      'EURUSD',
      'GBPUSD',
      'USDJPY',
      'GBPJPY',
      'AUDUSD',
      'USDCAD',
      'USDCHF',
      'NZDUSD',
      'EURJPY',
      'EURGBP',
    ];

    const cacheStats = getCacheStats();

    return NextResponse.json(
      {
        success: true,
        data: {
          currencies: supportedCurrencies,
          majorPairs,
          cacheStats,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Currencies API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load supported currencies',
      },
      { status: 500 }
    );
  }
}

// OPTIONS endpoint for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
