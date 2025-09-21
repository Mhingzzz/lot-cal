import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create major currency pairs
  const currencyPairs = [
    // Major pairs
    {
      baseCurrency: 'EUR',
      quoteCurrency: 'USD',
      symbol: 'EURUSD',
      pipSize: 0.0001,
    },
    {
      baseCurrency: 'GBP',
      quoteCurrency: 'USD',
      symbol: 'GBPUSD',
      pipSize: 0.0001,
    },
    {
      baseCurrency: 'USD',
      quoteCurrency: 'JPY',
      symbol: 'USDJPY',
      pipSize: 0.01,
    },
    {
      baseCurrency: 'USD',
      quoteCurrency: 'CHF',
      symbol: 'USDCHF',
      pipSize: 0.0001,
    },
    {
      baseCurrency: 'AUD',
      quoteCurrency: 'USD',
      symbol: 'AUDUSD',
      pipSize: 0.0001,
    },
    {
      baseCurrency: 'USD',
      quoteCurrency: 'CAD',
      symbol: 'USDCAD',
      pipSize: 0.0001,
    },
    {
      baseCurrency: 'NZD',
      quoteCurrency: 'USD',
      symbol: 'NZDUSD',
      pipSize: 0.0001,
    },

    // Cross pairs
    {
      baseCurrency: 'EUR',
      quoteCurrency: 'GBP',
      symbol: 'EURGBP',
      pipSize: 0.0001,
    },
    {
      baseCurrency: 'EUR',
      quoteCurrency: 'JPY',
      symbol: 'EURJPY',
      pipSize: 0.01,
    },
    {
      baseCurrency: 'GBP',
      quoteCurrency: 'JPY',
      symbol: 'GBPJPY',
      pipSize: 0.01,
    },
    {
      baseCurrency: 'AUD',
      quoteCurrency: 'JPY',
      symbol: 'AUDJPY',
      pipSize: 0.01,
    },
    {
      baseCurrency: 'CHF',
      quoteCurrency: 'JPY',
      symbol: 'CHFJPY',
      pipSize: 0.01,
    },

    // Additional popular pairs
    {
      baseCurrency: 'EUR',
      quoteCurrency: 'CHF',
      symbol: 'EURCHF',
      pipSize: 0.0001,
    },
    {
      baseCurrency: 'GBP',
      quoteCurrency: 'CHF',
      symbol: 'GBPCHF',
      pipSize: 0.0001,
    },
    {
      baseCurrency: 'AUD',
      quoteCurrency: 'CAD',
      symbol: 'AUDCAD',
      pipSize: 0.0001,
    },
  ];

  for (const pair of currencyPairs) {
    const created = await prisma.currencyPair.upsert({
      where: { symbol: pair.symbol },
      update: {},
      create: {
        baseCurrency: pair.baseCurrency,
        quoteCurrency: pair.quoteCurrency,
        symbol: pair.symbol,
        pipSize: pair.pipSize,
        isActive: true,
      },
    });
    console.log(`📈 Created currency pair: ${created.symbol}`);
  }

  // Create sample exchange rates (you can update these with real data)
  const sampleRates = [
    { symbol: 'EURUSD', rate: 1.0876 },
    { symbol: 'GBPUSD', rate: 1.2641 },
    { symbol: 'USDJPY', rate: 149.85 },
    { symbol: 'USDCHF', rate: 0.8756 },
    { symbol: 'AUDUSD', rate: 0.6542 },
    { symbol: 'USDCAD', rate: 1.3654 },
    { symbol: 'NZDUSD', rate: 0.5987 },
    { symbol: 'EURGBP', rate: 0.8602 },
    { symbol: 'EURJPY', rate: 163.12 },
    { symbol: 'GBPJPY', rate: 189.54 },
  ];

  for (const rateData of sampleRates) {
    const currencyPair = await prisma.currencyPair.findUnique({
      where: { symbol: rateData.symbol },
    });

    if (currencyPair) {
      await prisma.exchangeRate.create({
        data: {
          rate: rateData.rate,
          currencyPairId: currencyPair.id,
          source: 'seed',
          timestamp: new Date(),
        },
      });
      console.log(
        `💱 Created exchange rate: ${rateData.symbol} = ${rateData.rate}`
      );
    }
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
