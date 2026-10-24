import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Default breakpoints — match Tailwind CSS v3 defaults
// ---------------------------------------------------------------------------
export const BREAKPOINTS_TAILWIND = { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 };
export const BREAKPOINTS_BOOTSTRAP = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400 };
export const BREAKPOINTS_DEFAULT = BREAKPOINTS_TAILWIND;

// ---------------------------------------------------------------------------
// responsive() built-in presets
// These cover the most common things that change across breakpoints.
// Pass the key string to responsive() instead of writing a full map.
// ---------------------------------------------------------------------------
export const RESPONSIVE_PRESETS = {
  // Tailwind — grid columns
  'grid-cols':  { xs: 'grid-cols-1', sm: 'grid-cols-2', md: 'grid-cols-3', lg: 'grid-cols-4', xl: 'grid-cols-6' },
  'cols':       { xs: 'grid-cols-1', sm: 'grid-cols-2', md: 'grid-cols-3', lg: 'grid-cols-4', xl: 'grid-cols-6' },

  // Tailwind — padding
  'p':          { xs: 'p-2',  sm: 'p-4',  md: 'p-6',  lg: 'p-8',  xl: 'p-10' },
  'px':         { xs: 'px-2', sm: 'px-4', md: 'px-6', lg: 'px-8', xl: 'px-10' },
  'py':         { xs: 'py-2', sm: 'py-4', md: 'py-6', lg: 'py-8', xl: 'py-10' },

  // Tailwind — gap
  'gap':        { xs: 'gap-2', sm: 'gap-4', md: 'gap-4', lg: 'gap-6', xl: 'gap-8' },
  'gap-x':      { xs: 'gap-x-2', sm: 'gap-x-4', md: 'gap-x-4', lg: 'gap-x-6', xl: 'gap-x-8' },
  'gap-y':      { xs: 'gap-y-2', sm: 'gap-y-4', md: 'gap-y-4', lg: 'gap-y-6', xl: 'gap-y-8' },


  // Tailwind — text size
  'text':       { xs: 'text-sm', sm: 'text-base', md: 'text-base', lg: 'text-lg', xl: 'text-xl' },
  'heading':    { xs: 'text-xl', sm: 'text-2xl',  md: 'text-3xl',  lg: 'text-4xl', xl: 'text-5xl' },

  // Tailwind — margin
  'm':          { xs: 'm-2',  sm: 'm-4',  md: 'm-6',  lg: 'm-8',  xl: 'm-10' },
  'mx':         { xs: 'mx-2', sm: 'mx-4', md: 'mx-6', lg: 'mx-8', xl: 'mx-auto' },
  'my':         { xs: 'my-2', sm: 'my-4', md: 'my-6', lg: 'my-8', xl: 'my-10' },

  // Tailwind — spacing (通用)
  'space-x':    { xs: 'space-x-2', sm: 'space-x-4', md: 'space-x-4', lg: 'space-x-6', xl: 'space-x-8' },
  'space-y':    { xs: 'space-y-2', sm: 'space-y-4', md: 'space-y-4', lg: 'space-y-6', xl: 'space-y-8' },

  // Bootstrap — column classes
  'col':        { xs: 'col-12', sm: 'col-6', md: 'col-4', lg: 'col-3', xl: 'col-2' },
  'col-half':   { xs: 'col-12', sm: 'col-12', md: 'col-6', lg: 'col-6', xl: 'col-6' },
};

// Default presets for autoPreset
export const AUTO_PRESET_DEFAULTS = ['grid-cols', 'gap', 'p'];

// Regex patterns for auto-replacing each preset (Tailwind)
const TAILWIND_PATTERNS = {
  'grid-cols': /\bgrid-cols-\S+/g,
  // Negative lookahead so 'gap' never clobbers gap-x-* / gap-y-* classes
  'gap':       /\bgap-(?!x-|y-)\S+/g,
  'gap-x':     /\bgap-x-\S+/g,
  'gap-y':     /\bgap-y-\S+/g,
  'p':         /\bp-(\S+)?/g,
  'px':        /\bpx-\S+/g,
  'py':        /\bpy-\S+/g,
  'm':         /\bm-(\S+)?/g,
  'mx':        /\bmx-\S+/g,
  'my':        /\bmy-\S+/g,
  'text':      /\btext-(sm|base|lg|xl|2xl|3xl|4xl|5xl)\b/g,
  'heading':   /\btext-(sm|base|lg|xl|2xl|3xl|4xl|5xl)\b/g,
  'space-x':   /\bspace-x-\S+/g,
  'space-y':   /\bspace-y-\S+/g,
};

