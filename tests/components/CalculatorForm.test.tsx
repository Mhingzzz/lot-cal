import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalculatorForm, {
  CalculatorFormData,
  CalculationResult,
} from '@/app/components/CalculatorForm';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('CalculatorForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultFormData: CalculatorFormData = {
    accountSize: 10000,
    riskPercentage: 2,
    stopLossPips: 50,
    baseCurrency: 'EUR',
    quoteCurrency: 'USD',
  };

  const mockCalculationResult: CalculationResult = {
    lotSize: 0.4,
    positionValue: 40000,
    riskAmount: 200,
    pipValue: 4.0,
  };

  it('renders the calculator form with default values', () => {
    render(<CalculatorForm />);

    expect(screen.getByDisplayValue('10000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    expect(screen.getByDisplayValue('EUR')).toBeInTheDocument();
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<CalculatorForm />);

    const accountSizeInput = screen.getByLabelText(/account size/i);
    const calculateButton = screen.getByRole('button', {
      name: /calculate lot size/i,
    });

    // Clear account size and try to calculate
    await userEvent.clear(accountSizeInput);
    await userEvent.type(accountSizeInput, '0');
    await userEvent.click(calculateButton);

    expect(
      screen.getByText('Account size must be greater than 0')
    ).toBeInTheDocument();
  });

  it('validates risk percentage range', async () => {
    render(<CalculatorForm />);

    const riskInput = screen.getByLabelText(/risk percentage/i);
    const calculateButton = screen.getByRole('button', {
      name: /calculate lot size/i,
    });

    // Test with 0%
    await userEvent.clear(riskInput);
    await userEvent.type(riskInput, '0');
    await userEvent.click(calculateButton);

    expect(
      screen.getByText('Risk percentage must be between 0 and 100')
    ).toBeInTheDocument();

    // Test with > 100%
    await userEvent.clear(riskInput);
    await userEvent.type(riskInput, '150');
    await userEvent.click(calculateButton);

    expect(
      screen.getByText('Risk percentage must be between 0 and 100')
    ).toBeInTheDocument();
  });

  it('validates that base and quote currencies are different', async () => {
    render(<CalculatorForm />);

    const quoteCurrencySelect = screen.getByLabelText(/quote currency/i);
    const calculateButton = screen.getByRole('button', {
      name: /calculate lot size/i,
    });

    // Set quote currency to same as base currency (EUR)
    await userEvent.selectOptions(quoteCurrencySelect, 'EUR');
    await userEvent.click(calculateButton);

    // Check that validation error appears (there may be multiple instances)
    const errorMessages = screen.getAllByText(
      'Base and quote currencies must be different'
    );
    expect(errorMessages.length).toBeGreaterThan(0);
    expect(errorMessages[0]).toBeInTheDocument();
  });

  it('successfully calculates lot size', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCalculationResult,
    } as Response);

    const onCalculate = jest.fn();
    render(<CalculatorForm onCalculate={onCalculate} />);

    const calculateButton = screen.getByRole('button', {
      name: /calculate lot size/i,
    });
    await userEvent.click(calculateButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultFormData),
      });
    });

    // Check if results are displayed
    expect(screen.getByText('Calculation Results')).toBeInTheDocument();
    expect(screen.getByText('0.40')).toBeInTheDocument(); // Lot size
    expect(screen.getByText('$40,000')).toBeInTheDocument(); // Position value
    expect(screen.getByText('$200.00')).toBeInTheDocument(); // Risk amount
    expect(screen.getByText('$4.00')).toBeInTheDocument(); // Pip value

    expect(onCalculate).toHaveBeenCalledWith(mockCalculationResult);
  });

  it('handles calculation API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid currency pair' }),
    } as Response);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    render(<CalculatorForm />);

    const calculateButton = screen.getByRole('button', {
      name: /calculate lot size/i,
    });
    await userEvent.click(calculateButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Calculation error:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('shows loading state during calculation', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CalculatorForm />);

    const calculateButton = screen.getByRole('button', {
      name: /calculate lot size/i,
    });
    await userEvent.click(calculateButton);

    expect(screen.getByText('Calculating...')).toBeInTheDocument();
    expect(calculateButton).toBeDisabled();
  });

  it('calls onSave when save button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCalculationResult,
    } as Response);

    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<CalculatorForm onSave={onSave} />);

    // First calculate
    const calculateButton = screen.getByRole('button', {
      name: /calculate lot size/i,
    });
    await userEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('Calculation Results')).toBeInTheDocument();
    });

    // Then save
    const saveButton = screen.getByRole('button', {
      name: /save calculation/i,
    });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        ...defaultFormData,
        ...mockCalculationResult,
      });
    });
  });

  it('clears field errors when user starts typing', async () => {
    render(<CalculatorForm />);

    const accountSizeInput = screen.getByLabelText(/account size/i);
    const calculateButton = screen.getByRole('button', {
      name: /calculate lot size/i,
    });

    // Trigger validation error
    await userEvent.clear(accountSizeInput);
    await userEvent.type(accountSizeInput, '0');
    await userEvent.click(calculateButton);

    expect(
      screen.getByText('Account size must be greater than 0')
    ).toBeInTheDocument();

    // Start typing to clear error
    await userEvent.type(accountSizeInput, '1');

    await waitFor(() => {
      expect(
        screen.queryByText('Account size must be greater than 0')
      ).not.toBeInTheDocument();
    });
  });

  it('updates form data when inputs change', async () => {
    render(<CalculatorForm />);

    const accountSizeInput = screen.getByLabelText(/account size/i);
    const riskInput = screen.getByLabelText(/risk percentage/i);
    const stopLossInput = screen.getByLabelText(/stop loss/i);

    await userEvent.clear(accountSizeInput);
    await userEvent.type(accountSizeInput, '20000');
    expect(accountSizeInput).toHaveValue(20000);

    await userEvent.clear(riskInput);
    await userEvent.type(riskInput, '1.5');
    expect(riskInput).toHaveValue(1.5);

    await userEvent.clear(stopLossInput);
    await userEvent.type(stopLossInput, '30');
    expect(stopLossInput).toHaveValue(30);
  });

  it('updates currency selections', async () => {
    render(<CalculatorForm />);

    const baseCurrencySelect = screen.getByLabelText(/base currency/i);
    const quoteCurrencySelect = screen.getByLabelText(/quote currency/i);

    await userEvent.selectOptions(baseCurrencySelect, 'GBP');
    expect(baseCurrencySelect).toHaveValue('GBP');

    await userEvent.selectOptions(quoteCurrencySelect, 'JPY');
    expect(quoteCurrencySelect).toHaveValue('JPY');
  });

  it('disables buttons when loading prop is true', () => {
    render(<CalculatorForm loading={true} />);

    const calculateButton = screen.getByRole('button', {
      name: /calculate lot size/i,
    });
    expect(calculateButton).toBeDisabled();
  });
});
