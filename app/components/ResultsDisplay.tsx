'use client';

import { CalculationResult } from './CalculatorForm';

interface ResultsDisplayProps {
  result: CalculationResult | null;
  baseCurrency: string;
  quoteCurrency: string;
  onSave?: () => void;
  onClear?: () => void;
  isSaving?: boolean;
  showSaveButton?: boolean;
  showClearButton?: boolean;
  className?: string;
}

export default function ResultsDisplay({
  result,
  baseCurrency,
  quoteCurrency,
  onSave,
  onClear,
  isSaving = false,
  showSaveButton = false,
  showClearButton = true,
  className = '',
}: ResultsDisplayProps) {
  if (!result) {
    return null;
  }

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const riskPercentage =
    (result.riskAmount / (result.positionValue || 1)) * 100;

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm ${className}`}
    >
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='flex items-center text-lg font-semibold text-gray-900'>
          <span className='mr-2 h-2 w-2 rounded-full bg-green-500'></span>
          Calculation Results
        </h3>
        {showClearButton && onClear && (
          <button
            onClick={onClear}
            className='text-sm text-gray-500 hover:text-gray-700 focus:outline-none'
          >
            Clear
          </button>
        )}
      </div>

      <div className='space-y-4'>
        {/* Primary Result - Lot Size */}
        <div className='bg-forex-primary/5 border-forex-primary/20 rounded-lg border p-4'>
          <div className='flex items-center justify-between'>
            <span className='text-forex-primary text-sm font-medium'>
              Recommended Lot Size
            </span>
            <span className='text-forex-primary text-2xl font-bold'>
              {formatNumber(result.lotSize, 2)}
            </span>
          </div>
          <p className='mt-1 text-xs text-gray-600'>
            For {baseCurrency}/{quoteCurrency} pair
          </p>
        </div>

        {/* Financial Details */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div className='rounded-lg border border-gray-200 bg-white p-4'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  Position Value
                </p>
                <p className='text-xs text-gray-500'>Total position size</p>
              </div>
              <span className='text-lg font-semibold text-gray-900'>
                {formatCurrency(result.positionValue)}
              </span>
            </div>
          </div>

          <div className='rounded-lg border border-gray-200 bg-white p-4'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-900'>Risk Amount</p>
                <p className='text-xs text-gray-500'>Maximum loss</p>
              </div>
              <span className='text-lg font-semibold text-red-600'>
                {formatCurrency(result.riskAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Trading Details */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div className='rounded-lg border border-gray-200 bg-white p-4'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-900'>Pip Value</p>
                <p className='text-xs text-gray-500'>Per pip movement</p>
              </div>
              <span className='text-lg font-semibold text-gray-900'>
                {formatCurrency(result.pipValue)}
              </span>
            </div>
          </div>

          <div className='rounded-lg border border-gray-200 bg-white p-4'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-900'>Risk %</p>
                <p className='text-xs text-gray-500'>Of position value</p>
              </div>
              <span className='text-lg font-semibold text-yellow-600'>
                {formatNumber(riskPercentage, 1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
          <h4 className='mb-2 flex items-center text-sm font-medium text-yellow-800'>
            <svg
              className='mr-1 h-4 w-4'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
            Risk Analysis
          </h4>
          <div className='space-y-1 text-sm text-yellow-700'>
            <p>
              • This trade risks {formatCurrency(result.riskAmount)} of your
              account
            </p>
            <p>
              • Each pip movement = {formatCurrency(result.pipValue)} gain/loss
            </p>
            <p className={riskPercentage > 5 ? 'font-medium text-red-600' : ''}>
              • Risk level:{' '}
              {riskPercentage > 5
                ? 'HIGH'
                : riskPercentage > 2
                  ? 'MODERATE'
                  : 'LOW'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {(showSaveButton || showClearButton) && (
          <div className='flex gap-3 pt-2'>
            {showSaveButton && onSave && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className='bg-forex-secondary focus:ring-forex-secondary flex-1 rounded-md px-4 py-2 text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isSaving ? (
                  <span className='flex items-center justify-center'>
                    <svg
                      className='mr-3 -ml-1 h-4 w-4 animate-spin text-white'
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
                    Saving...
                  </span>
                ) : (
                  'Save Calculation'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
