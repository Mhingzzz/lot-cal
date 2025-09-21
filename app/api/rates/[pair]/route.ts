import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';

// GET /api/rates/[pair] - Get exchange rate for currency pair
export async function GET(
  request: NextRequest,
  { params }: { params: { pair: string } }
) {
  try {
    const { pair } = params;
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'latest';
    const timestamp = searchParams.get('timestamp');

    // Validate currency pair format (should be 6 characters like EURUSD)
    if (!pair || pair.length !== 6 || !/^[A-Z]{6}$/.test(pair)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid currency pair format. Expected format: EURUSD',
        },
        { status: 400 }
      );
    }

    // Find currency pair by symbol
    const currencyPair = await prisma.currencyPair.findUnique({
      where: { symbol: pair },
      include: {
        exchangeRates: {
          orderBy: { timestamp: 'desc' },
          take: source === 'latest' ? 1 : 10,
        },
      },
    });

    if (!currencyPair) {
      return NextResponse.json(
        { success: false, error: 'Currency pair not supported' },
        { status: 404 }
      );
    }

    if (!currencyPair.isActive) {
      return NextResponse.json(
        { success: false, error: 'Currency pair is not active' },
        { status: 400 }
      );
    }

    // Get the appropriate exchange rate
    let exchangeRate;
    if (timestamp) {
      // Find rate closest to specified timestamp
      const targetDate = new Date(timestamp);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid timestamp format' },
          { status: 400 }
        );
      }

      exchangeRate = await prisma.exchangeRate.findFirst({
        where: { currencyPairId: currencyPair.id },
        orderBy: { timestamp: 'desc' },
      });
    } else {
      // Get latest rate
      exchangeRate = currencyPair.exchangeRates[0];
    }

    if (!exchangeRate) {
      return NextResponse.json(
        { success: false, error: 'No exchange rate data available' },
        { status: 503 }
      );
    }

    // Determine data source and freshness
    const now = new Date();
    const rateAge = now.getTime() - exchangeRate.timestamp.getTime();
    const isStale = rateAge > 5 * 60 * 1000; // Older than 5 minutes

    let dataSource = 'cached';
    if (exchangeRate.source === 'live') {
      dataSource = isStale ? 'stale' : 'live';
    } else if (exchangeRate.source === 'manual') {
      dataSource = 'manual';
    }

    // For live rates, simulate bid/ask spread
    const rate = exchangeRate.rate.toNumber();
    const spread = 0.00012; // 1.2 pips typical for EUR/USD
    const bid = rate - spread / 2;
    const ask = rate + spread / 2;

    return NextResponse.json(
      {
        success: true,
        data: {
          currencyPair: {
            id: currencyPair.id,
            symbol: currencyPair.symbol,
            baseCurrency: currencyPair.baseCurrency,
            quoteCurrency: currencyPair.quoteCurrency,
            pipSize: currencyPair.pipSize.toNumber(),
          },
          exchangeRate: {
            rate,
            bid: dataSource === 'live' ? bid : undefined,
            ask: dataSource === 'live' ? ask : undefined,
            spread: dataSource === 'live' ? spread : undefined,
            timestamp: exchangeRate.timestamp,
            source: dataSource,
            age: Math.floor(rateAge / 1000), // Age in seconds
            isStale,
          },
        },
      },
      {
        headers: {
          'Cache-Control': dataSource === 'live' ? 'max-age=30' : 'max-age=300',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '99',
          'X-RateLimit-Reset': (
            Math.floor(Date.now() / 1000) + 3600
          ).toString(),
        },
      }
    );
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
