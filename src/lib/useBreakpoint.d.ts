// Type definitions for @codefish24/use-breakpoint
// Element-width breakpoint detection for React — Tailwind, Bootstrap, or custom maps.

import type * as React from 'react';

/** Breakpoint map: name → min-width in px, e.g. { xs: 0, sm: 640, md: 768 } */
export interface BreakpointMap {
  [name: string]: number;
}

export declare const BREAKPOINTS_TAILWIND: Readonly<BreakpointMap>;
export declare const BREAKPOINTS_BOOTSTRAP: Readonly<BreakpointMap>;
export declare const BREAKPOINTS_DEFAULT: BreakpointMap;

/** Mutable registry backing the `responsive()` preset strings. Add your own entries. */
export declare const RESPONSIVE_PRESETS: Record<string, Record<string, string | number>>;

/** Presets applied by `autoPreset: true` — ['grid-cols', 'gap', 'p'] */
export declare const AUTO_PRESET_DEFAULTS: readonly string[];

/** Framework layout hint for the current width (see `suggestions`). */
export interface BreakpointSuggestion {
  bp: string;
  message: string;
  /** Tailwind suggestions: replacement grid-cols-* class */
  layout?: string;
  /** Tailwind suggestions: replacement flex-row / flex-col class */
  flex?: string;
  /** Bootstrap suggestions: replacement col-* class */
  colClass?: string;
}

/** Payload of the `onResize` callback. */
export interface ResizeInfo {
  width: number;
  height: number;
  breakpoint: string;
  suggestions: BreakpointSuggestion[];
}

export interface UseBreakpointOptions {
  /** Called on every processed resize with the resolved values. */
  onResize?: (info: ResizeInfo) => void;
  /** Breakpoint map, or a preset name. Default: Tailwind. */
  breakpoints?: BreakpointMap | 'tailwind' | 'bootstrap';
  /** Framework for class suggestions / autoAdapt / autoPreset. Default: 'auto' (sniffed from className). */
  framework?: 'tailwind' | 'bootstrap' | 'auto' | null;
  /** Auto-swap grid-cols-* / col-* classes on the watched element. Default: true. */
  autoAdapt?: boolean;
  /** Zero-config auto presets — `true` for defaults, or an array of preset keys. Default: false. */
  autoPreset?: boolean | string[];
  /** Debounce ms for resize events. Set 0 to disable. Default: 100. */
  debounceDelay?: number;
  /** Include element height in the return value. Default: false. */
  trackHeight?: boolean;
  /** Watch window resize instead of the attached element. Default: false. */
  watchWindow?: boolean;
  /** Console-log every breakpoint change. Default: false. */
  logChanges?: boolean;
}

export interface UseBreakpointReturn {
  /** Attach to the element you want to measure. Re-observes if it swaps to another node. */
  ref: (node: HTMLElement | null) => void;
  /** Element width in px — content box (padding & border excluded). */
  width: number;
  /** Only defined when `trackHeight: true`. */
  height: number | undefined;
  /** Active breakpoint name, e.g. 'md'. */
  breakpoint: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  /** Exact-match flags — generated from your breakpoint map (Tailwind names shown; any custom names appear too). */
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  /** True when width ≥ the given breakpoint. */
  isAbove(bp: string): boolean;
  /** True when width < the given breakpoint. */
  isBelow(bp: string): boolean;
  /** True when bpMin ≤ width < bpMax. */
  isBetween(bpMin: string, bpMax: string): boolean;
  /** Pick the value matching the current width from a preset string or a custom `{ bp: value }` map. */
  responsive<T = string | number>(mapOrPreset: string | Record<string, T>): T | undefined;
  /** Framework layout hints for the current width. */
  suggestions: BreakpointSuggestion[];
  /** Dynamic exact-match flags generated from your breakpoint map (isXs, isSm, …). */
  [flag: string]:
    | boolean
    | number
    | string
    | undefined
    | ((...args: any[]) => any)
    | BreakpointSuggestion[];
}

export declare function useBreakpoint(options?: UseBreakpointOptions): UseBreakpointReturn;

export interface ResponsiveProps extends UseBreakpointOptions {
  children?: React.ReactNode | ((resize: UseBreakpointReturn) => React.ReactNode);
  className?: string;
  style?: React.CSSProperties;
}

/** Render-prop wrapper around `useBreakpoint`; accepts all hook options as props. */
export declare function Responsive(props: ResponsiveProps): React.ReactElement;

// ---------------------------------------------------------------------------
// Exported utilities (pure functions, safe to reuse/test directly)
// ---------------------------------------------------------------------------

/** Normalizes 'tailwind' / 'bootstrap' / a custom map / undefined to a breakpoint map. */
export declare function resolveBreakpoints(
  bp?: BreakpointMap | 'tailwind' | 'bootstrap' | null
): BreakpointMap;

/** Active breakpoint name for a width (largest min ≤ width, else the smallest). */
export declare function getBreakpointName(width: number, breakpoints: BreakpointMap): string;

/** Generates { isXs, isSm, … } — true for the single range [min, nextMin) containing width. */
export declare function buildBreakpointFlags(width: number, breakpoints: BreakpointMap): Record<string, boolean>;

/** Picks the value for `width` from a { bp: value } map, walking breakpoints largest down. */
export declare function resolveResponsiveValue<T>(
  map: Record<string, T>,
  width: number,
  breakpoints: BreakpointMap
): T | undefined;

/** Sniffs 'tailwind' | 'bootstrap' | null from an element-like object's className. */
export declare function detectFramework(
  element: { className?: unknown } | null | undefined
): 'tailwind' | 'bootstrap' | null;

declare const useBreakpointDefault: typeof useBreakpoint;
export default useBreakpointDefault;
