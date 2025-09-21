import { describe, it, expect, jest } from '@jest/globals'

describe('Basic Test Setup Validation', () => {
  it('should verify Jest is working correctly', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toBe('hello')
    expect(true).toBe(true)
  })

  it('should verify async/await works', async () => {
    const result = await Promise.resolve('test')
    expect(result).toBe('test')
  })

  it('should verify mocking works', () => {
    const mockFn = jest.fn()
    mockFn.mockReturnValue('mocked')
    
    expect(mockFn()).toBe('mocked')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})