// Bootstrap patterns
const BOOTSTRAP_PATTERNS = {
  'col':       /\bcol(-\w+)?(-\d+)?\b/g,
  'col-half':  /\bcol(-\w+)?(-\d+)?\b/g,
};

// ---------------------------------------------------------------------------
// Framework auto-detection
// ---------------------------------------------------------------------------
function detectFramework(element) {
  if (!element) return null;
  const cls = typeof element.className === 'string' ? element.className : '';
  if (/\b(sm:|md:|lg:|xl:|flex|grid-cols|mx-auto|px-\d|py-\d|text-\w|bg-\w|rounded|shadow)\b/.test(cls)) return 'tailwind';
  if (/\bcol-(\w+-)?\d+\b/.test(cls) || /\brow\b/.test(cls)) return 'bootstrap';
  return null;
}

// ---------------------------------------------------------------------------
// Breakpoint utilities
// ---------------------------------------------------------------------------
function resolveBreakpoints(bp) {
  if (bp === 'tailwind') return BREAKPOINTS_TAILWIND;
  if (bp === 'bootstrap') return BREAKPOINTS_BOOTSTRAP;
  return bp && typeof bp === 'object' ? bp : BREAKPOINTS_DEFAULT;
}

function getBreakpointName(width, breakpoints) {
  const sorted = Object.entries(breakpoints).sort((a, b) => b[1] - a[1]);
  for (const [name, min] of sorted) {
    if (width >= min) return name;
  }
  return sorted[sorted.length - 1][0];
}

// Generates { isXs, isSm, isMd, isLg, isXl, is2xl, ... } for any breakpoint map
function buildBreakpointFlags(width, breakpoints) {
  const entries = Object.entries(breakpoints).sort((a, b) => a[1] - b[1]);
  const flags = {};
  for (let i = 0; i < entries.length; i++) {
    const [name, min] = entries[i];
    const max = entries[i + 1] ? entries[i + 1][1] : Infinity;
    const key = 'is' + name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, '');
    flags[key] = width >= min && width < max;
  }
  return flags;
}

// ---------------------------------------------------------------------------
// responsive() core resolution — shared by responsive() and autoPreset
// ---------------------------------------------------------------------------
// Pick the value for `width` from a { bp: value } map, walking breakpoints
// from the largest down. Falls back to the smallest breakpoint present in
// the map when width is below every entry.
function resolveResponsiveValue(map, width, breakpoints) {
  const sorted = Object.entries(breakpoints)
    .filter(([name]) => name in map)
    .sort((a, b) => b[1] - a[1]);
  for (const [name] of sorted) {
    if (width >= breakpoints[name]) return map[name];
  }
  const fallbackKey = Object.entries(breakpoints)
    .filter(([name]) => name in map)
    .sort((a, b) => a[1] - b[1])[0]?.[0];
  return fallbackKey !== undefined ? map[fallbackKey] : undefined;
}

// 'text' and 'heading' share the same class pattern — applying both would
// double-rewrite every text-* class. Warn once per pair so users notice.
const warnedCollisions = new Set();
function warnPatternCollisions(keys) {
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = TAILWIND_PATTERNS[keys[i]];
      const b = TAILWIND_PATTERNS[keys[j]];
      if (!a || !b || a.source !== b.source) continue;
      const id = keys[i] + '+' + keys[j];
      if (warnedCollisions.has(id)) continue;
      warnedCollisions.add(id);
      console.warn(`[use-breakpoint] autoPreset '${keys[i]}' and '${keys[j]}' target the same classes — the later one wins.`);
    }
  }
}

// ---------------------------------------------------------------------------
// Framework suggestion helpers (for `suggestions` return value)
// ---------------------------------------------------------------------------
function tailwindSuggestions(width) {
  if (width < 640)  return [{ bp: 'xs',  layout: 'grid-cols-1', flex: 'flex-col',  message: 'Mobile – single column' }];
  if (width < 768)  return [{ bp: 'sm',  layout: 'grid-cols-2', flex: 'flex-row',  message: 'SM – 2-col grid' }];
  if (width < 1024) return [{ bp: 'md',  layout: 'grid-cols-3', flex: 'flex-row',  message: 'MD – 3-col grid' }];
  if (width < 1280) return [{ bp: 'lg',  layout: 'grid-cols-4', flex: 'flex-row',  message: 'LG – 4-col grid' }];
  if (width < 1536) return [{ bp: 'xl',  layout: 'grid-cols-6', flex: 'flex-row',  message: 'XL – 6-col grid' }];
  return            [{ bp: '2xl', layout: 'grid-cols-6', flex: 'flex-row',  message: '2XL – 6-col grid' }];
}

