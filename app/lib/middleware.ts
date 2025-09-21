import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import {
  handleRateLimitError,
  handleAuthError,
  getRequestPath,
} from '@/app/lib/api-utils';

// Rate limiting storage (in production, use Redis or similar)
interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations
export const RATE_LIMITS = {
  // Anonymous users (by IP)
  anonymous: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // requests per window
  },
  // Authenticated users (by user ID)
  authenticated: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 500, // requests per window
  },
  // Specific endpoints with tighter limits
  calculation: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30, // calculations per minute
  },
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // registrations per hour per IP
  },
  exchangeRates: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60, // rate requests per minute
  },
} as const;

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to unknown if no IP available
  return 'unknown';
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(
  identifier: string,
  limit: { windowMs: number; maxRequests: number }
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  cleanupExpiredEntries();

  const now = Date.now();

  let entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime <= now) {
    // Create new entry or reset expired one
    entry = {
      count: 1,
      resetTime: now + limit.windowMs,
      lastRequest: now,
    };
    rateLimitStore.set(identifier, entry);

    return {
      allowed: true,
      remaining: limit.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Update existing entry
  entry.count += 1;
  entry.lastRequest = now;

  const allowed = entry.count <= limit.maxRequests;
  const remaining = Math.max(0, limit.maxRequests - entry.count);
  const retryAfter = allowed
    ? undefined
    : Math.ceil((entry.resetTime - now) / 1000);

  const result = {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };

  if (retryAfter !== undefined) {
    return { ...result, retryAfter };
  }

  return result;
}

/**
 * Rate limiting middleware
 */
export async function withRateLimit(
  request: NextRequest,
  limitConfig?: { windowMs: number; maxRequests: number }
): Promise<NextResponse | null> {
  try {
    // Get user session for authenticated rate limiting
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user?.id;

    // Determine identifier and limits
    let identifier: string;
    let limits = limitConfig;

    if (isAuthenticated) {
      identifier = `user:${session.user.id}`;
      limits = limits || RATE_LIMITS.authenticated;
    } else {
      identifier = `ip:${getClientIP(request)}`;
      limits = limits || RATE_LIMITS.anonymous;
    }

    // Apply rate limiting
    const result = applyRateLimit(identifier, limits);

    if (!result.allowed) {
      return handleRateLimitError(
        'Rate limit exceeded',
        result.retryAfter,
        getRequestPath(request)
      );
    }

    // Add rate limit headers to track usage
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', limits.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set(
      'X-RateLimit-Reset',
      Math.ceil(result.resetTime / 1000).toString()
    );

    return null; // Continue processing
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Continue processing if rate limiting fails
    return null;
  }
}

/**
 * Authentication middleware
 */
export async function withAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return handleAuthError(
        'Authentication required',
        getRequestPath(request)
      );
    }

    // Add user info to headers for downstream handlers
    const response = NextResponse.next();
    response.headers.set('X-User-ID', session.user.id);
    response.headers.set('X-User-Email', session.user.email);

    return null; // Continue processing
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return handleAuthError('Authentication failed', getRequestPath(request));
  }
}

/**
 * Request validation middleware
 */
export async function withRequestValidation(
  request: NextRequest,
  options: {
    maxBodySize?: number;
    allowedMethods?: string[];
    requireContentType?: string;
  } = {}
): Promise<NextResponse | null> {
  const {
    maxBodySize = 1024 * 1024, // 1MB default
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    requireContentType,
  } = options;

  // Check HTTP method
  if (!allowedMethods.includes(request.method)) {
    return NextResponse.json(
      {
        success: false,
        error: `Method ${request.method} not allowed`,
        code: 'METHOD_NOT_ALLOWED',
        timestamp: new Date().toISOString(),
      },
      { status: 405 }
    );
  }

  // Check content type for POST/PUT requests
  if (requireContentType && ['POST', 'PUT'].includes(request.method)) {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes(requireContentType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Content-Type must be ${requireContentType}`,
          code: 'INVALID_CONTENT_TYPE',
          timestamp: new Date().toISOString(),
        },
        { status: 415 }
      );
    }
  }

  // Check content length
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxBodySize) {
    return NextResponse.json(
      {
        success: false,
        error: 'Request body too large',
        code: 'PAYLOAD_TOO_LARGE',
        timestamp: new Date().toISOString(),
      },
      { status: 413 }
    );
  }

  return null; // Continue processing
}

/**
 * CORS middleware
 */
export function withCORS(request: NextRequest): NextResponse | null {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin':
          process.env.NODE_ENV === 'production'
            ? process.env.ALLOWED_ORIGINS || 'https://yourdomain.com'
            : '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return null; // Continue processing
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders(): NextResponse {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

/**
 * Combined middleware wrapper for API routes
 */
export function withMiddleware(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    rateLimit?: { windowMs: number; maxRequests: number };
    validation?: {
      maxBodySize?: number;
      allowedMethods?: string[];
      requireContentType?: string;
    };
    enableCORS?: boolean;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Apply CORS if enabled
      if (options.enableCORS) {
        const corsResponse = withCORS(request);
        if (corsResponse) return corsResponse;
      }

      // Apply request validation
      if (options.validation) {
        const validationResponse = await withRequestValidation(
          request,
          options.validation
        );
        if (validationResponse) return validationResponse;
      }

      // Apply rate limiting
      if (options.rateLimit) {
        const rateLimitResponse = await withRateLimit(
          request,
          options.rateLimit
        );
        if (rateLimitResponse) return rateLimitResponse;
      }

      // Apply authentication if required
      if (options.requireAuth) {
        const authResponse = await withAuth(request);
        if (authResponse) return authResponse;
      }

      // Execute the actual handler
      const response = await handler(request);

      // Apply security headers
      const secureResponse = withSecurityHeaders();

      // Copy response data to secure response
      const finalResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          ...Object.fromEntries(secureResponse.headers.entries()),
        },
      });

      return finalResponse;
    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Get rate limiting statistics (for monitoring)
 */
export function getRateLimitStats(): {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  topIdentifiers: Array<{
    identifier: string;
    count: number;
    resetTime: number;
  }>;
} {
  cleanupExpiredEntries();

  const now = Date.now();
  let activeEntries = 0;
  let expiredEntries = 0;

  const entries = Array.from(rateLimitStore.entries());

  entries.forEach(([, entry]) => {
    if (entry.resetTime > now) {
      activeEntries++;
    } else {
      expiredEntries++;
    }
  });

  const topIdentifiers = entries
    .filter(([, entry]) => entry.resetTime > now)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([identifier, entry]) => ({
      identifier,
      count: entry.count,
      resetTime: entry.resetTime,
    }));

  return {
    totalEntries: rateLimitStore.size,
    activeEntries,
    expiredEntries,
    topIdentifiers,
  };
}
