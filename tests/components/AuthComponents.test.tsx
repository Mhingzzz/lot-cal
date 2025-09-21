import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  AuthButton,
  UserProfile,
  AuthWrapper,
} from '@/app/components/AuthComponents';

// Mock NextAuth
jest.mock('next-auth/react');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

// Helper function to create mock session
const createMockSession = (
  status: 'loading' | 'authenticated' | 'unauthenticated',
  user?: any
) => {
  if (status === 'loading') {
    return {
      data: null,
      status: 'loading' as const,
      update: jest.fn(),
    };
  }

  if (status === 'unauthenticated') {
    return {
      data: null,
      status: 'unauthenticated' as const,
      update: jest.fn(),
    };
  }

  return {
    data: {
      user: user || { id: '1', name: 'John Doe', email: 'john@example.com' },
      expires: '2024-12-31',
    },
    status: 'authenticated' as const,
    update: jest.fn(),
  };
};

describe('AuthButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when session status is loading', () => {
    mockUseSession.mockReturnValue(createMockSession('loading'));

    render(<AuthButton />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows sign in button when not authenticated', () => {
    mockUseSession.mockReturnValue(createMockSession('unauthenticated'));

    render(<AuthButton />);
    expect(screen.getByText('Sign In with Google')).toBeInTheDocument();
  });

  it('shows sign out button when authenticated', () => {
    mockUseSession.mockReturnValue(createMockSession('authenticated'));

    render(<AuthButton />);
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('calls signIn when sign in button is clicked', async () => {
    mockUseSession.mockReturnValue(createMockSession('unauthenticated'));
    mockSignIn.mockResolvedValue(undefined);

    render(<AuthButton />);

    const signInButton = screen.getByText('Sign In with Google');
    await userEvent.click(signInButton);

    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/' });
  });

  it('calls signOut when sign out button is clicked', async () => {
    mockUseSession.mockReturnValue(createMockSession('authenticated'));
    mockSignOut.mockResolvedValue(undefined);

    render(<AuthButton />);

    const signOutButton = screen.getByText('Sign Out');
    await userEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
  });

  it('hides text when showText is false', () => {
    mockUseSession.mockReturnValue(createMockSession('unauthenticated'));

    render(<AuthButton showText={false} />);
    expect(screen.queryByText('Sign In with Google')).not.toBeInTheDocument();
  });

  it('applies different size classes', () => {
    mockUseSession.mockReturnValue(createMockSession('unauthenticated'));

    const { rerender } = render(<AuthButton size='sm' />);
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(<AuthButton size='lg' />);
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('applies different variant classes', () => {
    mockUseSession.mockReturnValue(createMockSession('unauthenticated'));

    const { rerender } = render(<AuthButton variant='secondary' />);
    expect(screen.getByRole('button')).toHaveClass('bg-forex-secondary');

    rerender(<AuthButton variant='outline' />);
    expect(screen.getByRole('button')).toHaveClass('border', 'border-gray-300');
  });
});

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading skeleton when session status is loading', () => {
    mockUseSession.mockReturnValue(createMockSession('loading'));

    render(<UserProfile />);
    const skeletonContainer = document.querySelector('.animate-pulse');
    expect(skeletonContainer).toHaveClass('animate-pulse');
    expect(skeletonContainer).toHaveClass('flex');
    expect(skeletonContainer).toHaveClass('items-center');
  });

  it('renders nothing when not authenticated', () => {
    mockUseSession.mockReturnValue(createMockSession('unauthenticated'));

    render(<UserProfile />);
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('displays user information when authenticated', () => {
    const user = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      image: 'https://example.com/avatar.jpg',
    };
    mockUseSession.mockReturnValue(createMockSession('authenticated', user));

    render(<UserProfile />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByAltText('John Doe')).toBeInTheDocument();
  });

  it('hides email when showEmail is false', () => {
    mockUseSession.mockReturnValue(createMockSession('authenticated'));

    render(<UserProfile showEmail={false} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();
  });

  it('hides avatar when showAvatar is false', () => {
    const user = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      image: 'https://example.com/avatar.jpg',
    };
    mockUseSession.mockReturnValue(createMockSession('authenticated', user));

    render(<UserProfile showAvatar={false} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByAltText('John Doe')).not.toBeInTheDocument();
  });

  it('shows default avatar when no image provided', () => {
    mockUseSession.mockReturnValue(createMockSession('authenticated'));

    render(<UserProfile />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('AuthWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when session status is loading', () => {
    mockUseSession.mockReturnValue(createMockSession('loading'));

    render(
      <AuthWrapper>
        <div>Protected content</div>
      </AuthWrapper>
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('shows children when authenticated and requireAuth is true', () => {
    mockUseSession.mockReturnValue(createMockSession('authenticated'));

    render(
      <AuthWrapper>
        <div>Protected content</div>
      </AuthWrapper>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('shows default fallback when not authenticated and requireAuth is true', () => {
    mockUseSession.mockReturnValue(createMockSession('unauthenticated'));

    render(
      <AuthWrapper>
        <div>Protected content</div>
      </AuthWrapper>
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(
      screen.getByText('Please sign in to access this feature.')
    ).toBeInTheDocument();
  });

  it('shows custom fallback when not authenticated and requireAuth is true', () => {
    mockUseSession.mockReturnValue(createMockSession('unauthenticated'));

    render(
      <AuthWrapper fallback={<div>Custom fallback</div>}>
        <div>Protected content</div>
      </AuthWrapper>
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('shows children when requireAuth is false regardless of auth status', () => {
    mockUseSession.mockReturnValue(createMockSession('unauthenticated'));

    render(
      <AuthWrapper requireAuth={false}>
        <div>Public content</div>
      </AuthWrapper>
    );

    expect(screen.getByText('Public content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    mockUseSession.mockReturnValue(createMockSession('authenticated'));

    render(
      <AuthWrapper className='custom-wrapper'>
        <div>Protected content</div>
      </AuthWrapper>
    );

    expect(screen.getByText('Protected content').parentElement).toHaveClass(
      'custom-wrapper'
    );
  });
});
