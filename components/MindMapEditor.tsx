'use client'

import { useCallback, useState, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
} from 'reactflow'
import 'reactflow/dist/style.css'
import MindMapNode from './MindMapNode'

// Move nodeTypes outside component to avoid recreation warning
const nodeTypes = {
  mindmap: MindMapNode,
}

interface MindMapEditorProps {
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onNodesChange?: (nodes: Node[]) => void
  onEdgesChange?: (edges: Edge[]) => void
  isEditable?: boolean
}

export default function MindMapEditor({
  initialNodes = [],
  initialEdges = [],
  onNodesChange,
  onEdgesChange,
  isEditable = true,
}: MindMapEditorProps) {
  const [nodes, setNodes, onNodesChange_internal] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange_internal] = useEdgesState(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdges = addEdge(connection, edges)
      setEdges(newEdges)
      onEdgesChange?.(newEdges)
    },
    [edges, setEdges, onEdgesChange]
  )

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange_internal(changes)
      const updatedNodes = nodes.map(node => {
        const nodeChange = changes.find((c: any) => c.id === node.id)
        if (nodeChange?.type === 'position' && nodeChange.position) {
          return { ...node, position: nodeChange.position }
        }
        return node
      })
      onNodesChange?.(updatedNodes)
    },
    [nodes, onNodesChange_internal, onNodesChange]
  )

  const handleNodeChange = useCallback(
    (nodeId: string, label: string) => {
      const updatedNodes = nodes.map(node =>
        node.id === nodeId ? { ...node, data: { ...node.data, label } } : node
      )
      setNodes(updatedNodes)
      onNodesChange?.(updatedNodes)
    },
    [nodes, setNodes, onNodesChange]
  )

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (nodeId === 'root') return // Prevent deleting root node

      const updatedNodes = nodes.filter(node => node.id !== nodeId)
      const updatedEdges = edges.filter(
        edge => edge.source !== nodeId && edge.target !== nodeId
      )

      // Apply auto-layout after deletion
      const layoutedNodes = calculateLayout(updatedNodes, updatedEdges)
      setNodes(layoutedNodes)
      setEdges(updatedEdges)
      onNodesChange?.(layoutedNodes)
      onEdgesChange?.(updatedEdges)
    },
    [nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, calculateLayout]
  )

  // Calculate hierarchical layout for nodes
  const calculateLayout = useCallback((nodesToLayout: Node[], edgesToLayout: Edge[]) => {
    const positions = new Map<string, { x: number; y: number }>()
    const visited = new Set<string>()
    const nodeWidths = 280
    const nodeHeights = 150
    const horizontalSpacing = 350
    const verticalSpacing = 200

    function layoutBranch(nodeId: string, x: number, y: number, depth: number) {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      positions.set(nodeId, { x, y })

      // Find children of this node
      const childEdges = edgesToLayout.filter(e => e.source === nodeId)
      if (childEdges.length === 0) return

      // Distribute children vertically
      const childCount = childEdges.length
      const totalHeight = childCount * verticalSpacing
      const startY = y - totalHeight / 2

      childEdges.forEach((edge, index) => {
        const childY = startY + index * verticalSpacing
        const childX = x + horizontalSpacing
        layoutBranch(edge.target, childX, childY, depth + 1)
      })
    }

    // Start layout from root node
    const rootNode = nodesToLayout.find(n => n.id === 'root') || nodesToLayout[0]
    if (rootNode) {
      layoutBranch(rootNode.id, 0, 0, 0)
    }

    // Apply calculated positions
    return nodesToLayout.map(node =>
      positions.has(node.id)
        ? { ...node, position: positions.get(node.id)! }
        : node
    )
  }, [])

  const handleAddChild = useCallback(
    (parentNodeId: string) => {
      const parentNode = nodes.find(n => n.id === parentNodeId)
      if (!parentNode) return

      const newNodeId = `node-${Date.now()}`
      const newNode: Node = {
        id: newNodeId,
        type: 'mindmap',
        data: {
          label: 'New Concept',
          onChangeLabel: handleNodeChange,
          onDelete: handleDeleteNode,
          onAddChild: handleAddChild,
          isEditable,
        },
        position: {
          x: parentNode.position.x + 300,
          y: parentNode.position.y + 100,
        },
      }

      const newEdge: Edge = {
        id: `edge-${parentNodeId}-${newNodeId}`,
        source: parentNodeId,
        target: newNodeId,
      }

      const updatedNodes = [...nodes, newNode]
      const updatedEdges = [...edges, newEdge]

      // Apply auto-layout
      const layoutedNodes = calculateLayout(updatedNodes, updatedEdges)
      setNodes(layoutedNodes)
      setEdges(updatedEdges)
      onNodesChange?.(layoutedNodes)
      onEdgesChange?.(updatedEdges)
    },
    [nodes, edges, setNodes, setEdges, handleNodeChange, handleDeleteNode, isEditable, onNodesChange, onEdgesChange, calculateLayout]
  )

  // Memoize mapped nodes to avoid recreation on every render
  const mappedNodes = useMemo(
    () =>
      nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChangeLabel: handleNodeChange,
          onDelete: handleDeleteNode,
          onAddChild: handleAddChild,
          isEditable,
        },
      })),
    [nodes, handleNodeChange, handleDeleteNode, handleAddChild, isEditable]
  )

  return (
    <div className="w-full h-screen bg-background">
      <ReactFlow
        nodes={mappedNodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange_internal}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
