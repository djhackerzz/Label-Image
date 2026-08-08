'use client'

import { RotateCcw, X } from 'lucide-react'
import type { LabelStyle } from './anatomy-labeler'
import { DEFAULT_LABEL_STYLE } from './anatomy-labeler'

interface LabelStyleSettingsProps {
  style: LabelStyle
  onChange: (style: LabelStyle) => void
  onClose: () => void
  bottomSpaceRatio: number
  onBottomSpaceRatioChange: (value: number) => void
}

const fontSizes = [9, 10, 11, 12, 13, 14, 16, 18]
const arrowWidths = [1, 1.5, 2, 3, 4]
const bottomSpaceOptions = [0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4]

export function LabelStyleSettings({
  style,
  onChange,
  onClose,
  bottomSpaceRatio,
  onBottomSpaceRatioChange,
}: LabelStyleSettingsProps) {
  const update = <K extends keyof LabelStyle>(key: K, value: LabelStyle[K]) => {
    onChange({ ...style, [key]: value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/45 p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="flex max-h-[min(720px,calc(100vh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-primary">Workspace settings</p>
            <h2 id="settings-title" className="mt-1 text-base font-semibold text-foreground">Label appearance</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">These defaults apply to every current and future specimen.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close settings" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <section className="rounded-xl border border-border bg-background/35 p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Description text</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-xs text-muted-foreground">
                Font color
                <span className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
                  <input type="color" value={style.textColor} onChange={(e) => update('textColor', e.target.value)} className="size-7 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Description font color" />
                  <span className="font-mono text-[11px] text-foreground">{style.textColor}</span>
                </span>
              </label>
              <label className="flex flex-col gap-2 text-xs text-muted-foreground">
                Font size
                <select value={style.fontSize} onChange={(e) => update('fontSize', Number(e.target.value))} className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" aria-label="Description font size">
                  {fontSizes.map((size) => <option key={size} value={size}>{size}px</option>)}
                </select>
              </label>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => update('bold', !style.bold)} aria-pressed={style.bold} className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${style.bold ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>Bold</button>
              <button type="button" onClick={() => update('italic', !style.italic)} aria-pressed={style.italic} className={`rounded-lg border px-3 py-2 text-sm italic transition-colors ${style.italic ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>Italic</button>
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-border bg-background/35 p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Number badges</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-xs text-muted-foreground">
                Number color
                <span className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
                  <input type="color" value={style.numberColor} onChange={(e) => update('numberColor', e.target.value)} className="size-7 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Number font color" />
                  <span className="font-mono text-[11px] text-foreground">{style.numberColor}</span>
                </span>
              </label>
              <label className="flex flex-col gap-2 text-xs text-muted-foreground">
                Number size
                <select value={style.numberFontSize} onChange={(e) => update('numberFontSize', Number(e.target.value))} className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" aria-label="Number font size">
                  {fontSizes.map((size) => <option key={size} value={size}>{size}px</option>)}
                </select>
              </label>
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-border bg-background/35 p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Leader arrows</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-xs text-muted-foreground">
                Arrow color
                <span className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
                  <input type="color" value={style.arrowColor} onChange={(e) => update('arrowColor', e.target.value)} className="size-7 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Arrow color" />
                  <span className="font-mono text-[11px] text-foreground">{style.arrowColor}</span>
                </span>
              </label>
              <label className="flex flex-col gap-2 text-xs text-muted-foreground">
                Thickness
                <select value={style.arrowThickness} onChange={(e) => update('arrowThickness', Number(e.target.value))} className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" aria-label="Arrow thickness">
                  {arrowWidths.map((width) => <option key={width} value={width}>{width}px</option>)}
                </select>
              </label>
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-border bg-background/35 p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Canvas space</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-xs text-muted-foreground">
                Space below photo
                <select value={bottomSpaceRatio} onChange={(e) => onBottomSpaceRatioChange(Number(e.target.value))} className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" aria-label="Space below photo">
                  {bottomSpaceOptions.map((ratio) => <option key={ratio} value={ratio}>{Math.round(ratio * 100)}%</option>)}
                </select>
              </label>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/70">
              Adds a Key area beneath the photo so label descriptions can be written when the specimen itself has no room.
            </p>
          </section>
        </div>

        <footer className="flex items-center justify-between border-t border-border px-5 py-4">
          <button type="button" onClick={() => onChange(DEFAULT_LABEL_STYLE)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <RotateCcw size={13} /> Reset defaults
          </button>
          <button type="button" onClick={onClose} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90">Done</button>
        </footer>
      </div>
    </div>
  )
}
