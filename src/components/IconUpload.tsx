import { useEffect, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface IconUploadProps {
  /** Subscription name — used for the fallback letter in the preview */
  name: string
  /** Existing icon URL from the DB (shown before any new file is selected) */
  currentUrl: string | null
  /** Currently selected (not yet uploaded) file */
  selectedFile: File | null
  onSelect: (file: File | null) => void
}

export function IconUpload({ name, currentUrl, selectedFile, onSelect }: IconUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  // Create an object URL for the selected file so we can preview it.
  // The URL is revoked on cleanup to avoid memory leaks.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!selectedFile) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedFile])

  const displayUrl = previewUrl ?? currentUrl ?? undefined
  const fallback = name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex items-center gap-3">
      {/* Live preview — shows selected file, existing icon, or letter fallback */}
      <Avatar size="md">
        {displayUrl && <AvatarImage src={displayUrl} />}
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1">
        {/* Filename + clear button when a new file is staged */}
        {selectedFile && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              {selectedFile.name}
            </span>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Премахни избрания файл"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-3 w-3" />
          {currentUrl || selectedFile ? 'Смени иконата' : 'Качи икона'}
        </Button>
      </div>

      {/* Hidden file input — SVG only */}
      <input
        ref={fileRef}
        type="file"
        accept=".svg,image/svg+xml"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0] ?? null
          onSelect(file)
          e.target.value = '' // allow re-selecting the same file
        }}
      />
    </div>
  )
}