function bootstrapSuggestions(width) {
  if (width < 576)  return [{ bp: 'xs',  colClass: 'col-12',      message: 'Mobile – full width' }];
  if (width < 768)  return [{ bp: 'sm',  colClass: 'col-sm-6',    message: 'SM – half width' }];
  if (width < 992)  return [{ bp: 'md',  colClass: 'col-md-4',    message: 'MD – thirds' }];
  if (width < 1200) return [{ bp: 'lg',  colClass: 'col-lg-3',    message: 'LG – quarters' }];
  if (width < 1400) return [{ bp: 'xl',  colClass: 'col-xl-2',    message: 'XL – sixths' }];
  return            [{ bp: 'xxl', colClass: 'col-xxl-2',  message: 'XXL – sixths' }];
}

const FRAMEWORK_SUGGESTIONS = { tailwind: tailwindSuggestions, bootstrap: bootstrapSuggestions };

// ---------------------------------------------------------------------------
// useBreakpoint — main hook
// ---------------------------------------------------------------------------
/**
 * Smart element/window resize hook for React.
 *
 * Works with Tailwind, Bootstrap, or any custom breakpoint system.
 * Attach `ref` to any element and get live dimensions, breakpoints,
 * and handy boolean helpers — no more manual media queries.
 *
 * @param {object}          [options]
 * @param {function}        [options.onResize]        Callback: ({ width, height, breakpoint, suggestions })
 * @param {object|string}   [options.breakpoints]     Breakpoint map, or 'tailwind' / 'bootstrap'. Default: Tailwind.
 * @param {string}          [options.framework]       'tailwind' | 'bootstrap' | 'auto' | null
 * @param {boolean}         [options.autoAdapt=true]  Auto-swap Tailwind grid-col / Bootstrap col classes
 * @param {boolean|string[]}[options.autoPreset=false] Auto-apply preset classes. true = defaults, or pass array like ['grid-cols', 'gap']
 * @param {number}          [options.debounceDelay=100] Debounce ms (set 0 to disable)
 * @param {boolean}         [options.trackHeight=false] Include element height in return value
 * @param {boolean}         [options.watchWindow=false] Watch window resize instead of element
 * @param {boolean}         [options.logChanges=false]  Log breakpoint changes to console
 *
 * @returns {{
 *   ref: (node: Element | null) => void,
 *   width: number,
 *   height: number,
 *   breakpoint: string,
 *   isMobile: boolean,
 *   isTablet: boolean,
 *   isDesktop: boolean,
 *   isLandscape: boolean,
 *   isPortrait: boolean,
 *   isAbove: (bp: string) => boolean,
 *   isBelow: (bp: string) => boolean,
 *   isBetween: (bpMin: string, bpMax: string) => boolean,
 *   suggestions: Array,
 *   [isDynamic: string]: boolean
 * }}
 */
