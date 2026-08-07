'use client'

import { useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { Pin } from './anatomy-labeler'

interface LabelingCanvasProps {
  imageSrc: string
  imageAlt: string
  pins: Pin[]
  mode: 'add' | 'view'
  selectedPinId: string | null
  onAddPin: (params: { x: number; y: number; badgeX: number; badgeY: number }) => void
  onMoveBadge: (id: string, x: number, y: number) => void
  onSelectPin: (id: string | null) => void
  readOnly?: boolean
}

// ── Draggable numbered badge ────────────────────────────────────────────────
function DraggableBadge({
  pin,
  getContainerRect,
  onMove,
  onSelect,
  selected,
  readOnly,
}: {
  pin: Pin
  getContainerRect: () => DOMRect | null
  onMove: (id: string, x: number, y: number) => void
  onSelect: () => void
  selected: boolean
  readOnly?: boolean
}) {
  const hasMoved = useRef(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    hasMoved.current = false

    const startX = e.clientX
    const startY = e.clientY

    const onMouseMove = (me: MouseEvent) => {
      if (
        !hasMoved.current &&
        (Math.abs(me.clientX - startX) > 4 || Math.abs(me.clientY - startY) > 4)
      ) {
        hasMoved.current = true
      }
      if (!hasMoved.current || readOnly) return
      const rect = getContainerRect()
      if (!rect) return
      const x = Math.max(3, Math.min(97, ((me.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(3, Math.min(97, ((me.clientY - rect.top) / rect.height) * 100))
      onMove(pin.id, x, y)
    }

    const onMouseUp = () => {
      if (!hasMoved.current) onSelect()
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div
      style={{
        left: `${pin.badgeX}%`,
        top: `${pin.badgeY}%`,
        transform: 'translate(-50%, -50%)',
      }}
      className={cn(
        'absolute z-10 flex items-center justify-center w-7 h-7 rounded-full',
        'text-xs font-bold select-none transition-shadow',
        'bg-white text-gray-900 shadow-[0_0_0_1.5px_rgba(255,255,255,0.4)]',
        !readOnly && 'cursor-move hover:shadow-[0_0_0_2px_oklch(0.68_0.14_196)]',
        selected && 'shadow-[0_0_0_2px_oklch(0.68_0.14_196),0_0_12px_oklch(0.68_0.14_196/0.5)]',
      )}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
      role="button"
      aria-label={`Label ${pin.number}: ${pin.label || 'unlabeled'}`}
    >
      {pin.number}
    </div>
  )
}

// ── Main canvas ─────────────────────────────────────────────────────────────
export function LabelingCanvas({
  imageSrc,
  imageAlt,
  pins,
  mode,
  selectedPinId,
  onAddPin,
  onMoveBadge,
  onSelectPin,
  readOnly = false,
}: LabelingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const getContainerRect = useCallback(
    () => containerRef.current?.getBoundingClientRect() ?? null,
    [],
  )

  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (readOnly || mode !== 'add') return
      const rect = getContainerRect()
      if (!rect) return
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      // Auto-place badge: offset away from pin, respect image edges
      const isRightHalf = x > 50
      const badgeX = isRightHalf
        ? Math.max(8, x - 17)
        : Math.min(92, x + 17)
      const badgeY = Math.max(5, Math.min(95, y - 3))

      onAddPin({ x, y, badgeX, badgeY })
    },
    [readOnly, mode, onAddPin, getContainerRect],
  )

  const handleBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'IMG') {
      onSelectPin(null)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative inline-block',
        !readOnly && mode === 'add' && 'cursor-crosshair',
        !readOnly && mode === 'view' && 'cursor-default',
      )}
      onClick={(e) => {
        handleContainerClick(e)
        handleBgClick(e)
      }}
    >
      {/* Specimen image */}
      <img
        src={imageSrc}
        alt={imageAlt}
        className="block max-w-full"
        style={{ maxHeight: readOnly ? '65vh' : 'calc(100vh - 112px)' }}
        draggable={false}
      />

      {/* SVG leader lines + pin dots */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        {pins.map((pin) => (
          <g key={pin.id}>
            {/* Leader line from badge center to pin dot */}
            <line
              x1={`${pin.badgeX}%`}
              y1={`${pin.badgeY}%`}
              x2={`${pin.x}%`}
              y2={`${pin.y}%`}
              stroke="white"
              strokeWidth="1"
              strokeOpacity={selectedPinId === pin.id ? 1 : 0.75}
            />
            {/* Pin dot at structure point */}
            <circle
              cx={`${pin.x}%`}
              cy={`${pin.y}%`}
              r="2.5"
              fill="white"
              opacity={selectedPinId === pin.id ? 1 : 0.8}
            />
          </g>
        ))}
      </svg>

      {/* Numbered badge overlays */}
      {pins.map((pin) => (
        <DraggableBadge
          key={pin.id}
          pin={pin}
          getContainerRect={getContainerRect}
          onMove={onMoveBadge}
          onSelect={() => onSelectPin(pin.id)}
          selected={selectedPinId === pin.id}
          readOnly={readOnly}
        />
      ))}
    </div>
  )
}
