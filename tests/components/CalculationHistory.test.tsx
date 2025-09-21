import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import CalculationHistory from '@/app/components/CalculationHistory';

// Mock NextAuth
jest.mock('next-auth/react');

// Mock fetch
global.fetch = jest.fn();

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const mockCalculation = {
  id: '1',
  accountSize: 10000,
  riskPercentage: 2,
  stopLossPips: 50,
  baseCurrency: 'EUR',
  quoteCurrency: 'USD',
  lotSize: 0.4,
  positionValue: 40000,
  riskAmount: 200,
  pipValue: 4.0,
  createdAt: '2024-01-15T10:30:00Z',
};

describe('CalculationHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows sign in message when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    render(<CalculationHistory />);

    expect(screen.getByText('Sign In Required')).toBeInTheDocument();
    expect(
      screen.getByText('Please sign in to view your calculation history.')
    ).toBeInTheDocument();
  });

  it('shows loading skeleton when fetching data', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    // Mock delayed response
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<CalculationHistory />);

    expect(screen.getByText('Calculation History')).toBeInTheDocument();
    expect(screen.queryByText('No calculations yet')).not.toBeInTheDocument();
  });

  it('shows empty state when no calculations exist', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        calculations: [],
        totalPages: 0,
        totalCount: 0,
      }),
    } as Response);

    render(<CalculationHistory />);

    await screen.findByText('No calculations yet');
    expect(
      screen.getByText('Start calculating lot sizes to build your history.')
    ).toBeInTheDocument();
  });

  it('displays calculations when data is available', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        calculations: [mockCalculation],
        totalPages: 1,
        totalCount: 1,
      }),
    } as Response);

    render(<CalculationHistory />);

    await screen.findByText('EUR/USD');
    expect(screen.getByText('0.40 lots')).toBeInTheDocument();
    expect(screen.getByText('$10,000.00')).toBeInTheDocument(); // Account size
    expect(screen.getByText('2%')).toBeInTheDocument(); // Risk percentage
    expect(screen.getByText('50 pips')).toBeInTheDocument(); // Stop loss
    expect(screen.getByText('$200.00')).toBeInTheDocument(); // Risk amount
  });

  it('shows error message when API fails', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    } as Response);

    render(<CalculationHistory />);

    await screen.findByText('Error');
    expect(screen.getByText('Server error')).toBeInTheDocument();
  });

  it('calls onCalculationSelect when "Use Again" is clicked', async () => {
    const onCalculationSelect = jest.fn();

    mockUseSession.mockReturnValue({
      data: {
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        calculations: [mockCalculation],
        totalPages: 1,
        totalCount: 1,
      }),
    } as Response);

    render(<CalculationHistory onCalculationSelect={onCalculationSelect} />);

    const useAgainButton = await screen.findByText('Use Again');
    await userEvent.click(useAgainButton);

    expect(onCalculationSelect).toHaveBeenCalledWith(mockCalculation);
  });

  it('deletes calculation when delete button is clicked', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        calculations: [mockCalculation],
        totalPages: 1,
        totalCount: 1,
      }),
    } as Response);

    // Mock delete request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    // Mock refresh after delete
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        calculations: [],
        totalPages: 0,
        totalCount: 0,
      }),
    } as Response);

    render(<CalculationHistory />);

    const deleteButton = await screen.findByText('Delete');
    await userEvent.click(deleteButton);

    expect(mockFetch).toHaveBeenCalledWith('/api/calculations/1', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('hides title when showTitle is false', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<CalculationHistory showTitle={false} />);

    expect(screen.queryByText('Calculation History')).not.toBeInTheDocument();
  });

  it('formats dates correctly', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        calculations: [mockCalculation],
        totalPages: 1,
        totalCount: 1,
      }),
    } as Response);

    render(<CalculationHistory />);

    // Check that date is formatted (exact format may vary by locale)
    await screen.findByText(/Jan 15, 2024/);
  });
});
