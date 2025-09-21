'use client';

import { useState } from 'react';

export interface CalculatorFormData {
  accountSize: number;
  riskPercentage: number;
  stopLossPips: number;
  baseCurrency: string;
  quoteCurrency: string;
}

export interface CalculationResult {
  lotSize: number;
  positionValue: number;
  riskAmount: number;
  pipValue: number;
}

interface CalculatorFormProps {
  onCalculate?: (result: CalculationResult) => void;
  onSave?: (
    calculation: CalculatorFormData & CalculationResult
  ) => Promise<void>;
  loading?: boolean;
}

const COMMON_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CHF',
  'CAD',
  'AUD',
  'NZD',
];

export default function CalculatorForm({
  onCalculate,
  onSave,
  loading = false,
}: CalculatorFormProps) {
  const [formData, setFormData] = useState<CalculatorFormData>({
    accountSize: 10000,
    riskPercentage: 2,
    stopLossPips: 50,
    baseCurrency: 'EUR',
    quoteCurrency: 'USD',
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CalculatorFormData, string>>
  >({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CalculatorFormData, string>> = {};

    if (formData.accountSize <= 0) {
      newErrors.accountSize = 'Account size must be greater than 0';
    }

    if (formData.riskPercentage <= 0 || formData.riskPercentage > 100) {
      newErrors.riskPercentage = 'Risk percentage must be between 0 and 100';
    }

    if (formData.stopLossPips <= 0) {
      newErrors.stopLossPips = 'Stop loss must be greater than 0 pips';
    }

    if (!formData.baseCurrency || formData.baseCurrency.length !== 3) {
      newErrors.baseCurrency = 'Please select a valid base currency';
    }

    if (!formData.quoteCurrency || formData.quoteCurrency.length !== 3) {
      newErrors.quoteCurrency = 'Please select a valid quote currency';
    }

    if (formData.baseCurrency === formData.quoteCurrency) {
      newErrors.baseCurrency = 'Base and quote currencies must be different';
      newErrors.quoteCurrency = 'Base and quote currencies must be different';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: keyof CalculatorFormData,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleCalculate = async () => {
    if (!validateForm()) return;

    setIsCalculating(true);
    setResult(null);

    try {
      // Call our API endpoint
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Calculation failed');
      }

      const calculationResult: CalculationResult = await response.json();
      setResult(calculationResult);
      onCalculate?.(calculationResult);
    } catch (error) {
      console.error('Calculation error:', error);
      // Handle error (could add error state)
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!result || !onSave) return;

    setIsSaving(true);
    try {
      await onSave({ ...formData, ...result });
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses =
    'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-forex-primary focus:border-forex-primary';
  const errorClasses = 'border-red-500 focus:ring-red-500 focus:border-red-500';
  const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className='mx-auto max-w-md rounded-lg bg-white p-6 shadow-md'>
      <h2 className='mb-6 text-center text-2xl font-bold text-gray-900'>
        Forex Lot Size Calculator
      </h2>

      <div className='space-y-4'>
        {/* Account Size */}
        <div>
          <label htmlFor='accountSize' className={labelClasses}>
            Account Size ($)
          </label>
          <input
            id='accountSize'
            type='number'
            min='0'
            step='100'
            value={formData.accountSize}
            onChange={e =>
              handleInputChange('accountSize', parseFloat(e.target.value) || 0)
            }
            className={`${inputClasses} ${errors.accountSize ? errorClasses : ''}`}
            placeholder='10000'
          />
          {errors.accountSize && (
            <p className='mt-1 text-sm text-red-600'>{errors.accountSize}</p>
          )}
        </div>

        {/* Risk Percentage */}
        <div>
          <label htmlFor='riskPercentage' className={labelClasses}>
            Risk Percentage (%)
          </label>
          <input
            id='riskPercentage'
            type='number'
            min='0'
            max='100'
            step='0.1'
            value={formData.riskPercentage}
            onChange={e =>
              handleInputChange(
                'riskPercentage',
                parseFloat(e.target.value) || 0
              )
            }
            className={`${inputClasses} ${errors.riskPercentage ? errorClasses : ''}`}
            placeholder='2'
          />
          {errors.riskPercentage && (
            <p className='mt-1 text-sm text-red-600'>{errors.riskPercentage}</p>
          )}
        </div>

        {/* Stop Loss Pips */}
        <div>
          <label htmlFor='stopLossPips' className={labelClasses}>
            Stop Loss (pips)
          </label>
          <input
            id='stopLossPips'
            type='number'
            min='0'
            step='1'
            value={formData.stopLossPips}
            onChange={e =>
              handleInputChange('stopLossPips', parseFloat(e.target.value) || 0)
            }
            className={`${inputClasses} ${errors.stopLossPips ? errorClasses : ''}`}
            placeholder='50'
          />
          {errors.stopLossPips && (
            <p className='mt-1 text-sm text-red-600'>{errors.stopLossPips}</p>
          )}
        </div>

        {/* Currency Pair */}
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label htmlFor='baseCurrency' className={labelClasses}>
              Base Currency
            </label>
            <select
              id='baseCurrency'
              value={formData.baseCurrency}
              onChange={e => handleInputChange('baseCurrency', e.target.value)}
              className={`${inputClasses} ${errors.baseCurrency ? errorClasses : ''}`}
            >
              {COMMON_CURRENCIES.map(currency => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            {errors.baseCurrency && (
              <p className='mt-1 text-sm text-red-600'>{errors.baseCurrency}</p>
            )}
          </div>

          <div>
            <label htmlFor='quoteCurrency' className={labelClasses}>
              Quote Currency
            </label>
            <select
              id='quoteCurrency'
              value={formData.quoteCurrency}
              onChange={e => handleInputChange('quoteCurrency', e.target.value)}
              className={`${inputClasses} ${errors.quoteCurrency ? errorClasses : ''}`}
            >
              {COMMON_CURRENCIES.map(currency => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            {errors.quoteCurrency && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.quoteCurrency}
              </p>
            )}
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={isCalculating || loading}
          className='bg-forex-primary focus:ring-forex-primary w-full rounded-md px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isCalculating ? 'Calculating...' : 'Calculate Lot Size'}
        </button>

        {/* Results Display */}
        {result && (
          <div className='mt-6 rounded-lg bg-gray-50 p-4'>
            <h3 className='mb-3 font-semibold text-gray-900'>
              Calculation Results
            </h3>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Lot Size:</span>
                <span className='font-medium'>{result.lotSize.toFixed(2)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Position Value:</span>
                <span className='font-medium'>
                  ${result.positionValue.toLocaleString()}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Risk Amount:</span>
                <span className='font-medium text-red-600'>
                  ${result.riskAmount.toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Pip Value:</span>
                <span className='font-medium'>
                  ${result.pipValue.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Save Button */}
            {onSave && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className='bg-forex-secondary focus:ring-forex-secondary mt-4 w-full rounded-md px-4 py-2 text-white hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isSaving ? 'Saving...' : 'Save Calculation'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
