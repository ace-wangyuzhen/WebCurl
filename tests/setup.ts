import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver =
  ResizeObserverMock as unknown as typeof ResizeObserver;

if (typeof window.matchMedia !== "function") {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// jsdom does not implement pseudo-element style queries used by Ant Design.
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = ((element: Element, pseudoElement?: string | null) => {
  if (pseudoElement) {
    return originalGetComputedStyle(element);
  }
  return originalGetComputedStyle(element, pseudoElement);
}) as typeof window.getComputedStyle;

// jsdom does not implement Range.getClientRects, which CodeMirror's
// measurement layer uses. Provide a no-op returning an empty list.
if (typeof Range !== "undefined" && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = function () {
    return [] as unknown as DOMRectList;
  };
}
