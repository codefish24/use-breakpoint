import React, { useState, useCallback } from 'react'
import { useBreakpoint, Responsive, RESPONSIVE_PRESETS, AUTO_PRESET_DEFAULTS } from '../src/lib/useBreakpoint.jsx'

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [text])
  return (
    <button onClick={copy}
      className="absolute top-3 right-3 text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors">
      {copied ? '✓ copied' : 'copy'}
    </button>
  )
}

// ─── Code block ───────────────────────────────────────────────────────────────
function Code({ children }) {
  return (
    <div className="relative mt-3">
      <pre className="bg-gray-950 text-green-400 text-xs sm:text-sm p-4 pr-16 rounded-xl overflow-x-auto leading-relaxed">
        <code>{children}</code>
      </pre>
      <CopyButton text={children} />
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ children, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-100 text-indigo-700',
    green:  'bg-green-100  text-green-700',
    orange: 'bg-orange-100 text-orange-700',
    purple: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors[color] ?? colors.indigo}`}>
      {children}
    </span>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, badge, badgeColor, desc, children }) {
  return (
    <section className="mb-12">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {badge && <Badge color={badgeColor}>{badge}</Badge>}
      </div>
      {desc && <p className="text-sm text-gray-500 mb-4">{desc}</p>}
      {children}
    </section>
  )
}

// ─── Breakpoint ruler ─────────────────────────────────────────────────────────
const BP_STOPS = [
  { name: 'xs',  min: 0,    color: '#ef4444' },
  { name: 'sm',  min: 640,  color: '#f97316' },
  { name: 'md',  min: 768,  color: '#eab308' },
  { name: 'lg',  min: 1024, color: '#22c55e' },
  { name: 'xl',  min: 1280, color: '#3b82f6' },
  { name: '2xl', min: 1536, color: '#a855f7' },
]
const MAX_RULER = 1600

function BreakpointRuler({ width }) {
  const pct = Math.min(width / MAX_RULER, 1) * 100
  const active = [...BP_STOPS].reverse().find(bp => width >= bp.min) ?? BP_STOPS[0]

  return (
    <div className="mt-4">
      <div className="relative h-3 rounded-full bg-white/20 overflow-visible">
        {/* filled track */}
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
          style={{ width: `${pct}%`, background: active.color }} />
        {/* tick marks */}
        {BP_STOPS.slice(1).map(bp => (
          <div key={bp.name}
            className="absolute top-0 h-3 w-px bg-white/40"
            style={{ left: `${(bp.min / MAX_RULER) * 100}%` }} />
        ))}
      </div>
      <div className="flex justify-between text-xs opacity-50 mt-1 px-0.5">
        {BP_STOPS.map(bp => (
          <span key={bp.name} style={{ color: bp.name === active.name ? bp.color : undefined }}
            className={bp.name === active.name ? 'font-bold opacity-100' : ''}>
            {bp.name}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── 1. Live Stats ────────────────────────────────────────────────────────────
function LiveStats() {
  const { ref, width, height, breakpoint, isMobile, isTablet, isDesktop, isLandscape } =
    useBreakpoint({ trackHeight: true })

  const active = BP_STOPS.find(b => b.name === breakpoint) ?? BP_STOPS[0]

  const flags = [
    { label: 'Mobile',    on: isMobile },
    { label: 'Tablet',    on: isTablet },
    { label: 'Desktop',   on: isDesktop },
    { label: 'Landscape', on: isLandscape },
  ]

  return (
    <Section title="Live Element Stats" badge="ResizeObserver" badgeColor="indigo"
      desc="Drag the right edge of the box to resize the element independently of the window.">
      <div
        ref={ref}
        className="relative rounded-2xl p-6 text-white overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          resize: 'horizontal',
          minWidth: 240,
          maxWidth: 'calc(100vw - 2rem)',
        }}
      >
        {/* pattern overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '20px 20px' }} />

        {/* breakpoint pill */}
        <div className="flex justify-center mb-4">
          <span className="px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest transition-colors"
            style={{ background: active.color }}>
            {breakpoint}
          </span>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 gap-6 text-center mb-4">
          <div>
            <div className="text-4xl font-black tabular-nums">{Math.round(width)}</div>
            <div className="text-xs opacity-60 uppercase tracking-widest mt-1">width px</div>
          </div>
          <div>
            <div className="text-4xl font-black tabular-nums">{Math.round(height ?? 0)}</div>
            <div className="text-xs opacity-60 uppercase tracking-widest mt-1">height px</div>
          </div>
        </div>

        {/* flags */}
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {flags.map(({ label, on }) => (
            <span key={label}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${on ? 'bg-white text-purple-700 shadow' : 'bg-white/15 text-white/60'}`}>
              {on ? '✓ ' : ''}{label}
            </span>
          ))}
        </div>

        <BreakpointRuler width={width} />
        <div className="text-center text-xs opacity-40 mt-2">← drag right edge →</div>
      </div>

      <Code>{`const { ref, width, height, breakpoint, isMobile, isTablet, isDesktop } =
  useBreakpoint({ trackHeight: true })

// Attach ref to any element — watches that element, not the window
<div ref={ref}>…</div>`}</Code>
    </Section>
  )
}

