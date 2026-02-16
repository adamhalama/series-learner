import "@testing-library/jest-dom/vitest";

if (!window.PointerEvent) {
  // Radix UI relies on PointerEvent in interactive components.
  // JSDOM does not provide it by default.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).PointerEvent = MouseEvent;
}

if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false;
}

if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => undefined;
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = () => undefined;
}

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => undefined;
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {
      return undefined;
    }
    unobserve() {
      return undefined;
    }
    disconnect() {
      return undefined;
    }
  };
}
