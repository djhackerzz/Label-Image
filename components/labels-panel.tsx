'use client'

import { useEffect, useRef } from 'react'
import { Trash2, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LabelStyle, Pin as PinType } from './anatomy-labeler'

interface LabelsPanelProps {
  pins: PinType[]
  organName: string
  onOrganNameChange: (name: string) => void
  onUpdateLabel: (id: string, label: string) => void
  onDeletePin: (id: string) => void
  selectedPinId: string | null
  onSelectPin: (id: string | null) => void
  labelStyle: LabelStyle
  onLabelStyleChange: (style: LabelStyle) => void
}

export function LabelsPanel({
  pins,
  organName,
  onOrganNameChange,
  onUpdateLabel,
  onDeletePin,
  selectedPinId,
  onSelectPin,
  labelStyle,
  onLabelStyleChange,
}: LabelsPanelProps) {
  const selectedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedPinId])

  const labeledCount = pins.filter((p) => p.label.trim()).length

  return (
    <aside className="w-72 xl:w-80 flex flex-col border-l border-border bg-card shrink-0 overflow-hidden">
      {/* Specimen title */}
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <label
          htmlFor="organ-name"
          className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5"
        >
          Specimen Title
        </label>
        <input
          id="organ-name"
          type="text"
          value={organName}
          onChange={(e) => onOrganNameChange(e.target.value)}
          className="w-full bg-transparent text-foreground font-semibold text-sm focus:outline-none border-b border-transparent focus:border-primary pb-0.5 transition-colors placeholder:text-muted-foreground/40"
          placeholder="e.g. Heart — Internal Anatomy"
        />
      </div>

      {/* Status bar */}
      <div className="px-5 py-2 border-b border-border flex items-center justify-between shrink-0">
        <span className="text-xs text-muted-foreground">
          <span className="text-foreground font-semibold">{pins.length}</span>{' '}
          {pins.length === 1 ? 'label' : 'labels'}
          {pins.length > 0 && labeledCount < pins.length && (
            <span className="text-muted-foreground/50 ml-1">
              ({pins.length - labeledCount} unnamed)
            </span>
          )}
        </span>
        {pins.length > 0 && (
          <span className="text-[10px] text-muted-foreground/50">
            Click badge to select
          </span>
        )}
      </div>

      {/* Shared label style controls */}
      <div className="px-4 py-3 border-b border-border bg-muted/20 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Label Style</p>
          <span className="text-[10px] text-muted-foreground/50">Applies to all labels</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2 py-1.5 text-[11px] text-muted-foreground">
            <input
              type="color"
              value={labelStyle.textColor}
              onChange={(e) => onLabelStyleChange({ ...labelStyle, textColor: e.target.value })}
              className="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Label font color"
            />
            <span>Font color</span>
          </label>
          <label className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2 py-1.5 text-[11px] text-muted-foreground">
            <input
              type="color"
              value={labelStyle.arrowColor}
              onChange={(e) => onLabelStyleChange({ ...labelStyle, arrowColor: e.target.value })}
              className="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Arrow color"
            />
            <span>Arrow color</span>
          </label>
          <label className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/40 px-2 py-1.5 text-[11px] text-muted-foreground">
            <span>Font size</span>
            <select
              value={labelStyle.fontSize}
              onChange={(e) => onLabelStyleChange({ ...labelStyle, fontSize: Number(e.target.value) })}
              className="bg-transparent text-foreground outline-none"
              aria-label="Label font size"
            >
              {[9, 10, 11, 12, 14, 16, 18].map((size) => <option key={size} value={size}>{size}px</option>)}
            </select>
          </label>
          <label className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/40 px-2 py-1.5 text-[11px] text-muted-foreground">
            <span>Arrow width</span>
            <select
              value={labelStyle.arrowThickness}
              onChange={(e) => onLabelStyleChange({ ...labelStyle, arrowThickness: Number(e.target.value) })}
              className="bg-transparent text-foreground outline-none"
              aria-label="Arrow thickness"
            >
              {[1, 1.5, 2, 3, 4].map((width) => <option key={width} value={width}>{width}px</option>)}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => onLabelStyleChange({ ...labelStyle, bold: !labelStyle.bold })}
            aria-pressed={labelStyle.bold}
            className={cn('rounded-md border px-2.5 py-1 text-xs font-bold transition-colors', labelStyle.bold ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => onLabelStyleChange({ ...labelStyle, italic: !labelStyle.italic })}
            aria-pressed={labelStyle.italic}
            className={cn('rounded-md border px-2.5 py-1 text-xs italic transition-colors', labelStyle.italic ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}
          >
            I
          </button>
          <span className="text-[10px] text-muted-foreground/50">Defaults stay active for new images</span>
        </div>
      </div>

      {/* Labels list */}
      <div className="flex-1 overflow-y-auto" role="list" aria-label="Anatomy labels">
        {pins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12 text-muted-foreground gap-3">
            <div className="w-11 h-11 rounded-full border border-border flex items-center justify-center">
              <Pin size={18} className="opacity-30" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60">No labels yet</p>
              <p className="text-xs mt-1.5 leading-relaxed text-muted-foreground/70">
                Make sure <span className="text-primary font-medium">Pin Mode</span> is active,
                then click anywhere on the image to drop a numbered label
              </p>
            </div>
          </div>
        ) : (
          <div className="py-1">
            {pins.map((pin) => (
              <div
                key={pin.id}
                ref={selectedPinId === pin.id ? selectedRef : undefined}
                role="listitem"
                className={cn(
                  'flex items-start gap-3 px-4 py-2.5 group transition-colors cursor-pointer',
                  selectedPinId === pin.id
                    ? 'bg-primary/10 border-l-2 border-primary'
                    : 'hover:bg-muted/40 border-l-2 border-transparent',
                )}
                onClick={() => onSelectPin(pin.id === selectedPinId ? null : pin.id)}
              >
                {/* Number badge */}
                <div
                  className={cn(
                    'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5 transition-all',
                    selectedPinId === pin.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/20',
                  )}
                  aria-hidden="true"
                >
                  {pin.number}
                </div>

                {/* Label text input */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={pin.label}
                    onChange={(e) => onUpdateLabel(pin.id, e.target.value)}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectPin(pin.id)
                    }}
                    placeholder={`Structure ${pin.number}…`}
                    className="w-full bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/35 leading-relaxed"
                    aria-label={`Label for structure ${pin.number}`}
                  />
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeletePin(pin.id)
                  }}
                  className={cn(
                    'shrink-0 p-1 rounded text-muted-foreground transition-all',
                    'opacity-0 group-hover:opacity-100 focus:opacity-100',
                    'hover:text-destructive focus:outline-none focus:ring-1 focus:ring-destructive',
                  )}
                  aria-label={`Remove label ${pin.number}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend preview footer */}
      {labeledCount > 0 && (
        <div className="px-5 py-4 border-t border-border shrink-0 bg-card">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2.5">
            Legend Preview
          </p>
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {pins
              .filter((p) => p.label.trim())
              .map((p) => (
                <p key={p.id} className="text-xs text-muted-foreground leading-5 flex gap-2">
                  <span
                    className="shrink-0 w-5 text-right"
                    style={{
                      color: labelStyle.textColor,
                      fontSize: `${labelStyle.fontSize}px`,
                      fontWeight: labelStyle.bold ? 700 : 400,
                      fontStyle: labelStyle.italic ? 'italic' : 'normal',
                    }}
                  >
                    {p.number}.
                  </span>
                  <span
                    className="truncate"
                    style={{
                      color: labelStyle.textColor,
                      fontSize: `${labelStyle.fontSize}px`,
                      fontWeight: labelStyle.bold ? 700 : 400,
                      fontStyle: labelStyle.italic ? 'italic' : 'normal',
                    }}
                  >
                    {p.label}
                  </span>
                </p>
              ))}
          </div>
        </div>
      )}
    </aside>
  )
}
