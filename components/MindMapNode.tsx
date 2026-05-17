'use client'

import { useState, useRef, useEffect } from 'react'
import { Handle, Position } from 'reactflow'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Check, X, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MindMapNodeProps {
  data: {
    label: string
    image?: string
    onChangeLabel: (nodeId: string, label: string) => void
    onDelete: (nodeId: string) => void
    onAddChild: (parentNodeId: string) => void
    onImageUpload?: (nodeId: string, imageUrl: string) => void
    isEditable: boolean
  }
  id: string
}

export default function MindMapNode({ data, id }: MindMapNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(data.label)
  const [textHeight, setTextHeight] = useState('auto')
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
          {/* Image Display */}
          {data.image && (
            <div className="relative group">
              <img
                src={data.image}
                alt="Node content"
                className="w-full h-32 object-cover rounded-lg"
              />
              {data.isEditable && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleImageClick}
                  className="absolute top-1 right-1 h-7 w-7 p-0 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ImageIcon className="w-4 h-4 text-white" />
                </Button>
              )}
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
