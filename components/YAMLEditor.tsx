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
  const edgeMap = new Map<string, string[]>()
  edges.forEach(edge => {
    if (!edgeMap.has(edge.source)) {
      edgeMap.set(edge.source, [])
    }
    edgeMap.get(edge.source)?.push(edge.target)
  })

  // Build node map for quick lookup
  const nodeMap = new Map<string, Node>()
  nodes.forEach(node => nodeMap.set(node.id, node))

  // Find root node (prioritize 'root' id, otherwise use first node with no parent)
  let rootNode = nodes.find(n => n.id === 'root')
  if (!rootNode) {
    const parentIds = new Set(edges.map(e => e.source))
    rootNode = nodes.find(n => !parentIds.has(n.id)) || nodes[0]
  }

  if (!rootNode) return ''

  // Recursively build YAML
  const buildYAML = (nodeId: string, indent: number = 0): string => {
    const node = nodeMap.get(nodeId)
    if (!node) return ''

    const indentStr = '  '.repeat(indent)
    let yaml = `${indentStr}- ${node.data.label}`

    // Add images if present
    if (node.data.images && node.data.images.length > 0) {
      yaml += `\n${indentStr}  images:`
      node.data.images.forEach((img, idx) => {
        const preview = img.substring(0, 30) + (img.length > 30 ? '...' : '')
        yaml += `\n${indentStr}    - image_${idx + 1}: ${preview}`
      })
    }

    // Add children recursively
    const children = edgeMap.get(nodeId) || []
    if (children.length > 0) {
      children.forEach(childId => {
        const childYaml = buildYAML(childId, indent + 1)
        yaml += '\n' + childYaml
      })
    }

    return yaml
  }

  return buildYAML(rootNode.id)
}

// Parse YAML format back to mindmap nodes and edges
const yamlToNodes = (yaml: string, existingNodes: Node[], existingEdges: Edge[]): { nodes: Node[], edges: Edge[] } => {
  const allLines = yaml.split('\n')
  const nodes: Node[] = []
  const edges: Edge[] = []
  let nodeCounter = 0
  const parentStack: Array<{ nodeId: string; indent: number }> = []

  // Helper to get node handlers from existing nodes
  const getNodeHandlers = () => ({
    onChangeLabel: () => {},
    onDelete: () => {},
    onAddChild: () => {},
  })

  // Process each line
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i]
    const trimmed = line.trim()

    // Skip empty lines, images, and children keywords
    if (!trimmed || trimmed === 'images:' || trimmed === 'children:' || trimmed.startsWith('- ') === false) {
      continue
    }

    const indent = line.search(/\S/)
    
    // Extract label from line
    const match = trimmed.match(/^-\s+(.+)$/)
    if (!match) continue

    let label = match[1].trim()
    
    // Remove image references from label
    if (label.includes('images:')) {
      label = label.split('images:')[0].trim()
    }

    // Generate node ID
    const nodeId = `node-${Date.now()}-${nodeCounter++}`

    // Create new node
    const newNode: Node = {
      id: nodeId,
      type: 'mindmap',
      data: {
        label,
        images: [],
        isEditable: true,
        ...getNodeHandlers(),
      },
      position: { x: 0, y: 0 },
    }

    // Find parent based on indentation
    while (parentStack.length > 0 && parentStack[parentStack.length - 1].indent >= indent) {
      parentStack.pop()
    }

    if (parentStack.length > 0) {
      const parentId = parentStack[parentStack.length - 1].nodeId
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
      })
    }

    nodes.push(newNode)
    parentStack.push({ nodeId, indent })
  }

  return { nodes, edges }
}

export default function YAMLEditor({ nodes, edges, onYAMLChange, isOpen, onToggle }: YAMLEditorProps) {
  const [yaml, setYAML] = useState(nodesToYAML(nodes, edges))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setYAML(nodesToYAML(nodes, edges))
  }, [nodes, edges])

  const handleYAMLChange = (newYAML: string) => {
    setYAML(newYAML)
  }

  const applyYAMLChanges = () => {
    try {
      const { nodes: newNodes, edges: newEdges } = yamlToNodes(yaml, nodes, edges)
      if (newNodes.length > 0) {
        console.log('[v0] Applying YAML changes - new nodes:', newNodes.length, 'new edges:', newEdges.length)
        onYAMLChange(newNodes, newEdges)
        alert('Mind map updated from YAML!')
      } else {
        alert('No valid nodes found in YAML. Check the format.')
      }
    } catch (error) {
      console.error('[v0] Error parsing YAML:', error)
      alert(`Error parsing YAML: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(yaml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border-l border-border bg-card">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-primary/5 transition-colors border-b border-border"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        <span className="font-semibold text-sm">YAML Editor</span>
      </button>

      {isOpen && (
        <div className="flex flex-col h-full">
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
            className="flex-1 p-3 font-mono text-xs bg-background text-foreground border-0 resize-none focus:outline-none"
            placeholder="- Root Node
  children:
    - Child 1
    - Child 2"
          />

          <div className="p-3 text-xs text-muted-foreground border-t border-border bg-muted/20">
            <p className="mb-2 font-semibold">Format:</p>
            <code className="block text-[10px] leading-relaxed">
              - Node Text<br/>
              &nbsp;&nbsp;children:<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;- Child Node<br/>
            </code>
          </div>
        </div>
      )}
    </div>
  )
}