// ─── 2. responsive() presets ──────────────────────────────────────────────────
function ResponsivePresetDemo() {
  const { responsive, breakpoint, width } = useBreakpoint({ watchWindow: true })

  const cols    = responsive('grid-cols')
  const gap     = responsive('gap')
  const padding = responsive('p')
  const text    = responsive('text')
  const heading = responsive('heading')

  const items = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']

  return (
    <Section title="responsive() Presets" badge="zero config" badgeColor="green"
      desc={`Pass a preset string — no ternaries, no maps. Window: ${breakpoint} (${Math.round(width)}px). Resize the browser to see it change.`}>

      <div className={`rounded-2xl border-2 border-dashed border-indigo-200 transition-all ${padding}`}>
        <p className={`font-bold text-gray-700 mb-2 transition-all ${heading}`}>
          Heading — <span className="text-indigo-500">{heading}</span>
        </p>
        <p className={`text-gray-500 mb-4 transition-all ${text}`}>
          Body text — <span className="text-indigo-500">{text}</span>
        </p>
        <div className={`grid transition-all ${cols} ${gap}`}>
          {items.map(item => (
            <div key={item}
              className="bg-indigo-600 text-white rounded-xl py-4 text-center text-sm font-semibold">
              {item}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
          <span>grid: <code className="text-indigo-500">{cols}</code></span>
          <span>gap: <code className="text-indigo-500">{gap}</code></span>
          <span>padding: <code className="text-indigo-500">{padding}</code></span>
          <span>text: <code className="text-indigo-500">{text}</code></span>
          <span>heading: <code className="text-indigo-500">{heading}</code></span>
        </div>
      </div>

      <Code>{`const { responsive } = useBreakpoint({ watchWindow: true })

const cols    = responsive('grid-cols') // → ${cols}
const gap     = responsive('gap')       // → ${gap}
const padding = responsive('p')         // → ${padding}
const text    = responsive('text')      // → ${text}
const heading = responsive('heading')   // → ${heading}`}</Code>
    </Section>
  )
}

// ─── 3. Custom map ────────────────────────────────────────────────────────────
function CustomMapDemo() {
  const { responsive, breakpoint, width } = useBreakpoint({ watchWindow: true })

  const colClass = responsive({ xs: 'grid-cols-1', sm: 'grid-cols-2', xl: 'grid-cols-4' })
  const cardBg   = responsive({ xs: 'bg-rose-500', md: 'bg-amber-500', xl: 'bg-emerald-500' })
  const label    = responsive({ xs: 'Mobile', sm: 'Small', md: 'Medium', lg: 'Large', xl: 'X-Large', '2xl': '2X-Large' })
  const fontSize = responsive({ xs: 12, sm: 13, md: 14, lg: 15, xl: 16 })

  return (
    <Section title="Custom responsive() Maps" badge="any value type" badgeColor="orange"
      desc={`Pass an object when presets aren't enough — works with strings, numbers, or any JS value. Current: ${breakpoint} (${Math.round(width)}px)`}>

      <div className="rounded-2xl border border-gray-200 p-4">
        <div className={`grid ${colClass} gap-3`}>
          {['Card 1', 'Card 2', 'Card 3', 'Card 4'].map(c => (
            <div key={c} className={`${cardBg} text-white rounded-xl p-4 text-center font-semibold transition-all`}
              style={{ fontSize }}>
              {c}
              <div className="text-xs opacity-75 mt-1">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
          <span>grid: <code className="text-orange-500">{colClass}</code></span>
          <span>label: <code className="text-orange-500">{label}</code></span>
          <span>fontSize: <code className="text-orange-500">{fontSize}px</code></span>
        </div>
      </div>

      <Code>{`const { responsive } = useBreakpoint({ watchWindow: true })

const cols  = responsive({ xs: 'grid-cols-1', sm: 'grid-cols-2', xl: 'grid-cols-4' })
const bg    = responsive({ xs: 'bg-rose-500', md: 'bg-amber-500', xl: 'bg-emerald-500' })
const label = responsive({ xs: 'Mobile', md: 'Medium', xl: 'X-Large' })
const size  = responsive({ xs: 12, md: 14, xl: 16 })  // number works too`}</Code>
    </Section>
  )
}

// ─── 4. Bootstrap ─────────────────────────────────────────────────────────────
function BootstrapDemo() {
  const { responsive, breakpoint } = useBreakpoint({ breakpoints: 'bootstrap', watchWindow: true })
  const col     = responsive('col')
  const colHalf = responsive('col-half')

  return (
    <Section title="Bootstrap Columns" badge="bootstrap preset" badgeColor="purple"
      desc={`Use breakpoints: 'bootstrap' for Bootstrap's grid system. Active: ${breakpoint}`}>

      <div className="rounded-2xl border border-gray-200 p-4 mb-3">
        <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">responsive('col') → <code className="text-purple-600">{col}</code></p>
        <div className="row g-3">
          {['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map(n => (
            <div key={n} className={col}>
              <div className="bg-indigo-600 text-white rounded-lg p-3 text-center text-sm font-semibold">{n}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-4">
        <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">responsive('col-half') → <code className="text-purple-600">{colHalf}</code></p>
        <div className="row g-3">
          {['Left', 'Right'].map(n => (
            <div key={n} className={colHalf}>
              <div className="bg-purple-600 text-white rounded-lg p-3 text-center text-sm font-semibold">{n}</div>
            </div>
          ))}
        </div>
      </div>

      <Code>{`const { responsive } = useBreakpoint({ breakpoints: 'bootstrap', watchWindow: true })

const col     = responsive('col')      // col-12 → col-6 → col-4 → col-3 → col-2
const colHalf = responsive('col-half') // col-12 → col-12 → col-6 → col-6

// currently: col="${col}", col-half="${colHalf}"`}</Code>
    </Section>
  )
}

// ─── 5. Range helpers ─────────────────────────────────────────────────────────
function RangeHelpers() {
  const { width, isAbove, isBelow, isBetween, breakpoint } = useBreakpoint({ watchWindow: true })

  const checks = [
    { label: "isAbove('sm')",        result: isAbove('sm'),        desc: 'width ≥ 640px' },
    { label: "isAbove('lg')",        result: isAbove('lg'),        desc: 'width ≥ 1024px' },
    { label: "isBelow('md')",        result: isBelow('md'),        desc: 'width < 768px' },
    { label: "isBetween('sm','xl')", result: isBetween('sm','xl'), desc: '640px ≤ width < 1280px' },
    { label: "isBelow('lg')",        result: isBelow('lg'),        desc: 'width < 1024px — tablet or smaller' },
  ]

  return (
    <Section title="Range Helpers" badge="isAbove / isBelow / isBetween"
      desc={`Precise range checks without hardcoding px values. Window: ${Math.round(width)}px (${breakpoint})`}>

      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        {checks.map(({ label, result, desc }) => (
          <div key={label}
            className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 transition-colors ${result ? 'bg-green-50' : 'bg-red-50'}`}>
            <div>
              <code className="text-sm font-semibold text-gray-800">{label}</code>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <span className={`ml-4 shrink-0 text-sm font-bold px-3 py-1 rounded-full ${result ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
              {String(result)}
            </span>
          </div>
        ))}
      </div>

      <Code>{`const { isAbove, isBelow, isBetween } = useBreakpoint({ watchWindow: true })

isAbove('sm')            // width >= 640    → ${isAbove('sm')}
isAbove('lg')            // width >= 1024   → ${isAbove('lg')}
isBelow('md')            // width < 768     → ${isBelow('md')}
isBetween('sm', 'xl')    // 640 ≤ w < 1280  → ${isBetween('sm', 'xl')}
isBelow('lg')            // width < 1024    → ${isBelow('lg')}`}</Code>
    </Section>
  )
}

// ─── 6. watchWindow ───────────────────────────────────────────────────────────
function WindowWatchDemo() {
  const { width, height, breakpoint, isMobile, isTablet, isDesktop, isLandscape, isPortrait } =
    useBreakpoint({ watchWindow: true, trackHeight: true })

  const active = BP_STOPS.find(b => b.name === breakpoint) ?? BP_STOPS[0]

  return (
    <Section title="watchWindow Mode" badge="no ref needed"
      desc="Track window.innerWidth / innerHeight instead of an element. No ref required — works anywhere in your component tree.">

      <div className="rounded-2xl bg-gray-950 text-white p-6">
        <div className="grid grid-cols-3 gap-4 text-center mb-5">
          <div>
            <div className="text-3xl font-black tabular-nums" style={{ color: active.color }}>{Math.round(width)}</div>
            <div className="text-xs opacity-50 uppercase tracking-widest mt-1">width</div>
          </div>
          <div>
            <div className="text-3xl font-black tabular-nums" style={{ color: active.color }}>{Math.round(height ?? 0)}</div>
            <div className="text-xs opacity-50 uppercase tracking-widest mt-1">height</div>
          </div>
          <div>
            <div className="text-3xl font-black" style={{ color: active.color }}>{breakpoint}</div>
            <div className="text-xs opacity-50 uppercase tracking-widest mt-1">breakpoint</div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {[['isMobile', isMobile], ['isTablet', isTablet], ['isDesktop', isDesktop],
            ['isLandscape', isLandscape], ['isPortrait', isPortrait]].map(([k, v]) => (
            <span key={k}
              className={`text-xs px-3 py-1 rounded-full font-mono ${v ? 'bg-white text-gray-900 font-bold' : 'bg-white/10 text-white/40'}`}>
              {k}
            </span>
          ))}
        </div>
        <BreakpointRuler width={width} />
      </div>

      <Code>{`// No ref — pass watchWindow: true, works in any component
const { width, height, breakpoint, isMobile, isTablet, isDesktop } =
  useBreakpoint({ watchWindow: true, trackHeight: true })

// currently: ${Math.round(width)}×${Math.round(height ?? 0)}px · ${breakpoint}`}</Code>
    </Section>
  )
}

// ─── 7. <Responsive> component ────────────────────────────────────────────────
function ResponsiveComponentDemo() {
  return (
    <Section title="<Responsive> Component" badge="render-prop" badgeColor="purple"
      desc="Prefer JSX-only patterns? <Responsive> accepts all the same options as props and passes the full resize object to children as a render function.">

      <Responsive className="rounded-2xl border-2 border-dashed border-purple-200 p-4">
        {({ responsive, breakpoint, width, isMobile, isTablet }) => (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-sm text-gray-500">Element: <strong>{Math.round(width)}px</strong></span>
              <Badge color="purple">{breakpoint}</Badge>
              {isMobile  && <Badge color="orange">mobile</Badge>}
              {isTablet  && <Badge color="indigo">tablet</Badge>}
            </div>
            <div className={`grid ${responsive('grid-cols')} ${responsive('gap')}`}>
              {['🐟', '🐠', '🐡', '🦈', '🐬', '🐳'].map(emoji => (
                <div key={emoji} className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center text-2xl">
                  {emoji}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">
              grid: <code>{responsive('grid-cols')}</code> · gap: <code>{responsive('gap')}</code>
            </p>
          </div>
        )}
      </Responsive>

      <Code>{`import { Responsive } from '@codefish24/use-breakpoint'

// All useBreakpoint options work as props
<Responsive breakpoints="tailwind" className="...">
  {({ responsive, breakpoint, width, isMobile }) => (
    <div className={\`grid \${responsive('grid-cols')} \${responsive('gap')}\`}>
      …
    </div>
  )}
</Responsive>`}</Code>
    </Section>
  )
}

// ─── 8. All presets table ─────────────────────────────────────────────────────
function PresetTable() {
  const { responsive, breakpoint, width } = useBreakpoint({ watchWindow: true })

  return (
    <Section title="All Built-in Presets" badge="reference"
      desc={`Every preset and its value at the current window breakpoint (${breakpoint} · ${Math.round(width)}px).`}>

      <div className="rounded-2xl border border-gray-200 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Preset string</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">All values</th>
              <th className="text-left px-4 py-3 font-semibold text-emerald-600 whitespace-nowrap">Now ({breakpoint})</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(RESPONSIVE_PRESETS).map(([key, map], i) => {
              const val = responsive(key)
              return (
                <tr key={key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-mono text-indigo-600 whitespace-nowrap">'{key}'</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                      {Object.entries(map).map(([bp, v]) => (
                        <span key={bp} className={bp === breakpoint ? 'font-bold text-gray-900' : ''}>
                          <span className="opacity-50">{bp}:</span>{v}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600 whitespace-nowrap">{val}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Code>{`import { RESPONSIVE_PRESETS } from '@codefish24/use-breakpoint'

// Add your own global preset once, use everywhere
RESPONSIVE_PRESETS['icon']   = { xs: 'w-4 h-4',   sm: 'w-5 h-5',   lg: 'w-6 h-6' }
RESPONSIVE_PRESETS['avatar'] = { xs: 'w-8 h-8',   md: 'w-10 h-10', xl: 'w-12 h-12' }
RESPONSIVE_PRESETS['cols5']  = { xs: 'grid-cols-1', sm: 'grid-cols-2', lg: 'grid-cols-5' }`}</Code>
    </Section>
  )
}

// ─── App shell ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'autopreset',  label: 'autoPreset',       icon: '🚀' },
  { id: 'typography',  label: 'Typography',      icon: '📝' },
  { id: 'spacing',     label: 'Spacing',         icon: '📐' },
  { id: 'responsive',  label: 'responsive()',    icon: '⚡' },
  { id: 'custom',      label: 'Custom Map',      icon: '🗺️' },
  { id: 'bootstrap',   label: 'Bootstrap',       icon: '🅱️' },
  { id: 'range',       label: 'Range Helpers',   icon: '📏' },
  { id: 'window',      label: 'watchWindow',     icon: '🖥️' },
  { id: 'component',   label: '<Responsive>',    icon: '🧩' },
  { id: 'presets',     label: 'All Presets',     icon: '📋' },
]

// ─── 0. autoPreset Demo ───────────────────────────────────────────────────────
function AutoPresetDemo() {
  const { ref, breakpoint, width } = useBreakpoint({ autoPreset: true })

  const items = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']

  return (
    <Section title="🚀 autoPreset — Zero Config" badge="Recommended" badgeColor="green"
      desc={`The simplest approach! Just { autoPreset: true }, no need to call responsive() manually. Current: ${breakpoint} (${Math.round(width)}px)`}>

      <div
        ref={ref}
        className="grid rounded-2xl border-2 border-dashed border-green-300 bg-green-50"
        style={{ resize: 'horizontal', minWidth: 200, maxWidth: '100%', overflow: 'hidden' }}
      >
        {items.map(item => (
          <div key={item}
            className="bg-green-600 text-white rounded-xl py-4 text-center text-sm font-semibold m-1">
            {item}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">← Drag right edge to resize →</p>

      <Code>{`// ✅ Simplest — zero config
const { ref } = useBreakpoint({ autoPreset: true })

// Just an empty grid container
<div ref={ref} className="grid">
  {items.map(item => <Card key={item}>{item}</Card>)}
</div>

// Auto-applied classes:
// xs → grid-cols-1 gap-2 p-2
// sm → grid-cols-2 gap-4 p-4
// md → grid-cols-3 gap-4 p-6
// lg → grid-cols-4 gap-6 p-8
// xl → grid-cols-6 gap-8 p-10`}</Code>

      <div className="mt-4 p-4 bg-gray-100 rounded-xl">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Customize preset scope:</h4>
        <div className="flex flex-wrap gap-2">
          <code className="text-xs bg-white px-2 py-1 rounded">autoPreset: ['grid-cols', 'gap']</code>
          <code className="text-xs bg-white px-2 py-1 rounded">autoPreset: ['p', 'px', 'py']</code>
          <code className="text-xs bg-white px-2 py-1 rounded">autoPreset: ['text', 'heading']</code>
        </div>
      </div>
    </Section>
  )
}

// ─── Typography Demo ─────────────────────────────────────────────────────────
function TypographyDemo() {
  const { ref, responsive, breakpoint, width } = useBreakpoint()

  return (
    <Section title="📝 Typography — Headings & Text" badge="text & heading"
      desc={`Responsive font sizes for h1, h2, h3, p, etc. Current: ${breakpoint} (${Math.round(width)}px)`}>

      <div ref={ref} className="rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50 p-4"
        style={{ resize: 'horizontal', minWidth: 200, maxWidth: '100%', overflow: 'hidden' }}>

        {/* H1 - Heading */}
        <h1 className={`font-black text-purple-900 mb-2 ${responsive('heading')}`}>
          H1 Heading — {responsive('heading')}
        </h1>

        {/* H2 */}
        <h2 className={`font-bold text-purple-800 mb-2 ${responsive({ xs: 'text-lg', sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl', xl: 'text-4xl' })}`}>
          H2 Subheading — responsive map
        </h2>

        {/* H3 */}
        <h3 className={`font-semibold text-purple-700 mb-3 ${responsive({ xs: 'text-base', sm: 'text-lg', md: 'text-xl', lg: 'text-2xl', xl: 'text-2xl' })}`}>
          H3 Section Title
        </h3>

        {/* Paragraph */}
        <p className={`text-gray-700 mb-4 ${responsive('text')}`}>
          This is a paragraph with responsive text size. The font automatically adjusts
          based on the container width. Perfect for readable content that needs to work
          across all device sizes.
        </p>

        {/* Small text */}
        <p className={`text-gray-500 ${responsive({ xs: 'text-xs', sm: 'text-sm', md: 'text-sm', lg: 'text-base', xl: 'text-base' })}`}>
          Small text / caption — adjusts for different contexts
        </p>
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">← Drag right edge to resize →</p>

      <Code>{`const { ref, responsive } = useBreakpoint()

// H1 - Use 'heading' preset
<h1 className={responsive('heading')}>
  H1 Heading
</h1>

// H2 - Custom responsive map
<h2 className={responsive({
  xs: 'text-lg',
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl'
})}>
  H2 Subheading
</h2>

// Paragraph - Use 'text' preset
<p className={responsive('text')}>
  Body text...
</p>`}</Code>

      {/* Typography Table */}
      <div className="mt-6 rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Element</th>
              <th className="text-left px-4 py-3 font-semibold">Preset</th>
              <th className="text-left px-4 py-3 font-semibold">xs</th>
              <th className="text-left px-4 py-3 font-semibold">sm</th>
              <th className="text-left px-4 py-3 font-semibold">md</th>
              <th className="text-left px-4 py-3 font-semibold">lg</th>
              <th className="text-left px-4 py-3 font-semibold">xl</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100">
              <td className="px-4 py-2 font-medium">H1</td>
              <td className="px-4 py-2"><code className="text-purple-600">'heading'</code></td>
              <td className="px-4 py-2">text-xl</td>
              <td className="px-4 py-2">text-2xl</td>
              <td className="px-4 py-2">text-3xl</td>
              <td className="px-4 py-2">text-4xl</td>
              <td className="px-4 py-2">text-5xl</td>
            </tr>
            <tr className="border-t border-gray-100 bg-gray-50">
              <td className="px-4 py-2 font-medium">Body</td>
              <td className="px-4 py-2"><code className="text-purple-600">'text'</code></td>
              <td className="px-4 py-2">text-sm</td>
              <td className="px-4 py-2">text-base</td>
              <td className="px-4 py-2">text-base</td>
              <td className="px-4 py-2">text-lg</td>
              <td className="px-4 py-2">text-xl</td>
            </tr>
            <tr className="border-t border-gray-100">
              <td className="px-4 py-2 font-medium">Custom</td>
              <td className="px-4 py-2"><code className="text-purple-600">{'{ xs: ..., xl: ... }'}</code></td>
              <td className="px-4 py-2" colSpan={5}>Any custom values you need</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  )
}

// ─── Spacing Demo ────────────────────────────────────────────────────────────
function SpacingDemo() {
  const { ref, responsive, breakpoint, width } = useBreakpoint()

  return (
    <Section title="📐 Spacing — Padding, Margin, Gap" badge="p / m / gap"
      desc={`Responsive spacing for containers, sections, and grids. Current: ${breakpoint} (${Math.round(width)}px)`}>

      <div ref={ref}
        className={`rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 ${responsive('p')}`}
        style={{ resize: 'horizontal', minWidth: 200, maxWidth: '100%', overflow: 'hidden' }}>

        <div className="mb-4">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            Container with responsive padding: {responsive('p')}
          </span>
        </div>

        {/* Padding demo */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Padding</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className={`bg-blue-200 rounded ${responsive('p')}`}>
              <span className="text-xs text-blue-800">{responsive('p')}</span>
            </div>
            <div className={`bg-blue-300 rounded ${responsive('px')}`}>
              <span className="text-xs text-blue-800">{responsive('px')}</span>
            </div>
            <div className={`bg-blue-400 rounded ${responsive('py')}`}>
              <span className="text-xs text-white">{responsive('py')}</span>
            </div>
          </div>
        </div>

        {/* Margin demo */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Margin</h4>
          <div className="bg-gray-200 rounded p-1">
            <div className={`bg-blue-500 text-white text-xs text-center rounded ${responsive('m')}`}>
              {responsive('m')}
            </div>
          </div>
        </div>

        {/* Gap demo */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Gap</h4>
          <div className={`grid grid-cols-3 ${responsive('gap')}`}>
            <div className="bg-blue-400 text-white text-xs text-center py-2 rounded">1</div>
            <div className="bg-blue-500 text-white text-xs text-center py-2 rounded">2</div>
            <div className="bg-blue-600 text-white text-xs text-center py-2 rounded">3</div>
          </div>
          <span className="text-xs text-blue-600">{responsive('gap')}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">← Drag right edge to resize →</p>

      <Code>{`const { ref, responsive } = useBreakpoint()

// Padding
<div className={responsive('p')}>...</div>     // all sides
<div className={responsive('px')}>...</div>    // horizontal
<div className={responsive('py')}>...</div>    // vertical

// Margin
<div className={responsive('m')}>...</div>
<div className={responsive('mx')}>...</div>    // horizontal (useful for centering)
<div className={responsive('my')}>...</div>

// Gap
<div className={\`grid \${responsive('gap')}\`}>...</div>`}</Code>

      {/* Spacing Table */}
      <div className="mt-6 rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Preset</th>
              <th className="text-left px-4 py-3 font-semibold">xs</th>
              <th className="text-left px-4 py-3 font-semibold">sm</th>
              <th className="text-left px-4 py-3 font-semibold">md</th>
              <th className="text-left px-4 py-3 font-semibold">lg</th>
              <th className="text-left px-4 py-3 font-semibold">xl</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100">
              <td className="px-4 py-2"><code className="text-blue-600">'p'</code></td>
              <td className="px-4 py-2">p-2</td>
              <td className="px-4 py-2">p-4</td>
              <td className="px-4 py-2">p-6</td>
              <td className="px-4 py-2">p-8</td>
              <td className="px-4 py-2">p-10</td>
            </tr>
            <tr className="border-t border-gray-100 bg-gray-50">
              <td className="px-4 py-2"><code className="text-blue-600">'px'</code></td>
              <td className="px-4 py-2">px-2</td>
              <td className="px-4 py-2">px-4</td>
              <td className="px-4 py-2">px-6</td>
              <td className="px-4 py-2">px-8</td>
              <td className="px-4 py-2">px-10</td>
            </tr>
            <tr className="border-t border-gray-100">
              <td className="px-4 py-2"><code className="text-blue-600">'py'</code></td>
              <td className="px-4 py-2">py-2</td>
              <td className="px-4 py-2">py-4</td>
              <td className="px-4 py-2">py-6</td>
              <td className="px-4 py-2">py-8</td>
              <td className="px-4 py-2">py-10</td>
            </tr>
            <tr className="border-t border-gray-100 bg-gray-50">
              <td className="px-4 py-2"><code className="text-blue-600">'m'</code></td>
              <td className="px-4 py-2">m-2</td>
              <td className="px-4 py-2">m-4</td>
              <td className="px-4 py-2">m-6</td>
              <td className="px-4 py-2">m-8</td>
              <td className="px-4 py-2">m-10</td>
            </tr>
            <tr className="border-t border-gray-100">
              <td className="px-4 py-2"><code className="text-blue-600">'gap'</code></td>
              <td className="px-4 py-2">gap-2</td>
              <td className="px-4 py-2">gap-4</td>
              <td className="px-4 py-2">gap-4</td>
              <td className="px-4 py-2">gap-6</td>
              <td className="px-4 py-2">gap-8</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('autopreset')

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <header style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        className="text-white py-12 px-4 text-center">
        <div className="text-5xl mb-3">🐟</div>
        <h1 className="text-4xl font-black mb-2 tracking-tight">use-breakpoint</h1>
        <p className="text-base opacity-75 mb-6">Smart breakpoint hook for React · Tailwind · Bootstrap · any breakpoint system</p>
        <code className="inline-block bg-black/25 backdrop-blur px-5 py-2 rounded-xl text-sm font-mono">
          npm install @codefish24/use-breakpoint
        </code>
      </header>

      {/* Sticky live stats */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 pt-4">
          <LiveStats />
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-2 flex gap-0.5 overflow-x-auto scrollbar-none">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'autopreset'  && <AutoPresetDemo />}
        {activeTab === 'typography'  && <TypographyDemo />}
        {activeTab === 'spacing'     && <SpacingDemo />}
        {activeTab === 'responsive'  && <ResponsivePresetDemo />}
        {activeTab === 'custom'      && <CustomMapDemo />}
        {activeTab === 'bootstrap'   && <BootstrapDemo />}
        {activeTab === 'range'       && <RangeHelpers />}
        {activeTab === 'window'      && <WindowWatchDemo />}
        {activeTab === 'component'   && <ResponsiveComponentDemo />}
        {activeTab === 'presets'     && <PresetTable />}
      </main>

      <footer className="text-center text-xs text-gray-400 py-8 border-t border-gray-200">
        @codefish24/use-breakpoint · MIT License
      </footer>
    </div>
  )
}

