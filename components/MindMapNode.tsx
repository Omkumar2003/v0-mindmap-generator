'use client'

import { useState, useRef, useEffect } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Check, X, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MindMapNodeProps extends NodeProps {
  data: {
    label: string
    images?: string[]
    onChangeLabel: (nodeId: string, label: string) => void
    onDelete: (nodeId: string) => void
    onAddChild: (parentNodeId: string) => void
    onImageUpload?: (nodeId: string, imageUrl: string) => void
    onImageDelete?: (nodeId: string, imageIndex: number) => void
    isEditable: boolean
  }
}

export default function MindMapNode({ 
  data, 
  id, 
  targetPosition, 
  sourcePosition 
}: MindMapNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(data.label)
  const [textHeight, setTextHeight] = useState('auto')
  const [fullImageIndex, setFullImageIndex] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea on edit
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
    // Trim input to remove extra spaces/lines
    const sanitized = editValue.trim().replace(/\n\s*\n/g, '\n');
    if (sanitized) {
      data.onChangeLabel(id, sanitized)
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
        data.onImageUpload?.(id, imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    // Changed w-64 to w-fit with min/max constraints to wrap content tightly
    <div className="group relative min-w-[100px] max-w-[280px] w-fit">
      
      {/* 
          FLOATING TOOLBAR 
          Positioned slightly higher (-top-5) to stay clear of handles
      */}
      {data.isEditable && !isEditing && (
        <div className="absolute -top-5 -right-2 flex gap-1 z-50 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          <Button
            size="icon"
            onClick={(e) => { e.stopPropagation(); data.onAddChild(id); }}
            className="h-6 w-6 rounded-full shadow-md bg-blue-600 hover:bg-blue-700 text-white border-none"
            title="Add child"
          >
            <Plus className="h-3 w-3" />
          </Button>
          
          <Button
            size="icon"
            onClick={(e) => { e.stopPropagation(); handleImageClick(); }}
            className="h-6 w-6 rounded-full shadow-md bg-purple-600 hover:bg-purple-700 text-white border-none"
            title="Image"
          >
            <ImageIcon className="h-3 w-3" />
          </Button>

          <Button
            size="icon"
            variant="destructive"
            onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
            className="h-6 w-6 rounded-full shadow-md border-none"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* NODE CONTAINER */}
      <div
        className={cn(
          'rounded-lg border-2 shadow-sm transition-all duration-200 overflow-hidden',
          'bg-card border-border group-hover:border-primary/40 group-hover:shadow-md',
          isEditing && 'border-primary ring-2 ring-primary/20 shadow-lg'
        )}
      >
        <Handle 
          type="target" 
          position={targetPosition || Position.Top} 
          className="w-1.5 h-1.5 !bg-primary border-none"
        />

        <div className="p-2.5 space-y-2">
          {/* Images Section */}
          {data.images && data.images.length > 0 && (
            <div className={cn(
                "grid gap-1 pb-1",
                data.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
            )}>
              {data.images.map((img, idx) => (
                <div key={idx} className="relative group/img rounded-md overflow-hidden border border-border">
                  <img
                    src={img}
                    alt=""
                    className="w-full h-12 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setFullImageIndex(idx)}
                  />
                  {data.isEditable && (
                    <button
                      onClick={(e) => { e.stopPropagation(); data.onImageDelete?.(id, idx); }}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white opacity-0 group-hover/img:opacity-100 hover:bg-red-500 transition-all"
                    >
                      <X className="w-2 h-2" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Label Content */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => handleTextChange(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
                className="w-full p-0 bg-transparent text-foreground text-sm font-medium resize-none focus:outline-none leading-tight text-center"
                style={{ height: textHeight, minHeight: '30px' }}
                placeholder="Type..."
              />
              <div className="flex justify-center gap-2 text-[9px] text-muted-foreground pt-1 border-t border-border/50">
                   <Check className="w-3 h-3 text-green-500 cursor-pointer hover:scale-125" onClick={handleSave} />
                   <X className="w-3 h-3 text-red-500 cursor-pointer hover:scale-125" onClick={handleCancel} />
              </div>
            </div>
          ) : (
            <div
              onClick={() => data.isEditable && setIsEditing(true)}
              className={cn(
                'min-h-[16px] text-sm font-semibold leading-snug whitespace-pre-wrap break-words transition-colors px-1 text-center',
                'text-foreground/90 group-hover:text-foreground',
                data.isEditable && 'cursor-text'
              )}
            >
              {data.label || 'New Concept'}
            </div>
          )}
        </div>

        <Handle 
          type="source" 
          position={sourcePosition || Position.Bottom} 
          className="w-1.5 h-1.5 !bg-primary border-none"
        />
      </div>

      {/* Full Image Modal */}
      {fullImageIndex !== null && data.images && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4 backdrop-blur-md"
          onClick={() => setFullImageIndex(null)}
        >
          <div className="relative max-w-4xl max-h-screen" onClick={e => e.stopPropagation()}>
            <img src={data.images[fullImageIndex]} className="rounded-lg shadow-2xl max-h-[85vh] object-contain" alt="Full view" />
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute -top-10 -right-2 text-white hover:bg-white/20 rounded-full"
              onClick={() => setFullImageIndex(null)}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}

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