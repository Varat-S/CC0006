/**
 * test-setup.ts — jsdom polyfills for the test environment only.
 *
 * jsdom does not implement ResizeObserver, which Recharts' ResponsiveContainer uses.
 * This polyfill is for tests only and has no effect on the real browser bundle.
 */

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!('ResizeObserver' in globalThis)) {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
}
