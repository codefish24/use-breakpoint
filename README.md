<div align="center">

# 🐟 use-breakpoint

**Smart breakpoint detection hook for React**

[![npm version](https://img.shields.io/npm/v/@codefish24/use-breakpoint?style=flat-square&color=blue)](https://www.npmjs.com/package/@codefish24/use-breakpoint)
[![npm downloads](https://img.shields.io/npm/dm/@codefish24/use-breakpoint?style=flat-square&color=green)](https://www.npmjs.com/package/@codefish24/use-breakpoint)
[![license](https://img.shields.io/npm/l/@codefish24/use-breakpoint?style=flat-square&color=orange)](./LICENSE)
[![react peer](https://img.shields.io/npm/dependency-version/@codefish24/use-breakpoint/peer/react?style=flat-square&color=61dafb)](https://reactjs.org)

Stop writing breakpoint ternaries and class soup.<br/>
Attach one `ref`, call `responsive()`, done.

Works with **Tailwind CSS**, **Bootstrap**, or any custom breakpoint system.

```bash
npm install @codefish24/use-breakpoint
```

</div>

---

## Why this exists

Every project using Tailwind or Bootstrap hits the same wall — responsive layouts mean either giant class strings or chains of `isMobile ? … : isTablet ? … : …` buried in JSX.

```jsx
// ❌ Class soup — one line controls everything, no JS logic possible
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-4 lg:gap-6">

// ❌ Ternary chains — still have to touch every component when design changes
const cols = isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4'
const gap  = isMobile ? 'gap-2' : isTablet ? 'gap-4' : 'gap-6'

// ✅ use-breakpoint — one preset string, auto-updates with breakpoint
const { ref, responsive } = useBreakpoint()
const cols = responsive('grid-cols')   // grid-cols-1 → 2 → 3 → 4 → 6
const gap  = responsive('gap')         // gap-2 → 4 → 6 → 8
const col  = responsive('col')         // col-12 → col-6 → col-4 → col-3  (Bootstrap)
```

Uses **`ResizeObserver`** — watches the **element itself**, not the window. Works correctly inside sidebars, modals, and split-pane layouts where the window is wide but the container is not.

---

## Quick start

```jsx
import { useBreakpoint } from '@codefish24/use-breakpoint'

function Card() {
  const { ref, width, breakpoint, responsive } = useBreakpoint()

  return (
    <div ref={ref} className={responsive('p')}>
      <h1 className={responsive('heading')}>
        {width}px — {breakpoint}
      </h1>
      <div className={`grid ${responsive('gap')} ${responsive('grid-cols')}`}>
        {/* content */}
      </div>
    </div>
  )
}
```

> Attach `ref` to the element you want to measure. Everything reacts to **that element's** size, not the window.

---

## Installation

```bash
# npm
npm install @codefish24/use-breakpoint

# pnpm
pnpm add @codefish24/use-breakpoint

# yarn
yarn add @codefish24/use-breakpoint
```

**Peer dependency:** React ≥ 19

---

## `responsive()` presets

Pass a string — no map needed. Covers the most common things that change across breakpoints.

| Preset | `xs` | `sm` | `md` | `lg` | `xl` |
|---|---|---|---|---|---|
| `'grid-cols'` | `grid-cols-1` | `grid-cols-2` | `grid-cols-3` | `grid-cols-4` | `grid-cols-6` |
| `'gap'` | `gap-2` | `gap-4` | `gap-4` | `gap-6` | `gap-8` |
| `'p'` | `p-2` | `p-4` | `p-6` | `p-8` | `p-10` |
| `'px'` | `px-2` | `px-4` | `px-6` | `px-8` | `px-10` |
| `'py'` | `py-2` | `py-4` | `py-6` | `py-8` | `py-10` |
| `'text'` | `text-sm` | `text-base` | `text-base` | `text-lg` | `text-xl` |
| `'heading'` | `text-xl` | `text-2xl` | `text-3xl` | `text-4xl` | `text-5xl` |
| `'col'` *(Bootstrap)* | `col-12` | `col-6` | `col-4` | `col-3` | `col-2` |
| `'col-half'` *(Bootstrap)* | `col-12` | `col-12` | `col-6` | `col-6` | `col-6` |

Need something different? Pass a custom map instead:

```js
responsive({ xs: 'grid-cols-1', md: 'grid-cols-2', xl: 'grid-cols-5' })
responsive({ xs: 14, md: 16, xl: 20 })   // any value type works
```

Add your own global presets once, reuse everywhere:

```js
import { RESPONSIVE_PRESETS } from '@codefish24/use-breakpoint'

RESPONSIVE_PRESETS['icon'] = { xs: 'w-4 h-4', sm: 'w-5 h-5', lg: 'w-6 h-6' }
```

---

## Examples

### 🚀 autoPreset — Zero Config (Recommended)

The simplest approach — no need to call `responsive()` manually:

```jsx
function ProductGrid({ products }) {
  // autoPreset: true automatically applies grid-cols, gap, p
  const { ref } = useBreakpoint({ autoPreset: true })

  return (
    <div ref={ref} className="grid">
      {products.map(p => <ProductCard key={p.id} {...p} />)}
    </div>
  )
}
```

**Result:** Responsive classes are added automatically:
- `xs` → `grid-cols-1 gap-2 p-2`
- `sm` → `grid-cols-2 gap-4 p-4`
- `md` → `grid-cols-3 gap-4 p-6`
- `lg` → `grid-cols-4 gap-6 p-8`
- `xl` → `grid-cols-6 gap-8 p-10`

#### Customize Preset Scope

```jsx
// Only apply grid and gap
const { ref } = useBreakpoint({ autoPreset: ['grid-cols', 'gap'] })

// Apply more presets
const { ref } = useBreakpoint({
  autoPreset: ['grid-cols', 'gap', 'p', 'text']
})
```

#### Available Presets

| Preset | Description |
|--------|-------------|
| `'grid-cols'` | Grid columns |
| `'gap'` | Gap spacing |
| `'gap-x'` / `'gap-y'` | Horizontal/vertical gap |
| `'p'` | Padding |
| `'px'` / `'py'` | Horizontal/vertical padding |
| `'m'` | Margin |
| `'mx'` / `'my'` | Horizontal/vertical margin |
| `'text'` | Font size |
| `'heading'` | Heading size |
| `'space-x'` / `'space-y'` | Space between children |
| `'col'` / `'col-half'` | Bootstrap columns |

---

### Tailwind — responsive grid

```jsx
function ProductGrid({ products }) {
  const { ref, responsive } = useBreakpoint()

  return (
    <div ref={ref} className={`grid ${responsive('gap')} ${responsive('grid-cols')}`}>
      {products.map(p => <ProductCard key={p.id} {...p} />)}
    </div>
  )
}
```

### Bootstrap — responsive columns

```jsx
function Sidebar({ children }) {
  const { ref, responsive } = useBreakpoint({ breakpoints: 'bootstrap' })

  return (
    <div ref={ref} className="row">
      <div className={responsive('col')}>{children}</div>
    </div>
  )
}
```

### Watch window size (no ref needed)

```jsx
function App() {
  const { width, breakpoint, isMobile } = useBreakpoint({ watchWindow: true })

  return <p>{width}px — {breakpoint} — {isMobile ? 'Mobile' : 'Desktop'}</p>
}
```

### Custom breakpoints

```jsx
const MY_BPS = { compact: 0, regular: 500, wide: 900, ultrawide: 1600 }

function Banner() {
  const { ref, responsive, isAbove } = useBreakpoint({ breakpoints: MY_BPS })

  return (
    <div ref={ref}
      className={responsive({ compact: 'p-2', regular: 'p-4', wide: 'p-8' })}
      style={{ fontSize: responsive({ compact: 14, regular: 16, ultrawide: 20 }) }}
    >
      {isAbove('ultrawide') && <UltrawideBanner />}
    </div>
  )
}
```

### `onResize` callback

```jsx
function Chart() {
  const { ref } = useBreakpoint({
    trackHeight: true,
    onResize: ({ width, height, breakpoint }) => {
      console.log(`${width}×${height} (${breakpoint})`)
    },
  })

  return <div ref={ref} style={{ width: '100%', height: 400 }} />
}
```

### `<Responsive>` component (no hook)

```jsx
import { Responsive } from '@codefish24/use-breakpoint'

function Page() {
  return (
    <Responsive className="container mx-auto">
      {({ responsive, breakpoint }) => (
        <nav className={`flex ${responsive({ xs: 'flex-col', md: 'flex-row' })}`}>
          Current: {breakpoint}
        </nav>
      )}
    </Responsive>
  )
}
```

---

## API

### `useBreakpoint(options?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `breakpoints` | `object \| 'tailwind' \| 'bootstrap'` | `'tailwind'` | Breakpoint map or preset name |
| `framework` | `'tailwind' \| 'bootstrap' \| 'auto' \| null` | `'auto'` | Framework for class `suggestions` |
| `autoAdapt` | `boolean` | `true` | Auto-swap grid/col classes on the watched element |
| `autoPreset` | `boolean \| string[]` | `false` | ⭐ **Zero-config auto presets** — `true` for defaults, or pass array to customize |
| `debounceDelay` | `number` | `100` | Debounce in ms — set `0` to disable |
| `trackHeight` | `boolean` | `false` | Include element height in return value |
| `watchWindow` | `boolean` | `false` | Watch `window` size instead of an element |
| `logChanges` | `boolean` | `false` | Console-log every breakpoint change |
| `onResize` | `function` | — | `({ width, height, breakpoint, suggestions }) => void` |

#### `autoPreset` Details

| Value | Effect |
|-------|--------|
| `false` | No auto presets (default) |
| `true` | Apply default presets: `['grid-cols', 'gap', 'p']` |
| `['grid-cols', 'gap']` | Apply only specified presets |
| `['grid-cols', 'gap', 'p', 'text']` | Apply more presets |

**Note:** `autoPreset` only works on elements (requires `ref`), not with `watchWindow: true`.

> ⚠️ `'text'` and `'heading'` rewrite the same `text-*` classes — don't combine them in one `autoPreset` (the later one wins; you'll get a console warning). `'gap'` leaves `gap-x-*` / `gap-y-*` classes untouched.

### Return values

| Value | Type | Description |
|---|---|---|
| `ref` | callback ref | Attach to your element: `<div ref={ref}>`. Re-observes automatically if it attaches to a different element |
| `width` | `number` | Element width in px — **content box** (padding & border excluded), matching what `ResizeObserver` reports |
| `height` | `number \| undefined` | Element height (only when `trackHeight: true`) |
| `breakpoint` | `string` | Active breakpoint name, e.g. `'md'` |
| `isMobile` | `boolean` | `width < sm` |
| `isTablet` | `boolean` | `sm ≤ width < lg` |
| `isDesktop` | `boolean` | `width ≥ lg` |
| `isXs` `isSm` `isMd` `isLg` `isXl` | `boolean` | Exact breakpoint match, auto-generated per your map |
| `isAbove(bp)` | `fn` | `width >= breakpoints[bp]` |
| `isBelow(bp)` | `fn` | `width < breakpoints[bp]` |
| `isBetween(min, max)` | `fn` | `min ≤ width < max` |
| `responsive(preset \| map)` | `fn` | Returns the value matching the current breakpoint |
| `isLandscape` | `boolean` | `width > height` |
| `isPortrait` | `boolean` | `height >= width` |
| `suggestions` | `array` | Framework layout hints for the current width |

---

## Breakpoint presets

### Tailwind CSS (default)

| `xs` | `sm` | `md` | `lg` | `xl` | `2xl` |
|---|---|---|---|---|---|
| 0 px | 640 px | 768 px | 1024 px | 1280 px | 1536 px |

### Bootstrap

| `xs` | `sm` | `md` | `lg` | `xl` | `xxl` |
|---|---|---|---|---|---|
| 0 px | 576 px | 768 px | 992 px | 1200 px | 1400 px |

```js
import { BREAKPOINTS_TAILWIND, BREAKPOINTS_BOOTSTRAP } from '@codefish24/use-breakpoint'
```

---

## Good to know

- **Element-aware, not window-aware** — measurement rides on `ResizeObserver`, so a narrow sidebar in a wide window still resolves to the mobile breakpoint. Works inside modals, split panes, and resizable containers.
- **Content-box width** — `width` is the element's content box (padding and border excluded). A `p-6` container reports its inner width, not the full box.
- **Ref swaps are safe** — the hook re-observes automatically if conditional rendering swaps the `ref` onto a different element.
- **Debounced by default** — resize events settle for 100 ms before React state updates. Set `debounceDelay: 0` for instant updates.
- **`autoPreset` / `autoAdapt` write classes outside React** — they mutate the element's `className` directly. Keep an anchor class in your JSX (e.g. `grid`) and let the preset own the responsive part (`grid-cols-*`); React re-renders won't wipe it as long as the JSX `className` string is unchanged.
- **SSR-safe** — all browser APIs are touched inside effects. On the server you get `width: 0` and the smallest breakpoint; nothing throws.

---

## License

MIT © [codefish24](https://github.com/codefish24)


