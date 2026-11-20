import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AUTO_PRESET_DEFAULTS,
  BREAKPOINTS_BOOTSTRAP,
  BREAKPOINTS_DEFAULT,
  BREAKPOINTS_TAILWIND,
  RESPONSIVE_PRESETS,
  buildBreakpointFlags,
  detectFramework,
  getBreakpointName,
  resolveBreakpoints,
  resolveResponsiveValue,
  useBreakpoint,
} from '../src/lib/useBreakpoint.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// ---------------------------------------------------------------------------
// Pure helpers — breakpoint resolution
// ---------------------------------------------------------------------------

describe('getBreakpointName', () => {
  it('resolves Tailwind breakpoints at exact boundaries', () => {
    expect(getBreakpointName(0, BREAKPOINTS_TAILWIND)).toBe('xs');
    expect(getBreakpointName(639, BREAKPOINTS_TAILWIND)).toBe('xs');
    expect(getBreakpointName(640, BREAKPOINTS_TAILWIND)).toBe('sm');
    expect(getBreakpointName(767, BREAKPOINTS_TAILWIND)).toBe('sm');
    expect(getBreakpointName(768, BREAKPOINTS_TAILWIND)).toBe('md');
    expect(getBreakpointName(1023, BREAKPOINTS_TAILWIND)).toBe('md');
    expect(getBreakpointName(1024, BREAKPOINTS_TAILWIND)).toBe('lg');
    expect(getBreakpointName(1280, BREAKPOINTS_TAILWIND)).toBe('xl');
    expect(getBreakpointName(1536, BREAKPOINTS_TAILWIND)).toBe('2xl');
    expect(getBreakpointName(9999, BREAKPOINTS_TAILWIND)).toBe('2xl');
  });

  it('resolves Bootstrap breakpoints', () => {
    expect(getBreakpointName(575, BREAKPOINTS_BOOTSTRAP)).toBe('xs');
    expect(getBreakpointName(576, BREAKPOINTS_BOOTSTRAP)).toBe('sm');
    expect(getBreakpointName(1000, BREAKPOINTS_BOOTSTRAP)).toBe('lg');
    expect(getBreakpointName(1400, BREAKPOINTS_BOOTSTRAP)).toBe('xxl');
  });

  it('handles unsorted custom maps', () => {
    const bps = { wide: 900, compact: 0, regular: 500 };
    expect(getBreakpointName(600, bps)).toBe('regular');
    expect(getBreakpointName(1000, bps)).toBe('wide');
    expect(getBreakpointName(10, bps)).toBe('compact');
  });

  it('falls back to the smallest breakpoint when width is below every entry', () => {
    expect(getBreakpointName(50, { a: 100, b: 200 })).toBe('a');
  });
});

describe('buildBreakpointFlags', () => {
  it('marks the exact range [min, nextMin) for each breakpoint', () => {
    expect(buildBreakpointFlags(700, BREAKPOINTS_TAILWIND)).toEqual({
      isXs: false, isSm: true, isMd: false, isLg: false, isXl: false, is2xl: false,
    });
  });

  it('flips at boundaries: 640 is sm (not xs), 1536 is 2xl', () => {
    const at640 = buildBreakpointFlags(640, BREAKPOINTS_TAILWIND);
    expect(at640.isXs).toBe(false);
    expect(at640.isSm).toBe(true);
    expect(buildBreakpointFlags(1536, BREAKPOINTS_TAILWIND).is2xl).toBe(true);
  });

  it('derives flag names from custom map keys (dashes stripped)', () => {
    const flags = buildBreakpointFlags(150, { mobile: 0, 'ultra-wide': 100 });
    expect(flags.isMobile).toBe(false);
    expect(flags.isUltrawide).toBe(true);
  });
});

