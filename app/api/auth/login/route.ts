import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import { z } from 'zod';

// Login schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/login - Login user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = loginSchema.safeParse(body);
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

    const { email, password } = validationResult.data;

    // For this simplified implementation, we'll just check if user exists
    // In a real app, you'd verify the password hash
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // TODO: Verify password hash
    // const isValidPassword = await bcrypt.compare(password, user.hashedPassword)
    // if (!isValidPassword) {
    //   return NextResponse.json(
    //     { success: false, error: 'Invalid credentials' },
    //     { status: 401 }
    //   )
    // }

    // Generate simple session token (in production, use proper JWT)
    const sessionToken = `session_${user.id}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        session: {
          token: sessionToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
