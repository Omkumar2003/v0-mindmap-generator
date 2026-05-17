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
  const rootNode = nodes.find(n => n.id === 'root')
  if (!rootNode) return ''

  const edgeMap = new Map<string, string[]>()
  edges.forEach(edge => {
    if (!edgeMap.has(edge.source)) edgeMap.set(edge.source, [])
    edgeMap.get(edge.source)?.push(edge.target)
  })

  const nodeMap = new Map<string, Node>()
  nodes.forEach(node => nodeMap.set(node.id, node))

  const buildYAML = (nodeId: string, indent: number = 0): string => {
    const node = nodeMap.get(nodeId)
    if (!node) return ''

    const indentStr = '  '.repeat(indent)
    let yaml = `${indentStr}- ${node.data.label}`

    if (node.data.images && node.data.images.length > 0) {
      yaml += `\n${indentStr}  images:`
      node.data.images.forEach((img) => {
        yaml += `\n${indentStr}    - ${img.substring(0, 50)}...`
      })
    }

    const children = edgeMap.get(nodeId) || []
    if (children.length > 0) {
      yaml += `\n${indentStr}  children:`
      children.forEach(childId => {
        const childYaml = buildYAML(childId, indent + 2)
        yaml += '\n' + childYaml
      })
    }

    return yaml
  }

  return buildYAML(rootNode.id)
}

// Parse YAML format back to mindmap nodes and edges
const yamlToNodes = (yaml: string, existingNodes: Node[], existingEdges: Edge[]): { nodes: Node[], edges: Edge[] } => {
  const lines = yaml.split('\n').filter(line => line.trim())
  const nodes: Node[] = []
  const edges: Edge[] = []
  const nodeMap = new Map<string, string>()

  let nodeCounter = 0
  const parseLines = (lineArray: string[], parentId: string | null = null, depth: number = 0) => {
    let i = 0
    while (i < lineArray.length) {
      const line = lineArray[i]
      const indent = line.search(/\S/)
      const expectedIndent = depth * 2

      if (indent === -1) {
        i++
        continue
      }

      if (indent < expectedIndent) break
      if (indent > expectedIndent) {
        i++
        continue
      }

      const match = line.match(/^(\s*)-\s+(.+)$/)
      if (match) {
        const label = match[2].trim()
        const nodeId = `node-${Date.now()}-${nodeCounter++}`
        const position = existingNodes.find(n => n.data.label === label)?.position || { x: 0, y: 0 }

        nodes.push({
          id: nodeId,
          type: 'mindmap',
          data: {
            label,
            images: [],
            onChangeLabel: () => {},
            onDelete: () => {},
            onAddChild: () => {},
            isEditable: true,
          },
          position,
        })

        if (parentId) {
          edges.push({
            id: `edge-${parentId}-${nodeId}`,
            source: parentId,
            target: nodeId,
          })
        }

        nodeMap.set(label, nodeId)
      }

      i++
    }
  }

  const relevantLines = lines.filter(line => !line.includes('images:') && !line.includes('children:'))
  parseLines(relevantLines)

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
        onYAMLChange(newNodes, newEdges)
        alert('Mind map updated from YAML!')
      }
    } catch (error) {
      console.error('Error parsing YAML:', error)
      alert('Error parsing YAML format')
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
