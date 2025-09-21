'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useState } from 'react';

interface AuthButtonProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

export function AuthButton({
  className = '',
  showText = true,
  size = 'md',
  variant = 'primary',
}: AuthButtonProps) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary:
      'bg-forex-primary text-white hover:bg-blue-700 focus:ring-forex-primary',
    secondary:
      'bg-forex-secondary text-white hover:bg-green-700 focus:ring-forex-secondary',
    outline:
      'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500',
  };

  const baseClasses = `
    inline-flex items-center justify-center
    rounded-md font-medium
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-200
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `
    .trim()
    .replace(/\s+/g, ' ');

  if (status === 'loading') {
    return (
      <div className={baseClasses}>
        <svg
          className='mr-2 -ml-1 h-4 w-4 animate-spin'
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
        >
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          ></circle>
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          ></path>
        </svg>
        {showText && 'Loading...'}
      </div>
    );
  }

  if (session) {
    return (
      <button
        onClick={handleSignOut}
        disabled={isLoading}
        className={baseClasses}
      >
        {isLoading ? (
          <>
            <svg
              className='mr-2 -ml-1 h-4 w-4 animate-spin'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              ></circle>
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
            {showText && 'Signing out...'}
          </>
        ) : (
          <>
            <svg
              className='mr-2 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
              />
            </svg>
            {showText && 'Sign Out'}
          </>
        )}
      </button>
    );
  }

  return (
    <button onClick={handleSignIn} disabled={isLoading} className={baseClasses}>
      {isLoading ? (
        <>
          <svg
            className='mr-2 -ml-1 h-4 w-4 animate-spin'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            ></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
          {showText && 'Signing in...'}
        </>
      ) : (
        <>
          <svg className='mr-2 h-4 w-4' viewBox='0 0 24 24'>
            <path
              fill='currentColor'
              d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
            />
            <path
              fill='currentColor'
              d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
            />
            <path
              fill='currentColor'
              d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
            />
            <path
              fill='currentColor'
              d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
            />
          </svg>
          {showText && 'Sign In with Google'}
        </>
      )}
    </button>
  );
}

interface UserProfileProps {
  className?: string;
  showEmail?: boolean;
  showAvatar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function UserProfile({
  className = '',
  showEmail = true,
  showAvatar = true,
  size = 'md',
}: UserProfileProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className={`flex animate-pulse items-center space-x-3 ${className}`}>
        <div className='h-8 w-8 rounded-full bg-gray-200'></div>
        <div className='space-y-2'>
          <div className='h-4 w-24 rounded bg-gray-200'></div>
          <div className='h-3 w-32 rounded bg-gray-200'></div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const avatarSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showAvatar && (
        <div
          className={`${avatarSizes[size]} flex items-center justify-center overflow-hidden rounded-full bg-gray-200`}
        >
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'User avatar'}
              className='h-full w-full object-cover'
            />
          ) : (
            <svg
              className='h-5 w-5 text-gray-400'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
                clipRule='evenodd'
              />
            </svg>
          )}
        </div>
      )}
      <div className='flex flex-col'>
        {session.user.name && (
          <span className={`font-medium text-gray-900 ${textSizes[size]}`}>
            {session.user.name}
          </span>
        )}
        {showEmail && session.user.email && (
          <span
            className={`text-gray-500 ${size === 'lg' ? 'text-sm' : 'text-xs'}`}
          >
            {session.user.email}
          </span>
        )}
      </div>
    </div>
  );
}

interface AuthWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  className?: string;
}

export function AuthWrapper({
  children,
  fallback,
  requireAuth = true,
  className = '',
}: AuthWrapperProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className='border-forex-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
      </div>
    );
  }

  if (requireAuth && !session) {
    return (
      <div className={className}>
        {fallback || (
          <div className='p-8 text-center'>
            <h3 className='mb-4 text-lg font-medium text-gray-900'>
              Authentication Required
            </h3>
            <p className='mb-6 text-gray-600'>
              Please sign in to access this feature.
            </p>
            <AuthButton />
          </div>
        )}
      </div>
    );
  }

  if (!requireAuth || session) {
    return <div className={className}>{children}</div>;
  }

  return null;
}
