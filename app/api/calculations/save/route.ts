import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { z } from 'zod';

// Schema for save calculation request
const saveCalculationSchema = z.object({
  calculationId: z.string().cuid('Invalid calculation ID'),
  name: z.string().max(100, 'Name too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// POST /api/calculations/save - Save anonymous calculation to user account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = saveCalculationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues.map(issue => issue.message),
        },
        { status: 400 }
      );
    }

    // TODO: Get user ID from authentication
    // For now, we'll return authentication required error
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );

    // When authentication is implemented, this is what the code should do:
    /*
    // Find the calculation
    const calculation = await prisma.calculation.findUnique({
      where: { id: calculationId }
    })

    if (!calculation) {
      return NextResponse.json(
        { success: false, error: 'Calculation not found' },
        { status: 404 }
      )
    }

    // Check if calculation is already saved
    if (calculation.userId) {
      if (calculation.userId === userId) {
        return NextResponse.json(
          { success: false, error: 'Calculation already saved to your account' },
          { status: 409 }
        )
      } else {
        return NextResponse.json(
          { success: false, error: 'Cannot save calculation belonging to another user' },
          { status: 403 }
        )
      }
    }

    // Update calculation with user association
    const updatedCalculation = await prisma.calculation.update({
      where: { id: calculationId },
      data: {
        userId,
        name,
        notes,
        updatedAt: new Date()
      },
      include: {
        currencyPair: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCalculation.id,
        name: updatedCalculation.name,
        notes: updatedCalculation.notes,
        accountBalance: updatedCalculation.accountBalance,
        riskPercentage: updatedCalculation.riskPercentage,
        entryPrice: updatedCalculation.entryPrice,
        stopLossPrice: updatedCalculation.stopLossPrice,
        accountCurrency: updatedCalculation.accountCurrency,
        riskAmount: updatedCalculation.riskAmount,
        pipValue: updatedCalculation.pipValue,
        lotSize: updatedCalculation.lotSize,
        pipDistance: updatedCalculation.pipDistance,
        currencyPair: {
          id: updatedCalculation.currencyPair.id,
          symbol: updatedCalculation.currencyPair.symbol,
          baseCurrency: updatedCalculation.currencyPair.baseCurrency,
          quoteCurrency: updatedCalculation.currencyPair.quoteCurrency
        },
        savedAt: updatedCalculation.updatedAt,
        createdAt: updatedCalculation.createdAt
      }
    }, { status: 201 })
    */
  } catch (error) {
    console.error('Error saving calculation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
