import { useEffect, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!selectedFile) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedFile])

  const displayUrl = previewUrl ?? currentUrl ?? undefined
  const hasImage = !!displayUrl
  const fallback = name?.[0]?.toUpperCase() ?? '?'

  const handleClick = () => {
    if (hasImage) {
      // If there's an image, clicking removes it
      onSelect(null)
    } else {
      // No image — open file picker
      fileRef.current?.click()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="relative group cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={hasImage ? 'Премахни иконата' : 'Качи икона'}
      >
        <Avatar size="lg">
          {displayUrl && <AvatarImage src={displayUrl} />}
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasImage ? (
            <span className="text-white text-[10px] font-medium">Премахни</span>
          ) : (
            <Upload className="size-4 text-white" />
          )}
        </div>
      </button>

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
    </>
  )
}
