'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, Undo2, Trash2, Download, Pin, Eye, Scan, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LabelingCanvas } from './labeling-canvas'
import { LabelsPanel } from './labels-panel'
import { ExportModal } from './export-modal'
import { LabelStyleSettings } from './label-style-settings'
import { MarginSetupModal } from './margin-setup'

export type Pin = {
  id: string
  number: number
  x: number      // pin dot position — % of image
  y: number
  badgeX: number // badge position — draggable
  badgeY: number
  label: string
}

export type LabelStyle = {
  textColor: string
  fontSize: number
  bold: boolean
  italic: boolean
  numberColor: string
  numberFontSize: number
  arrowColor: string
  arrowThickness: number
}

export const DEFAULT_LABEL_STYLE: LabelStyle = {
  textColor: '#ffffff',
  fontSize: 11,
  bold: true,
  italic: false,
  numberColor: '#000000',
  numberFontSize: 13,
  arrowColor: '#ffffff',
  arrowThickness: 1,
}

const DEMO_IMAGE = '/demo/heart-demo.jpg'

// ── Upload drop zone ──────────────────────────────────────────────────────────
function UploadDropzone({
  onUpload,
  onDemo,
}: {
  onUpload: (file: File) => void
  onDemo: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) onUpload(file)
  }

  return (
    <div className="flex flex-col items-center gap-5 max-w-sm w-full m-auto">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'w-full border-2 border-dashed rounded-2xl px-10 py-12',
          'flex flex-col items-center gap-4 cursor-pointer transition-all select-none',
          isDragging
            ? 'border-primary bg-primary/8 scale-[1.01]'
            : 'border-border hover:border-primary/40 hover:bg-white/3',
        )}
        role="button"
        tabIndex={0}
        aria-label="Upload organ photo"
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(file)
          }}
        />
        <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center">
          <Upload size={22} className="text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">Upload Organ Photo</p>
          <p className="text-xs text-muted-foreground mt-1">
            Drag &amp; drop or click to browse
          </p>
          <p className="text-[11px] text-muted-foreground/40 mt-1">PNG · JPG · WEBP</p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] text-muted-foreground/50">or try a demo</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        onClick={onDemo}
        className={cn(
          'w-full py-2.5 px-5 rounded-xl border border-border text-sm font-medium',
          'text-muted-foreground hover:text-foreground hover:border-primary/40',
          'transition-colors text-center',
        )}
      >
        Load demo — Human Heart specimen
      </button>
    </div>
  )
}