describe('resolveResponsiveValue', () => {
  it('walks presets from the largest breakpoint down', () => {
    const gap = RESPONSIVE_PRESETS.gap;
    expect(resolveResponsiveValue(gap, 500, BREAKPOINTS_TAILWIND)).toBe('gap-2');
    expect(resolveResponsiveValue(gap, 640, BREAKPOINTS_TAILWIND)).toBe('gap-4');
    expect(resolveResponsiveValue(gap, 1024, BREAKPOINTS_TAILWIND)).toBe('gap-6');
    expect(resolveResponsiveValue(gap, 2000, BREAKPOINTS_TAILWIND)).toBe('gap-8');
  });

  it('falls back to the smallest breakpoint present in the map', () => {
    const map = { md: 'col-md-4' };
    expect(resolveResponsiveValue(map, 100, BREAKPOINTS_TAILWIND)).toBe('col-md-4');
    expect(resolveResponsiveValue(map, 5000, BREAKPOINTS_TAILWIND)).toBe('col-md-4');
  });

  it('resolves against custom breakpoint names', () => {
    const bps = { compact: 0, wide: 800 };
    const map = { compact: 'a', wide: 'b' };
    expect(resolveResponsiveValue(map, 100, bps)).toBe('a');
    expect(resolveResponsiveValue(map, 900, bps)).toBe('b');
  });

  it('returns undefined when no breakpoint names intersect', () => {
    expect(resolveResponsiveValue({ foo: 1 }, 640, BREAKPOINTS_TAILWIND)).toBeUndefined();
  });
});

describe('resolveBreakpoints', () => {
  it('resolves preset names to their maps', () => {
    expect(resolveBreakpoints('tailwind')).toBe(BREAKPOINTS_TAILWIND);
    expect(resolveBreakpoints('bootstrap')).toBe(BREAKPOINTS_BOOTSTRAP);
  });

  it('passes custom maps through and defaults to Tailwind', () => {
    const custom = { s: 0, l: 800 };
    expect(resolveBreakpoints(custom)).toBe(custom);
    expect(resolveBreakpoints(undefined)).toBe(BREAKPOINTS_DEFAULT);
    expect(BREAKPOINTS_DEFAULT).toBe(BREAKPOINTS_TAILWIND);
  });
});

describe('detectFramework', () => {
  it('sniffs Tailwind class names', () => {
    expect(detectFramework({ className: 'p-4 text-sm rounded' })).toBe('tailwind');
    expect(detectFramework({ className: 'md:flex lg:grid' })).toBe('tailwind');
  });

  it('sniffs Bootstrap class names', () => {
    expect(detectFramework({ className: 'row col-6' })).toBe('bootstrap');
  });

  it('returns null for unknown, empty, or missing elements', () => {
    expect(detectFramework({ className: '' })).toBeNull();
    expect(detectFramework(null)).toBeNull();
    expect(detectFramework({ className: {} })).toBeNull(); // SVG-style className object
  });
});

describe('RESPONSIVE_PRESETS registry', () => {
  it('covers every autoPreset default key', () => {
    for (const key of AUTO_PRESET_DEFAULTS) {
      expect(RESPONSIVE_PRESETS[key]).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Hook behaviour — jsdom with stubbed measurement + ResizeObserver
// ---------------------------------------------------------------------------

class MockResizeObserver {
  constructor(callback) { this.callback = callback; }
  observe() {}
  disconnect() {}
}

// A ResizeObserver test double whose `fire` pushes entries through the real
// debounced handler path, so tests exercise processResize exactly like a
// real browser resize would.
function makeResizeFirer() {
  let callback = null;
  class TriggerRO {
    constructor(cb) { callback = cb; }
    observe() {}
    disconnect() {}
  }
  return {
    Observer: TriggerRO,
    fire(element, width, height) {
      callback([{ target: element, contentRect: { width, height } }]);
    },
  };
}

// jsdom does no layout: stub the mount measurement (border-box rect minus
// padding/border) so the hook sees a fixed content-box size.
function stubMeasurement(width, height) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0, toJSON() {},
  });
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    paddingLeft: '0px', paddingRight: '0px', paddingTop: '0px', paddingBottom: '0px',
    borderLeftWidth: '0px', borderRightWidth: '0px', borderTopWidth: '0px', borderBottomWidth: '0px',
  });
}

function Probe({ breakpoints, options = {} }) {
  const bp = useBreakpoint({ autoAdapt: false, ...options, breakpoints });
  return <div ref={bp.ref} data-bp>{bp.breakpoint}</div>;
}

