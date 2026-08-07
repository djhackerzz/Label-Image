'use client'

import { useRef, useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import type { LabelStyle, Pin } from './anatomy-labeler'

interface LabelingCanvasProps {
  imageSrc: string
  imageAlt: string
  pins: Pin[]
  mode: 'add' | 'view'
  selectedPinId: string | null
  onAddPin: (params: { x: number; y: number; badgeX: number; badgeY: number }) => void
  onMoveBadge: (id: string, x: number, y: number) => void
  onSelectPin: (id: string | null) => void
  labelStyle: LabelStyle
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
  labelStyle,
}: {
  pin: Pin
  getContainerRect: () => DOMRect | null
  onMove: (id: string, x: number, y: number) => void
  onSelect: () => void
  selected: boolean
  labelStyle: LabelStyle
  readOnly?: boolean
}) {
  const hasMoved = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    hasMoved.current = false

    const startX = e.clientX
    const startY = e.clientY
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    const handlePointerMove = (me: PointerEvent) => {
      if (
        !hasMoved.current &&
        (Math.abs(me.clientX - startX) > 4 || Math.abs(me.clientY - startY) > 4)
      ) {
        hasMoved.current = true
        setIsDragging(true)
      }
      if (!hasMoved.current || readOnly) return
      const rect = getContainerRect()
      if (!rect) return
      const x = Math.max(3, Math.min(97, ((me.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(3, Math.min(97, ((me.clientY - rect.top) / rect.height) * 100))
      onMove(pin.id, x, y)
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      if (!hasMoved.current) onSelect()
      hasMoved.current = false
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  return (
    <div
      style={{
        left: `${pin.badgeX}%`,
        top: `${pin.badgeY}%`,
        transform: 'translate(-50%, -50%)',
        color: labelStyle.textColor,
        fontSize: `${labelStyle.fontSize}px`,
        fontWeight: labelStyle.bold ? 700 : 400,
        fontStyle: labelStyle.italic ? 'italic' : 'normal',
      }}
      className={cn(
        'group absolute z-20 flex items-center justify-center w-7 h-7 rounded-full',
        'select-none transition-all',
        'bg-white',
        !readOnly && 'cursor-grab active:cursor-grabbing',
        isDragging && 'scale-110',
        selected
          ? 'shadow-[0_0_0_2.5px_oklch(0.68_0.14_196),0_0_14px_oklch(0.68_0.14_196/0.6)]'
          : 'shadow-[0_1px_4px_rgba(0,0,0,0.8),0_0_0_1.5px_rgba(255,255,255,0.35)]',
      )}
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
      role="button"
      aria-label={`Label ${pin.number}: ${pin.label || 'unlabeled'}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      {pin.number}

      {/* Hover tooltip showing label */}
      {pin.label && (
        <span
          className={cn(
            'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2',
            'bg-gray-900/95 text-white text-[10px] font-normal whitespace-nowrap',
            'px-2 py-0.5 rounded-md border border-white/10',
            'opacity-0 group-hover:opacity-100 transition-opacity',
          )}
          aria-hidden="true"
        >
          {pin.label}
        </span>
      )}
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
  labelStyle,
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

      // Ignore clicks on badges or SVG
      const target = e.target as HTMLElement
      if (target.closest('[role="button"]') || target.tagName === 'svg' || target.closest('svg')) {
        onSelectPin(null)
        return
      }

      const rect = getContainerRect()
      if (!rect) return
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      // Auto-offset badge away from pin dot, stay within bounds
      const isRightHalf = x > 50
      const badgeX = isRightHalf
        ? Math.max(6, x - 18)
        : Math.min(94, x + 18)
      const badgeY = Math.max(5, Math.min(93, y - 4))

      onAddPin({ x, y, badgeX, badgeY })
    },
    [readOnly, mode, onAddPin, getContainerRect, onSelectPin],
  )

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative inline-block select-none',
        !readOnly && mode === 'add' && 'cursor-crosshair',
        !readOnly && mode === 'view' && 'cursor-default',
      )}
      onClick={handleContainerClick}
    >
      {/* Specimen image */}
      <img
        src={imageSrc}
        alt={imageAlt}
        className="block max-w-full"
        style={{ maxHeight: readOnly ? '65vh' : 'calc(100vh - 116px)' }}
        draggable={false}
      />

      {/* SVG: arrowhead marker + leader lines + pin dots */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
        overflow="visible"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="5"
            markerHeight="5"
            refX="3"
            refY="2.5"
            orient="auto"
          >
            <polygon points="0 0, 5 2.5, 0 5" fill={labelStyle.arrowColor} opacity="0.9" />
          </marker>
          <marker
            id="arrowhead-selected"
            markerWidth="5"
            markerHeight="5"
            refX="3"
            refY="2.5"
            orient="auto"
          >
            <polygon points="0 0, 5 2.5, 0 5" fill={labelStyle.arrowColor} opacity="1" />
          </marker>
        </defs>

        {pins.map((pin) => {
          const isSelected = selectedPinId === pin.id
          return (
            <g key={pin.id}>
              {/* Leader line from badge to pin dot with arrowhead at pin end */}
              <line
                x1={`${pin.badgeX}%`}
                y1={`${pin.badgeY}%`}
                x2={`${pin.x}%`}
                y2={`${pin.y}%`}
                stroke={labelStyle.arrowColor}
                strokeWidth={isSelected ? labelStyle.arrowThickness + 0.5 : labelStyle.arrowThickness}
                strokeOpacity={isSelected ? 1 : 0.7}
                markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
              />
              {/* Pin dot at structure */}
              <circle
                cx={`${pin.x}%`}
                cy={`${pin.y}%`}
                r="3"
                fill={isSelected ? 'oklch(0.68 0.14 196)' : 'white'}
                opacity={isSelected ? 1 : 0.8}
              />
            </g>
          )
        })}
      </svg>

      {/* Numbered badge overlays */}
      {pins.map((pin) => (
        <DraggableBadge
          key={pin.id}
          pin={pin}
          getContainerRect={getContainerRect}
          onMove={onMoveBadge}
          onSelect={() => onSelectPin(selectedPinId === pin.id ? null : pin.id)}
          selected={selectedPinId === pin.id}
          labelStyle={labelStyle}
          readOnly={readOnly}
        />
      ))}
    </div>
  )
}
