'use client'

import { useState, useRef, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Check, X, Image as ImageIcon, Maximize2 } from 'lucide-react'

interface MindMapNodeProps {
  data: {
    label: string
    images?: string[] // Support multiple images
    onChangeLabel: (nodeId: string, label: string) => void
    onDelete: (nodeId: string) => void
    onAddChild: (parentNodeId: string) => void
    onImageUpload?: (nodeId: string, imageUrl: string) => void
    onImageDelete?: (nodeId: string, imageIndex: number) => void
    isEditable: boolean
  }
  id: string
}
  id: string
}

export default function MindMapNode({ data, id }: MindMapNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(data.label)
  const [textHeight, setTextHeight] = useState('auto')
  const [fullImageIndex, setFullImageIndex] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.style.height = 'auto'
      setTextHeight(`${textareaRef.current.scrollHeight}px`)
    }
  }, [isEditing])

  const handleTextChange = (value: string) => {
    setEditValue(value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      setTextHeight(`${textareaRef.current.scrollHeight}px`)
    }
  }

  const handleSave = () => {
    if (editValue.trim()) {
      data.onChangeLabel(id, editValue)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditValue(data.label)
    setIsEditing(false)
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && data.onImageUpload) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        data.onImageUpload(id, imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="w-64">
      <div
        className={cn(
          'rounded-xl border-2 shadow-md overflow-hidden',
          'bg-gradient-to-br from-card to-card/95 border-primary/50',
          'hover:shadow-lg transition-all duration-200'
        )}
      >
        <Handle type="target" position={Position.Top} />

        <div className="p-4 space-y-3">
          {/* Image Display - Thumbnails */}
          {data.images && data.images.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {data.images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden">
                    <img
                      src={img}
                      alt={`Node image ${idx + 1}`}
                      className="w-full h-20 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setFullImageIndex(idx)}
                    />
                    {data.isEditable && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          data.onImageDelete?.(id, idx)
                        }}
                        className="absolute top-0 right-0 h-5 w-5 p-0 bg-red-600/80 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete image"
                      >
                        <X className="w-3 h-3 text-white" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Image Modal */}
          {fullImageIndex !== null && data.images && (
            <div
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
              onClick={() => setFullImageIndex(null)}
            >
              <div
                className="bg-card rounded-lg overflow-hidden max-w-2xl max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={data.images[fullImageIndex]}
                  alt="Full view"
                  className="w-full h-full object-contain"
                />
                <div className="flex justify-between items-center p-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    {fullImageIndex + 1} of {data.images.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFullImageIndex(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Text Content */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                autoFocus
                value={editValue}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
                className={cn(
                  'w-full p-2 rounded border border-primary/30 bg-background text-foreground',
                  'text-sm font-medium resize-none focus:outline-none focus:border-primary',
                  'font-medium'
                )}
                style={{ height: textHeight, minHeight: '60px', maxHeight: '150px' }}
                placeholder="Enter text..."
              />
              <div className="flex gap-1 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSave}
                  className="h-7 w-7 p-0 hover:bg-green-500/20"
                >
                  <Check className="w-4 h-4 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  className="h-7 w-7 p-0 hover:bg-red-500/20"
                >
                  <X className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => data.isEditable && setIsEditing(true)}
              className={cn(
                'min-h-12 p-2 rounded font-medium text-sm leading-relaxed whitespace-pre-wrap break-words',
                data.isEditable && 'cursor-text hover:bg-primary/10 transition-colors',
                'text-foreground'
              )}
            >
              {data.label || 'Click to add text'}
            </div>
          )}

          {/* Action Buttons */}
          {data.isEditable && !isEditing && (
            <div className="flex gap-2 pt-2 border-t border-primary/20">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => data.onAddChild(id)}
                className="flex-1 h-8 gap-1 hover:bg-blue-500/20"
                title="Add child node"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span className="text-xs">Add</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleImageClick}
                className="flex-1 h-8 gap-1 hover:bg-purple-500/20"
                title="Upload image"
              >
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <span className="text-xs">Image</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => data.onDelete(id)}
                className="flex-1 h-8 gap-1 hover:bg-red-500/20"
                title="Delete node"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span className="text-xs">Delete</span>
              </Button>
            </div>
          )}
        </div>

        <Handle type="source" position={Position.Bottom} />
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />
    </div>
  )
}
