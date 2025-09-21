'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface SavedCalculation {
  id: string;
  accountSize: number;
  riskPercentage: number;
  stopLossPips: number;
  baseCurrency: string;
  quoteCurrency: string;
  lotSize: number;
  positionValue: number;
  riskAmount: number;
  pipValue: number;
  createdAt: string;
}

interface CalculationHistoryProps {
  className?: string;
  pageSize?: number;
  showTitle?: boolean;
  onCalculationSelect?: (calculation: SavedCalculation) => void;
}

export default function CalculationHistory({
  className = '',
  pageSize = 10,
  showTitle = true,
  onCalculationSelect,
}: CalculationHistoryProps) {
  const { data: session } = useSession();
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCalculations = async (pageNum: number = 1) => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/calculations?page=${pageNum}&limit=${pageSize}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch calculations');
      }

      const data = await response.json();
      setCalculations(data.calculations);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteCalculation = async (id: string) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/calculations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete calculation');
      }

      // Refresh the current page
      await fetchCalculations(page);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete calculation'
      );
    }
  };

  useEffect(() => {
    if (session) {
      fetchCalculations(1);
    }
  }, [session]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!session) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <h3 className='mb-4 text-lg font-medium text-gray-900'>
          Sign In Required
        </h3>
        <p className='text-gray-600'>
          Please sign in to view your calculation history.
        </p>
      </div>
    );
  }

  if (loading && calculations.length === 0) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h2 className='mb-6 text-xl font-semibold text-gray-900'>
            Calculation History
          </h2>
        )}
        <div className='space-y-4'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='animate-pulse rounded-lg bg-gray-100 p-4'>
              <div className='mb-3 flex items-start justify-between'>
                <div className='space-y-2'>
                  <div className='h-4 w-24 rounded bg-gray-200'></div>
                  <div className='h-3 w-32 rounded bg-gray-200'></div>
                </div>
                <div className='h-4 w-16 rounded bg-gray-200'></div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='h-3 rounded bg-gray-200'></div>
                <div className='h-3 rounded bg-gray-200'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Calculation History
          </h2>
          <span className='text-sm text-gray-500'>
            {totalCount} calculation{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {error && (
        <div className='mb-6 rounded-lg border border-red-200 bg-red-50 p-4'>
          <div className='flex'>
            <svg
              className='mr-2 h-5 w-5 text-red-400'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
            <div>
              <h3 className='text-sm font-medium text-red-800'>Error</h3>
              <p className='mt-1 text-sm text-red-700'>{error}</p>
            </div>
          </div>
        </div>
      )}

      {calculations.length === 0 && !loading ? (
        <div className='rounded-lg bg-gray-50 p-8 text-center'>
          <svg
            className='mx-auto mb-4 h-12 w-12 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
            />
          </svg>
          <h3 className='mb-2 text-lg font-medium text-gray-900'>
            No calculations yet
          </h3>
          <p className='text-gray-600'>
            Start calculating lot sizes to build your history.
          </p>
        </div>
      ) : (
        <>
          <div className='space-y-4'>
            {calculations.map(calc => (
              <div
                key={calc.id}
                className='rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md'
              >
                <div className='mb-3 flex items-start justify-between'>
                  <div>
                    <h3 className='font-semibold text-gray-900'>
                      {calc.baseCurrency}/{calc.quoteCurrency}
                    </h3>
                    <p className='text-sm text-gray-500'>
                      {formatDate(calc.createdAt)}
                    </p>
                  </div>
                  <span className='text-forex-primary text-lg font-bold'>
                    {calc.lotSize.toFixed(2)} lots
                  </span>
                </div>

                <div className='mb-4 grid grid-cols-2 gap-4 md:grid-cols-4'>
                  <div>
                    <p className='text-xs text-gray-500'>Account Size</p>
                    <p className='font-medium'>
                      {formatCurrency(calc.accountSize)}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500'>Risk</p>
                    <p className='font-medium'>{calc.riskPercentage}%</p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500'>Stop Loss</p>
                    <p className='font-medium'>{calc.stopLossPips} pips</p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500'>Risk Amount</p>
                    <p className='font-medium text-red-600'>
                      {formatCurrency(calc.riskAmount)}
                    </p>
                  </div>
                </div>

                <div className='flex items-center justify-between border-t border-gray-100 pt-3'>
                  <div className='flex space-x-4 text-sm text-gray-600'>
                    <span>Position: {formatCurrency(calc.positionValue)}</span>
                    <span>Pip Value: {formatCurrency(calc.pipValue)}</span>
                  </div>
                  <div className='flex space-x-2'>
                    {onCalculationSelect && (
                      <button
                        onClick={() => onCalculationSelect(calc)}
                        className='text-forex-primary text-sm font-medium hover:text-blue-700'
                      >
                        Use Again
                      </button>
                    )}
                    <button
                      onClick={() => deleteCalculation(calc.id)}
                      className='text-sm font-medium text-red-600 hover:text-red-800'
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='mt-6 flex items-center justify-between'>
              <div className='text-sm text-gray-700'>
                Showing page {page} of {totalPages}
              </div>
              <div className='flex space-x-2'>
                <button
                  onClick={() => fetchCalculations(page - 1)}
                  disabled={page === 1 || loading}
                  className='rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  Previous
                </button>

                {/* Page numbers */}
                <div className='flex space-x-1'>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = Math.max(1, page - 2) + i;
                    if (pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchCalculations(pageNum)}
                        disabled={loading}
                        className={`rounded border px-3 py-1 text-sm ${
                          pageNum === page
                            ? 'border-forex-primary bg-forex-primary text-white'
                            : 'border-gray-300 hover:bg-gray-50'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => fetchCalculations(page + 1)}
                  disabled={page === totalPages || loading}
                  className='rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
