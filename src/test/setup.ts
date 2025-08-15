import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_BASE_URL: 'http://localhost:8000',
  },
  writable: true,
})

// Mock fetch globally
global.fetch = vi.fn()

// Mock image compression utility
vi.mock('../utils/mobileImageOptimization', () => ({
  compressImage: vi.fn().mockResolvedValue({
    compressedFile: new File(['compressed'], 'compressed.jpg', { type: 'image/jpeg' }),
    originalSize: 1024,
    compressedSize: 512,
    compressionRatio: 0.5
  })
}))

// Mock mobile detection hook
vi.mock('../hooks/useMobile', () => ({
  default: vi.fn().mockReturnValue({
    isMobile: false,
    hasCamera: false,
    supportsTouch: false
  })
}))

// Setup cleanup after each test
afterEach(() => {
  vi.clearAllMocks()
})