'use client'

import { useEffect, useRef } from 'react'
import { Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Pin } from './anatomy-labeler'

interface LabelsPanelProps {
  pins: Pin[]
  organName: string
  onOrganNameChange: (name: string) => void
  onUpdateLabel: (id: string, label: string) => void
  onDeletePin: (id: string) => void
  selectedPinId: string | null
  onSelectPin: (id: string | null) => void
}

export function LabelsPanel({
  pins,
  organName,
  onOrganNameChange,
  onUpdateLabel,
  onDeletePin,
  selectedPinId,
  onSelectPin,
}: LabelsPanelProps) {
  const selectedRef = useRef<HTMLDivElement>(null)

  // Scroll selected pin into view in the list
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedPinId])

  return (
    <aside className="w-80 flex flex-col border-l border-border bg-card shrink-0 overflow-hidden">
      {/* Specimen title */}
      <div className="px-5 py-4 border-b border-border">
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
          <span className="text-foreground font-medium">{pins.length}</span>{' '}
          {pins.length === 1 ? 'label' : 'labels'}
        </span>
        <span className="text-[10px] text-muted-foreground/60 hidden sm:block">
          Drag badge to reposition
        </span>
      </div>

      {/* Labels list */}
      <div className="flex-1 overflow-y-auto" role="list" aria-label="Anatomy labels">
        {pins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground gap-3">
            <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
              <GripVertical size={20} className="opacity-40" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60">No labels yet</p>
              <p className="text-xs mt-1 leading-relaxed">
                Switch to <span className="text-primary">Pin Mode</span> and click anywhere on the
                image to place a numbered label
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pins.map((pin) => (
              <div
                key={pin.id}
                ref={selectedPinId === pin.id ? selectedRef : undefined}
                role="listitem"
                className={cn(
                  'flex items-start gap-3 px-4 py-3 group transition-colors cursor-pointer',
                  selectedPinId === pin.id
                    ? 'bg-primary/10'
                    : 'hover:bg-muted/50',
                )}
                onClick={() => onSelectPin(pin.id === selectedPinId ? null : pin.id)}
              >
                {/* Number badge */}
                <div
                  className={cn(
                    'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 transition-colors',
                    selectedPinId === pin.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
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
                    placeholder={`Structure ${pin.number}`}
                    className="w-full bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/40 leading-relaxed"
                    aria-label={`Label for structure ${pin.number}`}
                  />
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeletePin(pin.id)
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-destructive"
                  aria-label={`Remove label ${pin.number}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Print legend footer */}
      {pins.some((p) => p.label) && (
        <div className="px-5 py-3 border-t border-border shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Legend Preview
          </p>
          <div className="grid grid-cols-1 gap-0.5">
            {pins
              .filter((p) => p.label)
              .map((p) => (
                <p key={p.id} className="text-xs text-muted-foreground leading-5">
                  <span className="text-foreground font-semibold mr-1">{p.number}.</span>
                  {p.label}
                </p>
              ))}
          </div>
        </div>
      )}
    </aside>
  )
}
