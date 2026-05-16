'use client'

import { useState } from 'react'
import { Handle, Position } from 'reactflow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MindMapNodeProps {
  data: {
    label: string
    onChangeLabel: (nodeId: string, label: string) => void
    onDelete: (nodeId: string) => void
    onAddChild: (parentNodeId: string) => void
    isEditable: boolean
  }
  id: string
}

export default function MindMapNode({ data, id }: MindMapNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(data.label)

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

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 shadow-lg min-w-max',
        'bg-card border-primary text-foreground',
        'hover:shadow-xl transition-all'
      )}
    >
      <Handle type="target" position={Position.Top} />

      <div className="space-y-2">
        {isEditing ? (
          <div className="flex gap-2 items-center">
            <Input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
              className="text-sm font-medium"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-6 w-6 p-0"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div
            onClick={() => data.isEditable && setIsEditing(true)}
            className={cn(
              'font-medium text-sm',
              data.isEditable && 'cursor-pointer hover:underline'
            )}
          >
            {data.label}
          </div>
        )}

        {data.isEditable && !isEditing && (
          <div className="flex gap-1 pt-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => data.onAddChild(id)}
              className="h-6 w-6 p-0"
              title="Add child node"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => data.onDelete(id)}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              title="Delete node"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
