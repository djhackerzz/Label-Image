'use client'

import { useEffect, useRef } from 'react'
import { X, Printer } from 'lucide-react'
import { LabelingCanvas } from './labeling-canvas'
import type { Pin } from './anatomy-labeler'

interface ExportModalProps {
  imageSrc: string
  imageAlt: string
  pins: Pin[]
  organName: string
  onClose: () => void
}

export function ExportModal({
  imageSrc,
  imageAlt,
  pins,
  organName,
  onClose,
}: ExportModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handlePrint = () => {
    // Add print-root class so @media print rule shows only this content
    if (printRef.current) {
      printRef.current.classList.add('print-root')
    }
    window.print()
    if (printRef.current) {
      printRef.current.classList.remove('print-root')
    }
  }

  const labeledPins = pins.filter((p) => p.label)

  return (
    <>
      {/* Screen modal */}
      <div
        className="no-print fixed inset-0 z-50 bg-black/85 flex items-start justify-center overflow-y-auto py-10 px-4"
        role="dialog"
        aria-modal="true"
        aria-label="Export preview"
        onClick={onClose}
      >
        <div
          className="bg-card rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-foreground">Export Preview</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Print this page or save as PDF
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Printer size={15} />
                Print / Save PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                aria-label="Close export"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Preview content */}
          <div className="p-6 overflow-auto max-h-[80vh]">
            <div className="bg-[#050608] rounded-lg p-6">
              {/* Title */}
              <h1 className="text-white text-lg font-bold mb-5 text-center tracking-wide">
                {organName || 'Anatomy Specimen'}
              </h1>

              {/* Labeled image */}
              <div className="flex justify-center mb-6">
                <LabelingCanvas
                  imageSrc={imageSrc}
                  imageAlt={imageAlt}
                  pins={pins}
                  mode="view"
                  selectedPinId={null}
                  onAddPin={() => {}}
                  onMoveBadge={() => {}}
                  onSelectPin={() => {}}
                  readOnly={true}
                />
              </div>

              {/* Legend */}
              {labeledPins.length > 0 && (
                <div className="border-t border-white/15 pt-5">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">
                    Legend
                  </p>
                  <div className="grid grid-cols-2 gap-x-10 gap-y-1.5">
                    {pins.map((pin) => (
                      <div key={pin.id} className="flex items-start gap-2">
                        <span className="text-white font-bold text-sm min-w-[1.5rem] shrink-0">
                          {pin.number}.
                        </span>
                        <span className="text-white/85 text-sm leading-5">
                          {pin.label || <span className="italic opacity-40">unlabeled</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print-only layer (invisible on screen, visible when printing) */}
      <div
        ref={printRef}
        className="hidden"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '24px',
            color: '#fff',
          }}
        >
          {organName || 'Anatomy Specimen'}
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <LabelingCanvas
            imageSrc={imageSrc}
            imageAlt={imageAlt}
            pins={pins}
            mode="view"
            selectedPinId={null}
            onAddPin={() => {}}
            onMoveBadge={() => {}}
            onSelectPin={() => {}}
            readOnly={true}
          />
        </div>
        {pins.length > 0 && (
          <div
            style={{
              borderTop: '1px solid #444',
              paddingTop: '16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px 40px',
            }}
          >
            {pins.map((pin) => (
              <div key={pin.id} style={{ display: 'flex', gap: '6px', fontSize: '13px', color: '#fff' }}>
                <span style={{ fontWeight: 700, minWidth: '1.4rem' }}>{pin.number}.</span>
                <span>{pin.label || 'unlabeled'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
