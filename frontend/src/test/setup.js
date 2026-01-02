import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Provide a simple localStorage mock for the JSDOM/Vitest environment
if (typeof global.localStorage === 'undefined' || typeof global.localStorage.getItem !== 'function') {
  (function () {
    let store = {};
    const mock = {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
      },
      setItem(key, value) {
        store[key] = String(value);
      },
      removeItem(key) {
        delete store[key];
      },
      clear() {
        store = {};
      },
    };
    global.localStorage = mock;
  })();
}

// Mock IntersectionObserver for scroll animation tests
if (typeof global.IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }

    observe(target) {
      // Simulate the element being in view immediately
      this.callback([
        {
          isIntersecting: true,
          target,
          intersectionRatio: 1,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
          time: Date.now(),
        },
      ]);
    }

    unobserve() {
      // No-op
    }

    disconnect() {
      // No-op
    }
  };
}
