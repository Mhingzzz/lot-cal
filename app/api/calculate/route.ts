import { NextRequest, NextResponse } from 'next/server';
import { calculateLotSize, validateCalculationInput } from '@/app/lib/forex';
import { getExchangeRate } from '@/app/lib/forex-api';

interface CalculationRequest {
  accountBalance: number;
  riskPercentage: number;
  entryPrice: number;
  stopLossPrice: number;
  currencyPair: string;
  accountCurrency?: string;
  leverage?: number;
}

interface CalculationResponse {
  success: boolean;
  data?: {
    lotSize: number;
    riskAmount: number;
    positionValue: number;
    marginRequired: number;
    pipValue: number;
    pipDistance: number;
    totalRisk: number;
    exchangeRate?: number;
    accountCurrency: string;
    currencyPair: string;
    timestamp: string;
  };
  error?: string;
  errors?: string[];
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<CalculationResponse>> {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    const validationErrors = validateCalculationInput(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    // Extract calculation parameters
    const calculationInput: CalculationRequest = {
      accountBalance: Number(body.accountBalance),
      riskPercentage: Number(body.riskPercentage),
      entryPrice: Number(body.entryPrice),
      stopLossPrice: Number(body.stopLossPrice),
      currencyPair: body.currencyPair.toUpperCase(),
      accountCurrency: body.accountCurrency?.toUpperCase() || 'USD',
      leverage: Number(body.leverage) || 100,
    };

    // Get exchange rate for currency conversion if needed
    let exchangeRate: number | undefined;
    const currencyParts = calculationInput.currencyPair.split('/');
    const quoteCurrency =
      currencyParts[1] || calculationInput.currencyPair.substring(3);

    if (calculationInput.accountCurrency !== quoteCurrency && quoteCurrency) {
      try {
        exchangeRate = await getExchangeRate(
          quoteCurrency,
          calculationInput.accountCurrency ?? 'USD'
        );
      } catch (error) {
        console.warn('Failed to get exchange rate, using default:', error);
        exchangeRate = 1; // Fallback to 1:1 rate
      }
    }

    // Perform lot size calculation
    const result = calculateLotSize(calculationInput);

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: {
          ...result,
          exchangeRate: exchangeRate ?? 1,
          accountCurrency: calculationInput.accountCurrency ?? 'USD',
          currencyPair: calculationInput.currencyPair,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Calculation API error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Unsupported currency pair')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 400 }
        );
      }

      if (
        error.message.includes('must be positive') ||
        error.message.includes('cannot be the same') ||
        error.message.includes('must be between')
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

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during calculation',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for supported currency pairs and configuration
export async function GET(): Promise<NextResponse> {
  try {
    const supportedPairs = [
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

    const supportedCurrencies = [
      'USD',
      'EUR',
      'GBP',
      'JPY',
      'AUD',
      'CAD',
      'CHF',
      'NZD',
    ];

    const defaultLeverage = [50, 100, 200, 400, 500];

    return NextResponse.json(
      {
        success: true,
        data: {
          supportedPairs,
          supportedCurrencies,
          defaultLeverage,
          limits: {
            minAccountBalance: 100,
            maxAccountBalance: 1000000,
            minRiskPercentage: 0.1,
            maxRiskPercentage: 10,
            minLeverage: 1,
            maxLeverage: 500,
          },
          defaults: {
            accountCurrency: 'USD',
            leverage: 100,
            riskPercentage: 2,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Configuration API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load configuration',
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