function AutoGridProbe() {
  const bp = useBreakpoint({ autoPreset: ['grid-cols'], autoAdapt: false });
  return <div ref={bp.ref} data-grid className="grid grid-cols-3" />;
}

function WindowProbe() {
  const bp = useBreakpoint({ watchWindow: true, debounceDelay: 0 });
  return <div data-bp>{bp.breakpoint}</div>;
}

describe('useBreakpoint hook (jsdom)', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => { root?.unmount(); });
    root = undefined;
    container.remove();
    vi.restoreAllMocks();
    vi.useRealTimers();
    delete window.ResizeObserver;
  });

  it('resolves the breakpoint from the measured element width', async () => {
    window.ResizeObserver = MockResizeObserver;
    stubMeasurement(1000, 500);
    await act(async () => {
      root = createRoot(container);
      root.render(<Probe breakpoints="tailwind" />);
    });
    // 1000px: tailwind md is 768–1024
    expect(container.querySelector('[data-bp]').textContent).toBe('md');
  });

  it('updates breakpoint when the breakpoints map switches at a constant width', async () => {
    window.ResizeObserver = MockResizeObserver;
    stubMeasurement(1000, 500);
    await act(async () => {
      root = createRoot(container);
      root.render(<Probe breakpoints="tailwind" />);
    });
    expect(container.querySelector('[data-bp]').textContent).toBe('md');

    // No resize in between — same measured width, only the map changes.
    // Regression: the dedup guard must not swallow this re-resolve.
    await act(async () => {
      root.render(<Probe breakpoints="bootstrap" />);
    });
    // 1000px: bootstrap lg starts at 992
    expect(container.querySelector('[data-bp]').textContent).toBe('lg');
  });

  it('re-resolves when the observed element resizes (debounced)', async () => {
    const firer = makeResizeFirer();
    window.ResizeObserver = firer.Observer;
    stubMeasurement(700, 400);
    await act(async () => {
      root = createRoot(container);
      root.render(<Probe breakpoints="tailwind" />);
    });
    expect(container.querySelector('[data-bp]').textContent).toBe('sm'); // 700px: sm is 640–768

    vi.useFakeTimers();
    act(() => firer.fire(container.querySelector('[data-bp]'), 1100, 400));
    expect(container.querySelector('[data-bp]').textContent).toBe('sm'); // still debounced
    act(() => vi.advanceTimersByTime(120));
    expect(container.querySelector('[data-bp]').textContent).toBe('lg'); // 1100px: lg is 1024–1280
  });

  it('autoPreset rewrites the matching class on the element', async () => {
    const firer = makeResizeFirer();
    window.ResizeObserver = firer.Observer;
    stubMeasurement(500, 400);
    await act(async () => {
      root = createRoot(container);
      root.render(<AutoGridProbe />);
    });
    const el = container.querySelector('[data-grid]');
    expect(el.className).toContain('grid-cols-1');

    vi.useFakeTimers();
    act(() => firer.fire(el, 1300, 400));
    act(() => vi.advanceTimersByTime(120));
    expect(el.className).toContain('grid-cols-6');
    expect(el.className).not.toContain('grid-cols-1');
    expect(el.className).toContain('grid'); // anchor class untouched
  });

  it('watchWindow tracks window.innerWidth', async () => {
    window.innerWidth = 1000;
    await act(async () => {
      root = createRoot(container);
      root.render(<WindowProbe />);
    });
    expect(container.querySelector('[data-bp]').textContent).toBe('md');

    await act(async () => {
      window.innerWidth = 1300;
      window.dispatchEvent(new Event('resize'));
    });
    expect(container.querySelector('[data-bp]').textContent).toBe('xl');
  });

  it('warns when autoPreset combines text and heading', async () => {
    window.ResizeObserver = MockResizeObserver;
    stubMeasurement(500, 400);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await act(async () => {
      root = createRoot(container);
      root.render(<Probe breakpoints="tailwind" options={{ autoPreset: ['text', 'heading'] }} />);
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("'text' and 'heading'"));
  });
});
