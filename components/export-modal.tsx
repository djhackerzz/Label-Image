'use client'

import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { X, Printer, ImageDown, AlertCircle, Loader2 } from 'lucide-react'
import { LabelingCanvas } from './labeling-canvas'
import type { LabelStyle, Pin } from './anatomy-labeler'

interface ExportModalProps {
  imageSrc: string
  imageAlt: string
  pins: Pin[]
  organName: string
  labelStyle: LabelStyle
  onClose: () => void
}

export function ExportModal({
  imageSrc,
  imageAlt,
  pins,
  organName,
  labelStyle,
  onClose,
}: ExportModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null)
  const imageExportRef = useRef<HTMLDivElement>(null)
  const [isSavingImage, setIsSavingImage] = useState(false)
  const unnamedCount = pins.filter((p) => !p.label.trim()).length

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handlePrint = () => {
    // Mark the print area visible for @media print
    if (printAreaRef.current) {
      printAreaRef.current.classList.add('print-root')
      document.body.style.backgroundColor = '#050608'
    }
    window.print()
    if (printAreaRef.current) {
      printAreaRef.current.classList.remove('print-root')
      document.body.style.backgroundColor = ''
    }
  }

  const handleSaveImage = async () => {
    if (!imageExportRef.current || isSavingImage) return

    setIsSavingImage(true)
    try {
      const dataUrl = await toPng(imageExportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#050608',
      })
      const link = document.createElement('a')
      const safeName = (organName || 'anatomy-specimen')
        .trim()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
      link.download = `${safeName || 'anatomy-specimen'}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('[v0] Image export failed:', error)
      window.alert('Unable to save the image. Please try again.')
    } finally {
      setIsSavingImage(false)
    }
  }

  return (
    <>
      {/* Backdrop + modal */}
      <div
        className="no-print fixed inset-0 z-50 bg-black/90 flex items-start justify-center overflow-y-auto py-8 px-4"
        role="dialog"
        aria-modal="true"
        aria-label="Export preview"
        onClick={onClose}
      >
        <div
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Export / Print</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download a PNG image or print your labeled diagram as a PDF
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveImage}
                disabled={isSavingImage}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {isSavingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageDown size={14} />}
                {isSavingImage ? 'Saving image…' : 'Save as PNG'}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                <Printer size={14} />
                Print / Save PDF
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                aria-label="Close export preview"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Unnamed warning */}
          {unnamedCount > 0 && (
            <div className="flex items-center gap-2.5 px-6 py-2.5 bg-amber-950/30 border-b border-amber-800/30">
              <AlertCircle size={14} className="text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300/80">
                {unnamedCount} label{unnamedCount > 1 ? 's are' : ' is'} still unnamed — they will print as &quot;unlabeled&quot;
              </p>
            </div>
          )}

          {/* Preview body */}
          <div className="p-6 overflow-auto max-h-[80vh]">
            <div
              ref={imageExportRef}
              className="bg-[#050608] rounded-xl p-6 border border-white/5"
            >
              {/* Title */}
              <h1 className="text-white text-lg font-bold text-center tracking-wide mb-1">
                {organName || 'Anatomy Specimen'}
              </h1>
              <p className="text-white/30 text-xs text-center mb-6">
                {pins.length} labeled structure{pins.length !== 1 ? 's' : ''}
              </p>

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
                  labelStyle={labelStyle}
                  readOnly
                />
              </div>

              {/* Legend */}
              {pins.length > 0 && (
                <div className="border-t border-white/10 pt-5">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3">
                    Key
                  </p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                    {pins.map((pin) => (
                      <div key={pin.id} className="flex items-baseline gap-2">
                        <span
                          className="min-w-[1.6rem] shrink-0 text-right"
                          style={{
                            color: labelStyle.textColor,
                            fontSize: `${labelStyle.fontSize}px`,
                            fontWeight: labelStyle.bold ? 700 : 400,
                            fontStyle: labelStyle.italic ? 'italic' : 'normal',
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print-only layer: hidden on screen, shown by @media print via .print-root */}
      <div
        ref={printAreaRef}
        className="hidden"
        style={{ backgroundColor: '#050608', color: '#fff', fontFamily: 'Inter, sans-serif', padding: '32px' }}
      >
        <h1 style={{ fontSize: '22px', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>
          {organName || 'Anatomy Specimen'}
        </h1>
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '24px' }}>
          {pins.length} labeled structure{pins.length !== 1 ? 's' : ''}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <LabelingCanvas
            imageSrc={imageSrc}
            imageAlt={imageAlt}
            pins={pins}
            mode="view"
            selectedPinId={null}
            onAddPin={() => {}}
            onMoveBadge={() => {}}
            onSelectPin={() => {}}
            labelStyle={labelStyle}
            readOnly
          />
        </div>

        {pins.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '20px' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
              Key
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 40px' }}>
              {pins.map((pin) => (
                <div key={pin.id} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', minWidth: '1.6rem', textAlign: 'right', flexShrink: 0 }}>
                    {pin.number}.
                  </span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.82)' }}>
                    {pin.label.trim() || 'unlabeled'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
