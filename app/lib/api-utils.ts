import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Standard API error response interface
export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
  path?: string;
}

// Standard API success response interface
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  timestamp: string;
  path?: string;
}

// Error types enum
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

// Error status code mapping
const ERROR_STATUS_MAP: Record<ErrorType, number> = {
  [ErrorType.VALIDATION_ERROR]: 400,
  [ErrorType.AUTHENTICATION_ERROR]: 401,
  [ErrorType.AUTHORIZATION_ERROR]: 403,
  [ErrorType.NOT_FOUND_ERROR]: 404,
  [ErrorType.CONFLICT_ERROR]: 409,
  [ErrorType.RATE_LIMIT_ERROR]: 429,
  [ErrorType.EXTERNAL_API_ERROR]: 502,
  [ErrorType.DATABASE_ERROR]: 503,
  [ErrorType.INTERNAL_SERVER_ERROR]: 500,
};

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string,
  type: ErrorType = ErrorType.INTERNAL_SERVER_ERROR,
  details?: any,
  path?: string
): NextResponse<ApiError> {
  const status = ERROR_STATUS_MAP[type];

  const errorResponse: ApiError = {
    success: false,
    error,
    code: type,
    details,
    timestamp: new Date().toISOString(),
    ...(path && { path }),
  };

  return NextResponse.json(errorResponse, { status });
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  path?: string
): NextResponse<ApiSuccess<T>> {
  const successResponse: ApiSuccess<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(path && { path }),
  };

  return NextResponse.json(successResponse, { status });
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(
  error: ZodError,
  path?: string
): NextResponse<ApiError> {
  const details = error.issues.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return createErrorResponse(
    'Validation failed',
    ErrorType.VALIDATION_ERROR,
    { validationErrors: details },
    path
  );
}

/**
 * Handle Prisma database errors
 */
export function handlePrismaError(
  error: any,
  path?: string
): NextResponse<ApiError> {
  // Handle known Prisma error codes
  if (error.code === 'P2002') {
    return createErrorResponse(
      'Resource already exists',
      ErrorType.CONFLICT_ERROR,
      { constraint: error.meta?.target },
      path
    );
  }

  if (error.code === 'P2025') {
    return createErrorResponse(
      'Resource not found',
      ErrorType.NOT_FOUND_ERROR,
      { model: error.meta?.cause },
      path
    );
  }

  if (error.code === 'P2003') {
    return createErrorResponse(
      'Foreign key constraint failed',
      ErrorType.VALIDATION_ERROR,
      { constraint: error.meta?.field_name },
      path
    );
  }

  // Generic database error
  return createErrorResponse(
    'Database operation failed',
    ErrorType.DATABASE_ERROR,
    { code: error.code, message: error.message },
    path
  );
}

/**
 * Handle authentication errors
 */
export function handleAuthError(
  message: string = 'Authentication required',
  path?: string
): NextResponse<ApiError> {
  return createErrorResponse(
    message,
    ErrorType.AUTHENTICATION_ERROR,
    undefined,
    path
  );
}

/**
 * Handle authorization errors
 */
export function handleAuthorizationError(
  message: string = 'Insufficient permissions',
  path?: string
): NextResponse<ApiError> {
  return createErrorResponse(
    message,
    ErrorType.AUTHORIZATION_ERROR,
    undefined,
    path
  );
}

/**
 * Handle rate limiting errors
 */
export function handleRateLimitError(
  message: string = 'Too many requests',
  retryAfter?: number,
  path?: string
): NextResponse<ApiError> {
  const response = createErrorResponse(
    message,
    ErrorType.RATE_LIMIT_ERROR,
    { retryAfter },
    path
  );

  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }

  return response;
}

/**
 * Handle external API errors
 */
export function handleExternalApiError(
  service: string,
  error: any,
  path?: string
): NextResponse<ApiError> {
  return createErrorResponse(
    `External service error: ${service}`,
    ErrorType.EXTERNAL_API_ERROR,
    {
      service,
      originalError: error instanceof Error ? error.message : String(error),
    },
    path
  );
}

/**
 * Global error handler for API routes
 */
export function handleApiError(
  error: unknown,
  path?: string
): NextResponse<ApiError> {
  console.error('API Error:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return handleZodError(error, path);
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    return handlePrismaError(error, path);
  }

  // Handle standard errors
  if (error instanceof Error) {
    // Check for specific error types based on message
    if (
      error.message.includes('Authentication') ||
      error.message.includes('Unauthorized')
    ) {
      return handleAuthError(error.message, path);
    }

    if (
      error.message.includes('Permission') ||
      error.message.includes('Forbidden')
    ) {
      return handleAuthorizationError(error.message, path);
    }

    if (error.message.includes('Not found')) {
      return createErrorResponse(
        error.message,
        ErrorType.NOT_FOUND_ERROR,
        undefined,
        path
      );
    }

    if (
      error.message.includes('already exists') ||
      error.message.includes('Conflict')
    ) {
      return createErrorResponse(
        error.message,
        ErrorType.CONFLICT_ERROR,
        undefined,
        path
      );
    }

    if (
      error.message.includes('rate limit') ||
      error.message.includes('Too many')
    ) {
      return handleRateLimitError(error.message, undefined, path);
    }

    // Generic error with message
    return createErrorResponse(
      error.message,
      ErrorType.INTERNAL_SERVER_ERROR,
      undefined,
      path
    );
  }

  // Unknown error type
  return createErrorResponse(
    'An unexpected error occurred',
    ErrorType.INTERNAL_SERVER_ERROR,
    { originalError: String(error) },
    path
  );
}

/**
 * Wrap API route handler with error handling
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>
) {
  return async (...args: T): Promise<NextResponse<R | ApiError>> => {
    try {
      return await handler(...args);
    } catch (error) {
      const request = args.find(
        arg => arg && typeof arg === 'object' && 'url' in arg
      );
      const path = request?.url ? new URL(request.url).pathname : undefined;
      return handleApiError(error, path);
    }
  };
}

/**
 * Log API errors for monitoring
 */
export function logApiError(
  error: unknown,
  context: string,
  userId?: string
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    context,
    userId,
    error: {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError',
    },
  };

  console.error('API Error Log:', JSON.stringify(logData, null, 2));

  // In production, you would send this to a logging service
  // Example: await sendToLoggingService(logData);
}

/**
 * Validate request content type
 */
export function validateContentType(
  request: Request,
  expectedType: string = 'application/json'
): boolean {
  const contentType = request.headers.get('content-type');
  return contentType?.includes(expectedType) ?? false;
}

/**
 * Extract request path from Next.js request
 */
export function getRequestPath(request: Request): string {
  try {
    return new URL(request.url).pathname;
  } catch {
    return 'unknown';
  }
}

/**
 * API response headers for security and CORS
 */
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Access-Control-Allow-Origin':
    process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
} as const;

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(API_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
