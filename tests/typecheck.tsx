// Type-level smoke test for src/lib/useBreakpoint.d.ts.
// Run with: npx tsc --noEmit --strict --jsx react-jsx --module esnext
//           --moduleResolution bundler --target es2020 --skipLibCheck tests/typecheck.tsx
import { createRoot } from 'react-dom/client';
import {
  AUTO_PRESET_DEFAULTS,
  BREAKPOINTS_BOOTSTRAP,
  BREAKPOINTS_TAILWIND,
  RESPONSIVE_PRESETS,
  Responsive,
  buildBreakpointFlags,
  detectFramework,
  getBreakpointName,
  resolveBreakpoints,
  resolveResponsiveValue,
  useBreakpoint,
} from '../src/lib/useBreakpoint';

// Registry mutation from the README
RESPONSIVE_PRESETS['icon'] = { xs: 'w-4 h-4', sm: 'w-5 h-5', lg: 'w-6 h-6' };

const {
  ref, width, height, breakpoint, isMobile, isSm, is2xl,
  isAbove, isBelow, isBetween, responsive, suggestions,
} = useBreakpoint({
  breakpoints: 'bootstrap',
  framework: 'auto',
  autoAdapt: true,
  autoPreset: ['grid-cols', 'gap'],
  debounceDelay: 0,
  trackHeight: true,
  watchWindow: false,
  logChanges: true,
  onResize: ({ width: w, height: h, breakpoint: b, suggestions: s }) => {
    console.log(w, h, b, s[0]?.bp, s[0]?.layout, s[0]?.colClass);
  },
});

const n: number = width;
const hgt: number | undefined = height;
const bp: string = breakpoint;
const flag: boolean = isSm && is2xl && isMobile;
const checks: boolean = isAbove('md') && isBelow('lg') && isBetween('sm', 'xl');
const presetValue: string | number | undefined = responsive('gap');
const customValue: number | undefined = responsive({ xs: 12, md: 16 });
const bpName: string = getBreakpointName(640, BREAKPOINTS_TAILWIND);
const flags: Record<string, boolean> = buildBreakpointFlags(700, BREAKPOINTS_TAILWIND);
const resolved: string | undefined = resolveResponsiveValue({ xs: 'a', lg: 'b' }, 800, BREAKPOINTS_TAILWIND);
const normalized = resolveBreakpoints('tailwind');
const fw: 'tailwind' | 'bootstrap' | null = detectFramework({ className: 'p-4' });
void AUTO_PRESET_DEFAULTS;
void BREAKPOINTS_BOOTSTRAP;
void normalized;

function App() {
  return (
    <div ref={ref} style={{ width: n }}>
      <Responsive breakpoints="tailwind" className="x" style={{ padding: 4 }} autoPreset>
        {({ breakpoint: current, responsive: r }) => (
          <span className={r<string>('gap')}>{current}</span>
        )}
      </Responsive>
      <Responsive>
        {suggestions.map((g) => <i key={g.bp}>{g.message}</i>)}
      </Responsive>
    </div>
  );
}

createRoot(document.createElement('div')).render(<App />);
void hgt;
void checks;
void fw;
void flag;
void bpName;
void flags;
void resolved;
void customValue;
void presetValue;
