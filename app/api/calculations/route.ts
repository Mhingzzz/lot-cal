import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'
import { lotSizeCalculationSchema } from '@/app/lib/validations'
import { performLotSizeCalculation, validateBusinessRules } from '@/app/lib/calculations'

// GET /api/calculations - Get user's calculation history
export async function GET(request: NextRequest) {
  try {
    // For now, we'll return empty array since auth is not implemented yet
    // TODO: Add authentication and fetch user's calculations
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const currencyPair = searchParams.get('currencyPair')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Mock response for now - replace with actual database query when auth is implemented
    const mockCalculations: any[] = []

    return NextResponse.json({
      success: true,
      data: {
        calculations: mockCalculations,
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      }
    })
  } catch (error) {
    console.error('Error fetching calculations:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/calculations - Perform lot size calculation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input using Zod schema
    const validationResult = lotSizeCalculationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.error.issues.map(issue => issue.message)
        },
        { status: 400 }
      )
    }

    const input = validationResult.data

    // Validate business rules
    const businessRuleErrors = validateBusinessRules({
      accountBalance: input.accountBalance,
      riskPercentage: input.riskPercentage,
      entryPrice: input.entryPrice,
      stopLossPrice: input.stopLossPrice,
      accountCurrency: input.accountCurrency,
      baseCurrency: '', // Will be filled from currency pair
      quoteCurrency: '' // Will be filled from currency pair
    })

    if (businessRuleErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Business rule validation failed',
          details: businessRuleErrors
        },
        { status: 400 }
      )
    }

    // Fetch currency pair from database
    const currencyPair = await prisma.currencyPair.findUnique({
      where: { id: input.currencyPairId },
      include: {
        exchangeRates: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    })

    if (!currencyPair) {
      return NextResponse.json(
        { success: false, error: 'Currency pair not found' },
        { status: 404 }
      )
    }

    if (!currencyPair.isActive) {
      return NextResponse.json(
        { success: false, error: 'Currency pair is not active' },
        { status: 400 }
      )
    }

    // Get the latest exchange rate
    const exchangeRate = currencyPair.exchangeRates[0]?.rate.toNumber()

    // Perform the calculation
    const calculationInput = {
      accountBalance: input.accountBalance,
      riskPercentage: input.riskPercentage,
      entryPrice: input.entryPrice,
      stopLossPrice: input.stopLossPrice,
      accountCurrency: input.accountCurrency,
      baseCurrency: currencyPair.baseCurrency,
      quoteCurrency: currencyPair.quoteCurrency
    }

    const result = performLotSizeCalculation(calculationInput, exchangeRate)

    // Save the calculation to database (anonymous for now)
    const savedCalculation = await prisma.calculation.create({
      data: {
        accountBalance: input.accountBalance,
        riskPercentage: input.riskPercentage,
        entryPrice: input.entryPrice,
        stopLossPrice: input.stopLossPrice,
        accountCurrency: input.accountCurrency,
        currencyPairId: input.currencyPairId,
        riskAmount: result.riskAmount,
        pipValue: result.pipValue,
        lotSize: result.lotSize,
        pipDistance: result.pipDistance,
        // userId: null (anonymous calculation)
      }
    })

    // Return the calculation result
    return NextResponse.json({
      success: true,
      data: {
        riskAmount: result.riskAmount,
        pipValue: result.pipValue,
        lotSize: result.lotSize,
        pipDistance: result.pipDistance,
        calculationId: savedCalculation.id
      }
    })

  } catch (error) {
    console.error('Error performing calculation:', error)
    
    // Handle specific calculation errors
    if (error instanceof Error && error.message.includes('Calculation failed')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}