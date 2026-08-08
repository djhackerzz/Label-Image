'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
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
  bottomSpaceRatio?: number
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
  scale,
}: {
  pin: Pin
  getContainerRect: () => DOMRect | null
  onMove: (id: string, x: number, y: number) => void
  onSelect: () => void
  selected: boolean
  labelStyle: LabelStyle
  readOnly?: boolean
  scale: number
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

    // Keep badges over the photo — the bottom space is reserved for the Key
    const maxBadgeY = Math.min(97, 100 / scale - 3)

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
      const y = Math.max(3, Math.min(maxBadgeY, ((me.clientY - rect.top) / rect.height) * 100))
      onMove(pin.id, x, y * scale)
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
        top: `${pin.badgeY / scale}%`,
        transform: 'translate(-50%, -50%)',
        color: labelStyle.numberColor,
        fontSize: `${labelStyle.numberFontSize}px`,
        fontWeight: 700,
        fontStyle: 'normal',
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
  bottomSpaceRatio = 0,
}: LabelingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const padRef = useRef<HTMLDivElement>(null)
  const [imageHeight, setImageHeight] = useState(0)
  const [padHeight, setPadHeight] = useState(0)

  useEffect(() => {
    const imgEl = imgRef.current
    const padEl = padRef.current
    const measure = () => {
      setImageHeight(imgEl?.getBoundingClientRect().height ?? 0)
      setPadHeight(padEl?.getBoundingClientRect().height ?? 0)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (imgEl) ro.observe(imgEl)
    if (padEl) ro.observe(padEl)
    return () => ro.disconnect()
  }, [bottomSpaceRatio])

  // The Key panel below the photo grows the canvas. Scale maps photo-relative
  // positions (what the pins store) into canvas-relative positions for display.
  const scale = imageHeight > 0 ? (imageHeight + padHeight) / imageHeight : 1

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
      const yContainer = ((e.clientY - rect.top) / rect.height) * 100
      // Clicks in the Key area below the photo do not place pins
      if (yContainer > 100 / scale) return
      const y = yContainer * scale

      // Auto-offset badge away from pin dot, stay within the photo
      const isRightHalf = x > 50
      const badgeX = isRightHalf
        ? Math.max(6, x - 18)
        : Math.min(94, x + 18)
      const badgeY = Math.max(5, Math.min(93, y - 4))

      onAddPin({ x, y, badgeX, badgeY })
    },
    [readOnly, mode, onAddPin, getContainerRect, onSelectPin, scale],
  )

  const minPadHeight = imageHeight * bottomSpaceRatio
  const showPad = bottomSpaceRatio > 0

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative inline-block select-none m-auto',
        !readOnly && mode === 'add' && 'cursor-crosshair',
        !readOnly && mode === 'view' && 'cursor-default',
      )}
      onClick={handleContainerClick}
    >
      {/* Specimen image */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={imageAlt}
        className="block max-w-full"
        style={{ maxHeight: readOnly ? '65vh' : 'calc(100vh - 116px)' }}
        draggable={false}
      />

      {/* Key panel — space below the photo for label descriptions */}
      {showPad && (
        <div
          ref={padRef}
          className="relative w-full overflow-hidden border-t border-white/10"
          style={{ minHeight: minPadHeight, backgroundColor: '#0a0c0f' }}
        >
          <div className="px-4 py-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-white/30">Key</p>
            {pins.length === 0 ? (
              <p className="text-xs text-white/30">
                Descriptions will appear here as you name each label.
              </p>
            ) : (
              <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                {pins.map((pin) => (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectPin(selectedPinId === pin.id ? null : pin.id)
                    }}
                    className={cn(
                      'flex items-baseline gap-2 text-left',
                      !readOnly && 'cursor-pointer hover:opacity-80',
                      selectedPinId === pin.id && 'opacity-70',
                    )}
                  >
                    <span
                      className="min-w-[1.4rem] shrink-0 text-right font-bold"
                      style={{
                        color: labelStyle.textColor,
                        fontSize: `${labelStyle.numberFontSize}px`,
                      }}
                    >
                      {pin.number}.
                    </span>
                    <span
                      className="leading-snug"
                      style={{
                        color: labelStyle.textColor,
                        fontSize: `${labelStyle.fontSize}px`,
                        fontWeight: labelStyle.bold ? 700 : 400,
                        fontStyle: labelStyle.italic ? 'italic' : 'normal',
                      }}
                    >
                      {pin.label.trim() || (
                        <em className="text-white/25 not-italic">unlabeled</em>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
                y1={`${pin.badgeY / scale}%`}
                x2={`${pin.x}%`}
                y2={`${pin.y / scale}%`}
                stroke={labelStyle.arrowColor}
                strokeWidth={isSelected ? labelStyle.arrowThickness + 0.5 : labelStyle.arrowThickness}
                strokeOpacity={isSelected ? 1 : 0.7}
                markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
              />
              {/* Pin dot at structure */}
              <circle
                cx={`${pin.x}%`}
                cy={`${pin.y / scale}%`}
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
          scale={scale}
        />
      ))}
    </div>
  )
}
