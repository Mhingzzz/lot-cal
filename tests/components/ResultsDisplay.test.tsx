import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsDisplay from '@/app/components/ResultsDisplay';
import { CalculationResult } from '@/app/components/CalculatorForm';

describe('ResultsDisplay', () => {
  const mockResult: CalculationResult = {
    lotSize: 0.4,
    positionValue: 40000,
    riskAmount: 200,
    pipValue: 4.0,
  };

  const defaultProps = {
    result: mockResult,
    baseCurrency: 'EUR',
    quoteCurrency: 'USD',
  };

  it('renders nothing when result is null', () => {
    render(<ResultsDisplay {...defaultProps} result={null} />);
    expect(screen.queryByText('Calculation Results')).not.toBeInTheDocument();
  });

  it('displays calculation results correctly', () => {
    render(<ResultsDisplay {...defaultProps} />);

    expect(screen.getByText('Calculation Results')).toBeInTheDocument();
    expect(screen.getByText('0.40')).toBeInTheDocument(); // Lot size
    expect(screen.getByText('$40,000.00')).toBeInTheDocument(); // Position value
    expect(screen.getByText('$200.00')).toBeInTheDocument(); // Risk amount
    expect(screen.getByText('$4.00')).toBeInTheDocument(); // Pip value
  });

  it('displays currency pair information', () => {
    render(<ResultsDisplay {...defaultProps} />);

    expect(screen.getByText('For EUR/USD pair')).toBeInTheDocument();
  });

  it('calculates and displays risk percentage', () => {
    render(<ResultsDisplay {...defaultProps} />);

    // Risk percentage = (200 / 40000) * 100 = 0.5%
    expect(screen.getByText('0.5%')).toBeInTheDocument();
  });

  it('displays risk analysis with warnings', () => {
    render(<ResultsDisplay {...defaultProps} />);

    expect(screen.getByText('Risk Analysis')).toBeInTheDocument();
    expect(
      screen.getByText(/This trade risks \$200.00 of your account/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Each pip movement = \$4.00 gain\/loss/)
    ).toBeInTheDocument();
  });

  it('shows correct risk level for low risk', () => {
    render(<ResultsDisplay {...defaultProps} />);

    expect(screen.getByText(/Risk level: LOW/)).toBeInTheDocument();
  });

  it('shows correct risk level for moderate risk', () => {
    const moderateRiskResult: CalculationResult = {
      lotSize: 1.0,
      positionValue: 10000,
      riskAmount: 300, // 3% risk
      pipValue: 10.0,
    };

    render(<ResultsDisplay {...defaultProps} result={moderateRiskResult} />);

    expect(screen.getByText(/Risk level: MODERATE/)).toBeInTheDocument();
  });

  it('shows correct risk level for high risk', () => {
    const highRiskResult: CalculationResult = {
      lotSize: 2.0,
      positionValue: 10000,
      riskAmount: 600, // 6% risk
      pipValue: 20.0,
    };

    render(<ResultsDisplay {...defaultProps} result={highRiskResult} />);

    expect(screen.getByText(/Risk level: HIGH/)).toBeInTheDocument();
  });

  it('shows save button when showSaveButton is true', () => {
    const onSave = jest.fn();
    render(
      <ResultsDisplay {...defaultProps} showSaveButton={true} onSave={onSave} />
    );

    expect(
      screen.getByRole('button', { name: /save calculation/i })
    ).toBeInTheDocument();
  });

  it('hides save button when showSaveButton is false', () => {
    render(<ResultsDisplay {...defaultProps} showSaveButton={false} />);

    expect(
      screen.queryByRole('button', { name: /save calculation/i })
    ).not.toBeInTheDocument();
  });

  it('shows clear button by default', () => {
    const onClear = jest.fn();
    render(<ResultsDisplay {...defaultProps} onClear={onClear} />);

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('hides clear button when showClearButton is false', () => {
    const onClear = jest.fn();
    render(
      <ResultsDisplay
        {...defaultProps}
        onClear={onClear}
        showClearButton={false}
      />
    );

    expect(
      screen.queryByRole('button', { name: /clear/i })
    ).not.toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', async () => {
    const onSave = jest.fn();
    render(
      <ResultsDisplay {...defaultProps} showSaveButton={true} onSave={onSave} />
    );

    const saveButton = screen.getByRole('button', {
      name: /save calculation/i,
    });
    await userEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onClear when clear button is clicked', async () => {
    const onClear = jest.fn();
    render(<ResultsDisplay {...defaultProps} onClear={onClear} />);

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await userEvent.click(clearButton);

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when saving', () => {
    const onSave = jest.fn();
    render(
      <ResultsDisplay
        {...defaultProps}
        showSaveButton={true}
        onSave={onSave}
        isSaving={true}
      />
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('formats currencies correctly for different currency pairs', () => {
    render(
      <ResultsDisplay
        {...defaultProps}
        baseCurrency='GBP'
        quoteCurrency='JPY'
      />
    );

    expect(screen.getByText('For GBP/JPY pair')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ResultsDisplay {...defaultProps} className='custom-class' />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles very small lot sizes', () => {
    const smallLotResult: CalculationResult = {
      lotSize: 0.01,
      positionValue: 1000,
      riskAmount: 20,
      pipValue: 0.1,
    };

    render(<ResultsDisplay {...defaultProps} result={smallLotResult} />);

    expect(screen.getByText('0.01')).toBeInTheDocument();
    expect(screen.getByText('$0.10')).toBeInTheDocument();
  });

  it('handles large lot sizes', () => {
    const largeLotResult: CalculationResult = {
      lotSize: 10.5,
      positionValue: 1050000,
      riskAmount: 5000,
      pipValue: 105.0,
    };

    render(<ResultsDisplay {...defaultProps} result={largeLotResult} />);

    expect(screen.getByText('10.50')).toBeInTheDocument();
    expect(screen.getByText('$1,050,000.00')).toBeInTheDocument();
    expect(screen.getByText('$105.00')).toBeInTheDocument();
  });
});
