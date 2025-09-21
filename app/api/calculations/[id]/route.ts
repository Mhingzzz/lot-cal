import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';

// DELETE /api/calculations/[id] - Delete a saved calculation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate calculation ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid calculation ID' },
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
      where: { id }
    })

    if (!calculation) {
      return NextResponse.json(
        { success: false, error: 'Calculation not found' },
        { status: 404 }
      )
    }

    // Check if calculation belongs to the user
    if (!calculation.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete anonymous calculation' },
        { status: 403 }
      )
    }

    if (calculation.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this calculation' },
        { status: 403 }
      )
    }

    // Delete the calculation
    await prisma.calculation.delete({
      where: { id }
    })

    // Log the deletion for audit purposes
    console.log(`Calculation ${id} deleted by user ${userId} at ${new Date().toISOString()}`)

    return NextResponse.json({
      success: true,
      data: {
        id,
        deletedAt: new Date().toISOString()
      }
    })
    */
  } catch (error) {
    console.error('Error deleting calculation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
