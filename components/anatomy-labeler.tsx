'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  Undo2,
  Trash2,
  Download,
  Pin,
  Eye,
  Scan,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LabelingCanvas } from './labeling-canvas'
import { LabelsPanel } from './labels-panel'
import { ExportModal } from './export-modal'

export type Pin = {
  id: string
  number: number
  x: number      // % of image width
  y: number      // % of image height
  badgeX: number // % for the draggable badge position
  badgeY: number
  label: string
}

const DEMO_IMAGE =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260807-WA0000-kghbLoXdqOyxRBCqFA2YdBbnbnjysK.jpg'

// ── Upload drop zone ─────────────────────────────────────────────────────────
function UploadDropzone({ onUpload, onDemo }: { onUpload: (file: File) => void; onDemo: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) onUpload(file)
  }

  return (
    <div className="flex flex-col items-center gap-6 max-w-md w-full">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'w-full border-2 border-dashed rounded-2xl p-14 flex flex-col items-center gap-4',
          'cursor-pointer transition-all select-none',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
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
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Upload size={26} className="text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">Upload Organ Photo</p>
          <p className="text-sm text-muted-foreground mt-1">Drag &amp; drop or click to browse</p>
          <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, WEBP supported</p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        onClick={onDemo}
        className="w-full py-2.5 px-4 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
      >
        Load demo — Human Heart specimen
      </button>
    </div>
  )
}

// ── Toolbar button ────────────────────────────────────────────────────────────
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
  variant?: 'default' | 'danger'
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active
          ? 'bg-primary text-primary-foreground'
          : variant === 'danger'
          ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function AnatomyLabeler() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageAlt, setImageAlt] = useState('Anatomy specimen')
  const [pins, setPins] = useState<Pin[]>([])
  const [mode, setMode] = useState<'add' | 'view'>('add')
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [organName, setOrganName] = useState('')

  const loadImage = useCallback((src: string, alt: string, name: string) => {
    setImageSrc(src)
    setImageAlt(alt)
    setOrganName(name)
    setPins([])
    setSelectedPinId(null)
  }, [])

  const handleFileUpload = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        loadImage(
          e.target?.result as string,
          file.name,
          file.name.replace(/\.[^.]+$/, ''),
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

  const handleMoveBadge = useCallback((id: string, badgeX: number, badgeY: number) => {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, badgeX, badgeY } : p)))
  }, [])

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
    setPins((prev) => prev.slice(0, -1))
    setSelectedPinId(null)
  }, [])

  const handleClearAll = useCallback(() => {
    setPins([])
    setSelectedPinId(null)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* ── Header toolbar ─────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 h-14 border-b border-border bg-card shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Scan size={15} className="text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight hidden sm:block">
            AnatomyLabel
          </span>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Upload */}
        <ToolbarBtn onClick={() => document.getElementById('toolbar-file-upload')?.click()} title="Upload new image">
          <Upload size={14} />
          <span className="hidden sm:inline">Upload Image</span>
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
            <div className="w-px h-6 bg-border mx-1" />
            <div
              className="flex items-center bg-muted rounded-lg p-0.5"
              role="group"
              aria-label="Editing mode"
            >
              <button
                onClick={() => setMode('add')}
                title="Pin Mode — click to add labels"
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                  mode === 'add'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Pin size={13} />
                <span className="hidden sm:inline">Pin</span>
              </button>
              <button
                onClick={() => setMode('view')}
                title="View Mode — browse without adding"
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                  mode === 'view'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Eye size={13} />
                <span className="hidden sm:inline">View</span>
              </button>
            </div>
          </>
        )}

        <div className="flex-1" />

        {/* Actions */}
        {imageSrc && (
          <>
            <ToolbarBtn
              onClick={handleUndo}
              title="Undo last pin"
              disabled={pins.length === 0}
            >
              <Undo2 size={14} />
              <span className="hidden sm:inline">Undo</span>
            </ToolbarBtn>
            <ToolbarBtn
              onClick={handleClearAll}
              title="Remove all labels"
              disabled={pins.length === 0}
              variant="danger"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Clear</span>
            </ToolbarBtn>
            <div className="w-px h-6 bg-border mx-1" />
            <ToolbarBtn
              onClick={() => setShowExport(true)}
              title="Export / Print"
              active
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export</span>
            </ToolbarBtn>
          </>
        )}
      </header>

      {/* ── Main area ──────────────────────────────────────────────────── */}
      <main className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-[#050608] p-4">
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
            />
          ) : (
            <UploadDropzone onUpload={handleFileUpload} onDemo={handleDemo} />
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
        />
      </main>

      {/* Export modal */}
      {showExport && imageSrc && (
        <ExportModal
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          pins={pins}
          organName={organName}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
