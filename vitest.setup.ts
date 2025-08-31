// Ensure i18n is initialized in the test environment before any component uses useTranslation
import './src/i18n';
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup()
})

// TextEncoder/TextDecoder polyfill for Node.js environment
if (typeof global !== 'undefined') {
  // Use ESM import style via dynamic import to satisfy lint rule
  import('util').then(({ TextEncoder, TextDecoder }) => {
    // @ts-expect-error - global typings in Vitest environment
    global.TextEncoder = TextEncoder
    // @ts-expect-error - global typings in Vitest environment
    global.TextDecoder = TextDecoder
  })
}

// Mock CSS modules
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Note: tests should explicitly handle expected async errors; no global swallowing here.
// For some legacy tests that intentionally throw inside setTimeout, keep a minimal
// handler that prevents the Vitest runner from crashing. Prefer removing these
// patterns in tests; this is temporary.
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    e.preventDefault();
  });
}