// ── Toolbar button ─────────────────────────────────────────────────────────────
function ToolbarBtn({
  onClick,
  title,
  disabled,
  children,
  active,
  variant = 'default',
}: {
  onClick: () => void
  title: string
  disabled?: boolean
  children: React.ReactNode
  active?: boolean
  variant?: 'default' | 'danger' | 'primary'
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
        'disabled:opacity-35 disabled:cursor-not-allowed',
        active || variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:opacity-90'
          : variant === 'danger'
          ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export function AnatomyLabeler() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageAlt, setImageAlt] = useState('Anatomy specimen')
  const [pins, setPins] = useState<Pin[]>([])
  const [mode, setMode] = useState<'add' | 'view'>('add')
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [organName, setOrganName] = useState('')
  const [labelStyle, setLabelStyle] = useState<LabelStyle>(DEFAULT_LABEL_STYLE)
  const [bottomSpaceRatio, setBottomSpaceRatio] = useState(0)
  const [showMarginSetup, setShowMarginSetup] = useState(false)

  const loadImage = useCallback((src: string, alt: string, name: string) => {
    setImageSrc(src)
    setImageAlt(alt)
    setOrganName(name)
    setPins([])
    setSelectedPinId(null)
    setMode('add')
    setBottomSpaceRatio(0)
    setShowMarginSetup(true)
  }, [])

  const handleFileUpload = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        loadImage(
          e.target?.result as string,
          file.name,
          file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        )
      }
      reader.readAsDataURL(file)
    },
    [loadImage],
  )

  const handleDemo = useCallback(() => {
    loadImage(DEMO_IMAGE, 'Human Heart — Internal Anatomy', 'Human Heart — Internal Anatomy')
  }, [loadImage])

  const handleAddPin = useCallback(
    (params: { x: number; y: number; badgeX: number; badgeY: number }) => {
      setPins((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          number: prev.length + 1,
          label: '',
          ...params,
        },
      ])
    },
    [],
  )

  const handleMoveBadge = useCallback(
    (id: string, badgeX: number, badgeY: number) => {
      setPins((prev) =>
        prev.map((p) => (p.id === id ? { ...p, badgeX, badgeY } : p)),
      )
    },
    [],
  )

  const handleUpdateLabel = useCallback((id: string, label: string) => {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, label } : p)))
  }, [])

  const handleDeletePin = useCallback((id: string) => {
    setPins((prev) => {
      const filtered = prev.filter((p) => p.id !== id)
      return filtered.map((p, i) => ({ ...p, number: i + 1 }))
    })
    setSelectedPinId((cur) => (cur === id ? null : cur))
  }, [])

  const handleUndo = useCallback(() => {
    setPins((prev) => {
      const next = prev.slice(0, -1)
      return next
    })
    setSelectedPinId(null)
  }, [])

  const handleClearAll = useCallback(() => {
    if (!confirm('Remove all labels? This cannot be undone.')) return
    setPins([])
    setSelectedPinId(null)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* ── Header ────���────────────────────────────────────────────────── */}
      <header className="flex items-center gap-2 px-4 h-13 border-b border-border bg-card shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2 mr-1">
          <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
            <Scan size={13} className="text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight hidden sm:block">
            AnatomyLabel
          </span>
        </div>

        <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

        {/* Upload */}
        <ToolbarBtn
          onClick={() => document.getElementById('toolbar-file-upload')?.click()}
          title="Upload new image"
        >
          <Upload size={13} />
          <span className="hidden sm:inline">Upload</span>
        </ToolbarBtn>
        <input
          id="toolbar-file-upload"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(file)
            e.target.value = ''
          }}
        />

        {/* Mode toggle */}
        {imageSrc && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <div
              className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5"
              role="group"
              aria-label="Editing mode"
            >
              <button
                onClick={() => setMode('add')}
                title="Pin Mode — click image to add labels"
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                  mode === 'add'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Pin size={12} />
                <span>Pin</span>
              </button>
              <button
                onClick={() => setMode('view')}
                title="View Mode — pan and inspect without adding"
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                  mode === 'view'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Eye size={12} />
                <span>View</span>
              </button>
            </div>
          </>
        )}

        <div className="flex-1" />

        <ToolbarBtn onClick={() => setShowSettings(true)} title="Open label appearance settings">
          <Settings size={13} />
          <span className="hidden sm:inline">Settings</span>
        </ToolbarBtn>

        {/* Right actions */}
        {imageSrc && (
          <>
            <ToolbarBtn
              onClick={handleUndo}
              title="Undo last pin (removes most recent label)"
              disabled={pins.length === 0}
            >
              <Undo2 size={13} />
              <span className="hidden sm:inline">Undo</span>
            </ToolbarBtn>
            <ToolbarBtn
              onClick={handleClearAll}
              title="Remove all labels"
              disabled={pins.length === 0}
              variant="danger"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Clear All</span>
            </ToolbarBtn>
            <div className="w-px h-5 bg-border mx-1" />
            <ToolbarBtn
              onClick={() => setShowExport(true)}
              title="Export or print labeled diagram"
              variant="primary"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export</span>
            </ToolbarBtn>
          </>
        )}
      </header>

      {/* ── Main area ──────────────────────────────────────────────────── */}
      <main className="flex flex-1 overflow-hidden">
        {/* Canvas column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto flex bg-[#050608] p-4">
            {imageSrc ? (
              <LabelingCanvas
                imageSrc={imageSrc}
                imageAlt={imageAlt}
                pins={pins}
                mode={mode}
                selectedPinId={selectedPinId}
                onAddPin={handleAddPin}
                onMoveBadge={handleMoveBadge}
                onSelectPin={setSelectedPinId}
                labelStyle={labelStyle}
                bottomSpaceRatio={bottomSpaceRatio}
              />
            ) : (
              <UploadDropzone onUpload={handleFileUpload} onDemo={handleDemo} />
            )}
          </div>

          {/* Status hint bar at bottom of canvas */}
          {imageSrc && (
            <div className="shrink-0 h-8 px-4 flex items-center justify-between border-t border-border bg-card/70 backdrop-blur-sm">
              <span className="text-[11px] text-muted-foreground/60">
                {mode === 'add'
                  ? 'Click anywhere on the image to place a label — drag the badge to reposition'
                  : 'View mode — switch to Pin to add labels'}
              </span>
              <span className="text-[11px] text-muted-foreground/40">
                {pins.length > 0 && `${pins.length} label${pins.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          )}
        </div>

        {/* Labels sidebar */}
        <LabelsPanel
          pins={pins}
          organName={organName}
          onOrganNameChange={setOrganName}
          onUpdateLabel={handleUpdateLabel}
          onDeletePin={handleDeletePin}
          selectedPinId={selectedPinId}
          onSelectPin={setSelectedPinId}
          labelStyle={labelStyle}
        />
      </main>

      {showSettings && (
        <LabelStyleSettings
          style={labelStyle}
          onChange={setLabelStyle}
          onClose={() => setShowSettings(false)}
          bottomSpaceRatio={bottomSpaceRatio}
          onBottomSpaceRatioChange={setBottomSpaceRatio}
        />
      )}

      {showMarginSetup && imageSrc && (
        <MarginSetupModal
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          labelStyle={labelStyle}
          initialRatio={bottomSpaceRatio}
          onConfirm={(ratio) => {
            setBottomSpaceRatio(ratio)
            setShowMarginSetup(false)
          }}
        />
      )}

      {/* Export modal */}
      {showExport && imageSrc && (
        <ExportModal
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          pins={pins}
          organName={organName}
          labelStyle={labelStyle}
          bottomSpaceRatio={bottomSpaceRatio}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
