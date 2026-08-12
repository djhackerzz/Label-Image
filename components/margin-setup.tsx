'use client'

import { useState } from 'react'
import { Scan } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LabelingCanvas } from './labeling-canvas'
import type { LabelStyle, Pin } from './anatomy-labeler'

interface MarginSetupModalProps {
  imageSrc: string
  imageAlt: string
  labelStyle: LabelStyle
  initialRatio: number
  onConfirm: (ratio: number) => void
}

const marginOptions = [0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4]

export function MarginSetupModal({
  imageSrc,
  imageAlt,
  labelStyle,
  initialRatio,
  onConfirm,
}: MarginSetupModalProps) {
  const [ratio, setRatio] = useState(initialRatio)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="margin-setup-title"
    >
      <div className="flex max-h-[min(720px,calc(100vh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
            <Scan size={16} className="text-primary" />
          </div>
          <div>
            <h2 id="margin-setup-title" className="text-base font-semibold text-foreground">
              Set up canvas margin
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Choose the space below the photo before you start labelling
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Adding margin after labels are placed can shift your layout and misalign the badges.
            Pick the amount of space you want now so your labels stay exactly where you put them.
            You can still change it later in Settings.
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-[#050608] p-4">
            <LabelingCanvas
              imageSrc={imageSrc}
              imageAlt={imageAlt}
              pins={[]}
              mode="view"
              selectedPinId={null}
              onAddPin={() => {}}
              onMoveBadge={() => {}}
              onSelectPin={() => {}}
              labelStyle={labelStyle}
              bottomSpaceRatio={ratio}
              readOnly
            />
          </div>

          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Space below photo
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {marginOptions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRatio(r)}
                  aria-pressed={ratio === r}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    ratio === r
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  {Math.round(r * 100)}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between border-t border-border px-5 py-4">
          <p className="text-[11px] text-muted-foreground/70">
            The Key panel below the photo grows as you name labels.
          </p>
          <button
            type="button"
            onClick={() => onConfirm(ratio)}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start labelling
          </button>
        </footer>
      </div>
    </div>
  )
}