export function useBreakpoint(options = {}) {
  const {
    onResize,
    breakpoints: breakpointsProp = BREAKPOINTS_DEFAULT,
    framework = 'auto',
    autoAdapt = true,
    autoPreset = false,
    debounceDelay = 100,
    trackHeight = false,
    watchWindow = false,
    logChanges = false,
  } = options;

  // Resolve autoPreset to array of preset keys. Keyed by a serialized value so
  // an inline array literal (new identity every render) doesn't tear down and
  // reconnect the ResizeObserver effect on every render.
  const autoPresetKey = Array.isArray(autoPreset) ? autoPreset.join('|') : String(autoPreset);
  const presetKeys = useMemo(() => {
    const keys = autoPreset === true ? AUTO_PRESET_DEFAULTS : Array.isArray(autoPreset) ? autoPreset : [];
    warnPatternCollisions(keys);
    return keys;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPresetKey]);

  // Same trick for custom breakpoint maps passed inline.
  const breakpointsKey = typeof breakpointsProp === 'string' ? breakpointsProp : JSON.stringify(breakpointsProp);
  const breakpoints = useMemo(() => resolveBreakpoints(breakpointsProp),
  // eslint-disable-next-line react-hooks/exhaustive-deps
    [breakpointsKey]);

  // Store onResize in a ref so it never needs to be a useCallback dependency.
  // This prevents the ResizeObserver from reconnecting when an inline callback is passed.
  const onResizeRef = useRef(onResize);
  useEffect(() => { onResizeRef.current = onResize; });

  // Hold the observed node in state (not a bare ref) so the observer effect
  // re-runs when the ref attaches to a different element, e.g. when
  // conditional rendering swaps the node.
  const [element, setElement] = useState(null);
  const timeoutRef = useRef(null);
  // Dedup guards — see processResize
  const lastElementRef = useRef(null);
  const lastSigRef = useRef('');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [breakpoint, setBreakpoint] = useState(getBreakpointName(0, breakpoints));
  const [suggestions, setSuggestions] = useState([]);

  // Helper: get responsive value for a preset at current width
  const getResponsiveValue = useCallback((presetKey, w) => {
    const map = RESPONSIVE_PRESETS[presetKey];
    if (!map) return null;
    return resolveResponsiveValue(map, w, breakpoints) ?? null;
  }, [breakpoints]);

  const processResize = useCallback((width, height, element) => {
    // Skip redundant work: ResizeObserver fires once right after observe() on
    // top of our manual mount measurement, and re-fires when our own class
    // writes shift layout. Nothing new to compute if element + inputs match
    // the last processed run.
    const sig = `${width}|${height}|${presetKeys.join(',')}|${framework}|${autoAdapt}|${logChanges}`;
    if (element === lastElementRef.current && sig === lastSigRef.current) return;
    lastElementRef.current = element;
    lastSigRef.current = sig;

    const newBreakpoint = getBreakpointName(width, breakpoints);
    setDimensions({ width, height });
    setBreakpoint(newBreakpoint);

    if (logChanges) {
      console.log(`[use-breakpoint] ${newBreakpoint} — ${Math.round(width)}×${Math.round(height)}`);
    }

    // Resolve which framework adaptor to use
    const fw = framework === 'auto' ? detectFramework(element) : framework;
    const adaptor = fw && FRAMEWORK_SUGGESTIONS[fw];
    const newSuggestions = adaptor ? adaptor(width) : [];

    // Auto-apply framework classes directly on the element (autoAdapt + autoPreset).
    // This runs outside React's render cycle — React never learns about these
    // classes, so JSX className strings must keep the anchor class present
    // (e.g. a grid-cols-* class) for the regexes to swap rather than append.
    if (element && (fw === 'tailwind' || fw === 'bootstrap' || presetKeys.length > 0)) {
      let cls = element.className;
      const patterns = fw === 'bootstrap' ? BOOTSTRAP_PATTERNS : TAILWIND_PATTERNS;

      if (autoAdapt) {
        const suggestion = newSuggestions[0];
        if (fw === 'tailwind') {
          if (suggestion?.layout) cls = cls.replace(/\bgrid-cols-\S+/g, suggestion.layout);
          if (suggestion?.flex)   cls = cls.replace(/\bflex-(row|col)\b/g, suggestion.flex);
        } else if (fw === 'bootstrap' && suggestion?.colClass) {
          cls = cls.replace(/\bcol(-\w+)?(-\d+)?\b/g, suggestion.colClass);
        }
      }

      // autoPreset: apply all specified presets
      for (const presetKey of presetKeys) {
        const pattern = patterns[presetKey];
        const newValue = getResponsiveValue(presetKey, width);
        if (pattern && newValue) {
          // Check if class already exists
          if (pattern.test(cls)) {
            cls = cls.replace(pattern, newValue);
          } else {
            // Add new class
            cls = cls + ' ' + newValue;
          }
        }
      }

      const next = cls.replace(/\s+/g, ' ').trim();
      // Only touch the DOM when the class string actually changed — a no-op
      // write can shift layout and re-trigger the ResizeObserver.
      if (next !== element.className) element.className = next;
    }

    setSuggestions(newSuggestions);
    if (onResizeRef.current) onResizeRef.current({ width, height, breakpoint: newBreakpoint, suggestions: newSuggestions });
  }, [breakpoints, framework, autoAdapt, presetKeys, getResponsiveValue, logChanges]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (watchWindow) {
      const handler = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (debounceDelay) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => processResize(w, h, null), debounceDelay);
        } else {
          processResize(w, h, null);
        }
      };
      processResize(window.innerWidth, window.innerHeight, null);
      window.addEventListener('resize', handler);
      return () => {
        window.removeEventListener('resize', handler);
        clearTimeout(timeoutRef.current);
      };
    }

    if (!element) return;

    if (!window.ResizeObserver) {
      console.warn('[use-breakpoint] ResizeObserver is not supported in this browser.');
      return;
    }

    const resizeHandler = (entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (debounceDelay) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => processResize(width, height, entry.target), debounceDelay);
        } else {
          processResize(width, height, entry.target);
        }
      }
    };

    const observer = new ResizeObserver(resizeHandler);
    observer.observe(element);

    // Measure immediately on mount so width/breakpoint are available without
    // waiting for the observer's first (debounced) callback. Convert the
    // border-box rect to the content box so the values match what
    // ResizeObserver reports (entry.contentRect) — otherwise width would jump
    // once the observer's initial fire arrives.
    const rect = element.getBoundingClientRect();
    const cs = window.getComputedStyle(element);
    const contentWidth = Math.max(0, rect.width
      - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth));
    const contentHeight = Math.max(0, rect.height
      - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth));
    processResize(contentWidth, contentHeight, element);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutRef.current);
    };
  }, [watchWindow, debounceDelay, processResize, element]);

  const { width, height } = dimensions;
  const bpFlags = buildBreakpointFlags(width, breakpoints);

  // Stable responsive function — memoized to prevent unnecessary re-renders
  const responsive = useCallback((mapOrPreset) => {
    const map = typeof mapOrPreset === 'string'
      ? RESPONSIVE_PRESETS[mapOrPreset]
      : mapOrPreset;
    if (!map) {
      console.warn(`[use-breakpoint] Unknown preset "${mapOrPreset}". Available: ${Object.keys(RESPONSIVE_PRESETS).join(', ')}`);
      return undefined;
    }
    return resolveResponsiveValue(map, width, breakpoints);
  }, [breakpoints, width]);

  return {
    ref: setElement,
    width,
    height: trackHeight ? height : undefined,
    breakpoint,

    // Per-breakpoint exact-match booleans  (e.g. isSm, isMd, isLg …)
    ...bpFlags,

    // Common semantic aliases
    isMobile:  width > 0 && width <  (breakpoints.sm  ?? 640),
    isTablet:  width >= (breakpoints.sm  ?? 640) && width < (breakpoints.lg ?? 1024),
    isDesktop: width >= (breakpoints.lg  ?? 1024),

    // Orientation (useful with trackHeight or watchWindow)
    isLandscape: width > 0 && width > height,
    isPortrait:  height > 0 && height >= width,

    // Range helpers
    /** True when width ≥ the given breakpoint (e.g. isAbove('md')) */
    isAbove:   (bp) => width >= (breakpoints[bp] ?? 0),
    /** True when width < the given breakpoint (e.g. isBelow('lg')) */
    isBelow:   (bp) => width <  (breakpoints[bp] ?? Infinity),
    /** True when bpMin ≤ width < bpMax (e.g. isBetween('sm', 'xl')) */
    isBetween: (bpMin, bpMax) =>
      width >= (breakpoints[bpMin] ?? 0) && width < (breakpoints[bpMax] ?? Infinity),

    /**
     * Pick a value from a breakpoint map — no ternary chains needed.
     *
     * Pass a preset string for zero-config use:
     *   responsive('grid-cols')  → 'grid-cols-1' / 'grid-cols-2' / 'grid-cols-4' …
     *   responsive('col')        → 'col-12' / 'col-6' / 'col-4' …
     *   responsive('p')          → 'p-2' / 'p-4' / 'p-6' …
     *   responsive('gap')        → 'gap-2' / 'gap-4' / 'gap-6' …
     *   responsive('text')       → 'text-sm' / 'text-base' / 'text-lg' …
     *   responsive('heading')    → 'text-xl' / 'text-2xl' / 'text-4xl' …
     *   responsive('px')         → 'px-2' / 'px-4' / 'px-8' …
     *   responsive('py')         → 'py-2' / 'py-4' / 'py-8' …
     *
     * Or pass a custom map for full control:
     *   responsive({ xs: 'grid-cols-1', lg: 'grid-cols-4' })
     *   responsive({ xs: 14, md: 16, xl: 18 })
     */
    responsive,

    // Framework layout suggestions
    suggestions,
  };
}

// ---------------------------------------------------------------------------
// <Responsive> — render-prop wrapper component
// ---------------------------------------------------------------------------
/**
 * Drop-in wrapper that injects resize data into children.
 *
 * Accepts all `useBreakpoint` options as props.
 * Children may be a render function to access resize data:
 *
 * ```jsx
 * <Responsive breakpoints="tailwind">
 *   {({ isMobile, breakpoint }) => (
 *     <div className={isMobile ? 'grid-cols-1' : 'grid-cols-3'}>{breakpoint}</div>
 *   )}
 * </Responsive>
 * ```
 */
export function Responsive({ children, className, style, ...props }) {
  const resize = useBreakpoint(props);
  return (
    <div ref={resize.ref} className={className} style={style}>
      {typeof children === 'function' ? children(resize) : children}
    </div>
  );
}

export default useBreakpoint;