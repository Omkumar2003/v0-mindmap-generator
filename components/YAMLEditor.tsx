'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, Copy } from 'lucide-react'
import type { Node, Edge } from 'reactflow'

interface YAMLEditorProps {
  nodes: Node[]
  edges: Edge[]
  onYAMLChange: (nodes: Node[], edges: Edge[]) => void
  isOpen: boolean
  onToggle: () => void
}

// Convert mindmap nodes and edges to YAML format
const nodesToYAML = (nodes: Node[], edges: Edge[]): string => {
  if (nodes.length === 0) return ''

  // Build edge map for quick parent-child lookup
  const childrenMap = new Map<string, string[]>()
  edges.forEach(edge => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, [])
    }
    childrenMap.get(edge.source)?.push(edge.target)
  })

  // Build node map for quick lookup
  const nodeMap = new Map<string, Node>()
  nodes.forEach(node => nodeMap.set(node.id, node))

  // Find root node
  let rootNode = nodes.find(n => n.id === 'root')
  if (!rootNode) {
    const childIds = new Set(edges.map(e => e.target))
    rootNode = nodes.find(n => !childIds.has(n.id)) || nodes[0]
  }

  if (!rootNode) return ''

  // Recursively build YAML
  const buildYAML = (nodeId: string, indent: number = 0): string[] => {
    const node = nodeMap.get(nodeId)
    if (!node) return []

    const lines: string[] = []
    const indentStr = '  '.repeat(indent)
    
    lines.push(`${indentStr}- ${node.data.label}`)

    // Add children
    const children = childrenMap.get(nodeId) || []
    children.forEach(childId => {
      const childLines = buildYAML(childId, indent + 1)
      lines.push(...childLines)
    })

    return lines
  }

  return buildYAML(rootNode.id).join('\n')
}

// Parse YAML format back to mindmap nodes and edges
const yamlToNodes = (yamlText: string): { nodes: Node[], edges: Edge[] } => {
  console.log('[v0] Parsing YAML:', yamlText)
  
  const lines = yamlText.split('\n')
  const nodes: Node[] = []
  const edges: Edge[] = []
  const nodeStack: Array<{ id: string; level: number }> = [] // Track hierarchy
  let nodeCounter = 0

  for (const line of lines) {
    if (!line.trim()) continue // Skip empty lines
    
    // Get indentation level (count leading spaces, divide by 2)
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0
    const level = Math.floor(leadingSpaces / 2)
    
    // Extract text after "- "
    const match = line.match(/^\s*-\s+(.+)$/)
    if (!match) continue
    
    const label = match[1].trim()
    const nodeId = `node-yaml-${Date.now()}-${nodeCounter++}`

    console.log(`[v0] Parsed node: "${label}" at level ${level}`)

    // Create node with all required properties
    const newNode: Node = {
      id: nodeId,
      type: 'mindmap',
      data: {
        label,
        images: [],
        isEditable: true,
        onChangeLabel: () => {},
        onDelete: () => {},
        onAddChild: () => {},
        onImageUpload: () => {},
        onImageDelete: () => {},
      },
      position: { x: 0, y: 0 },
    }

    nodes.push(newNode)

    // Pop stack until we find parent at previous level
    while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].level >= level) {
      nodeStack.pop()
    }

    // Create edge to parent if exists
    if (nodeStack.length > 0) {
      const parentId = nodeStack[nodeStack.length - 1].id
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
      })
      console.log(`[v0] Created edge: ${parentId} -> ${nodeId}`)
    }

    // Add current node to stack
    nodeStack.push({ id: nodeId, level })
  }

  console.log(`[v0] Final result: ${nodes.length} nodes, ${edges.length} edges`)
  return { nodes, edges }
}

export default function YAMLEditor({ nodes, edges, onYAMLChange, isOpen, onToggle }: YAMLEditorProps) {
  const [yaml, setYAML] = useState(nodesToYAML(nodes, edges))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const newYaml = nodesToYAML(nodes, edges)
    console.log('[v0] Updating YAML from nodes:', newYaml)
    setYAML(newYaml)
  }, [nodes, edges])

  const handleYAMLChange = (newYAML: string) => {
    setYAML(newYAML)
  }

  const applyYAMLChanges = () => {
    try {
      console.log('[v0] Applying YAML changes with text:', yaml)
      const { nodes: newNodes, edges: newEdges } = yamlToNodes(yaml)
      
      if (newNodes.length > 0) {
        console.log('[v0] Successfully parsed YAML into', newNodes.length, 'nodes and', newEdges.length, 'edges')
        onYAMLChange(newNodes, newEdges)
        alert(`Mind map updated! Created ${newNodes.length} nodes.`)
      } else {
        alert('No valid nodes found in YAML. Each line should start with "- NodeName"')
      }
    } catch (error) {
      console.error('[v0] Error parsing YAML:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(yaml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border-l border-border bg-card flex flex-col h-full">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-primary/5 transition-colors border-b border-border"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        <span className="font-semibold text-sm">YAML Editor</span>
      </button>

      {isOpen && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex gap-2 p-3 border-b border-border bg-muted/30">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="flex-1 gap-2"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              size="sm"
              onClick={applyYAMLChanges}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Apply YAML
            </Button>
          </div>

          <textarea
            value={yaml}
            onChange={(e) => handleYAMLChange(e.target.value)}
            className="flex-1 p-3 font-mono text-xs bg-background text-foreground border-0 resize-none focus:outline-none overflow-auto"
            placeholder="- Root Node&#10;  - Child 1&#10;  - Child 2&#10;    - Grandchild"
          />

          <div className="p-3 text-xs text-muted-foreground border-t border-border bg-muted/20">
            <p className="mb-2 font-semibold">Format (use 2 spaces for each level):</p>
            <code className="block text-[10px] leading-relaxed whitespace-pre">
- Root Node
  - Child 1
  - Child 2
    - Grandchild
            </code>
          </div>
        </div>
      )}
    </div>
  )
}
