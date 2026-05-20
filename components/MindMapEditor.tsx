'use client'

import { useCallback, useMemo, useEffect } from 'react'
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

const nodeTypes = {
  mindmap: MindMapNode,
}

// Pure function for calculating top-down hierarchical layout
const calculateLayoutPositions = (nodesToLayout: Node[], edgesToLayout: Edge[]) => {
  const positions = new Map<string, { x: number; y: number }>()
  const visited = new Set<string>()
  const verticalSpacing = 120 // Space between levels
  const horizontalSpacing = 280 // Space between siblings

  // Build parent-child relationships
  const childrenMap = new Map<string, string[]>()
  edgesToLayout.forEach(edge => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, [])
    }
    childrenMap.get(edge.source)?.push(edge.target)
  })

  // Calculate tree width for proper centering
  function getTreeWidth(nodeId: string): number {
    const children = childrenMap.get(nodeId) || []
    if (children.length === 0) return horizontalSpacing
    return children.reduce((sum, child) => sum + getTreeWidth(child), 0) + (children.length - 1) * 0
  }

  // Recursive layout function for top-down approach
  function layoutNode(nodeId: string, x: number, y: number, siblingIndex: number = 0): number {
    if (visited.has(nodeId)) return x
    visited.add(nodeId)
    positions.set(nodeId, { x, y })

    const children = childrenMap.get(nodeId) || []
    if (children.length === 0) return x

    const totalChildWidth = children.reduce((sum) => sum + horizontalSpacing, 0)
    const startX = x - totalChildWidth / 2 + horizontalSpacing / 2

    let currentX = startX
    children.forEach((childId) => {
      layoutNode(childId, currentX, y + verticalSpacing, 0)
      currentX += horizontalSpacing
    })

    return x
  }

  const rootNode = nodesToLayout.find(n => n.id === 'root') || nodesToLayout[0]
  if (rootNode) {
    layoutNode(rootNode.id, 0, 0)
  }

  return nodesToLayout.map(node =>
    positions.has(node.id)
      ? { ...node, position: positions.get(node.id)! }
      : node
  )
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

  // Sync when initialNodes or initialEdges change (e.g., from YAML editor)
  useEffect(() => {
    console.log('[v0] MindMapEditor received new nodes:', initialNodes.length, 'edges:', initialEdges.length)
    if (initialNodes.length > 0) {
      const layoutedNodes = calculateLayoutPositions(initialNodes, initialEdges)
      setNodes(layoutedNodes)
      setEdges(initialEdges)
    }
  }, [initialNodes.length, initialEdges.length])

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
    },
    [onNodesChange_internal]
  )

  // Create stable callback references that don't cause circular dependencies
  const handleNodeChange = useCallback((nodeId: string, label: string) => {
    setNodes(prevNodes => {
      const updatedNodes = prevNodes.map(node =>
        node.id === nodeId ? { ...node, data: { ...node.data, label } } : node
      )
      console.log('[v0] Node label changed:', nodeId, label)
      onNodesChange?.(updatedNodes)
      return updatedNodes
    })
  }, [setNodes, onNodesChange])

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (nodeId === 'root') return
    setNodes(prevNodes => {
      const updated = prevNodes.filter(n => n.id !== nodeId)
      setEdges(prevEdges => {
        const updatedEdges = prevEdges.filter(
          e => e.source !== nodeId && e.target !== nodeId
        )
        const layouted = calculateLayoutPositions(updated, updatedEdges)
        onNodesChange?.(layouted)
        onEdgesChange?.(updatedEdges)
        return updatedEdges
      })
      return calculateLayoutPositions(updated, edges.filter(
        e => e.source !== nodeId && e.target !== nodeId
      ))
    })
  }, [edges, setEdges, onNodesChange, onEdgesChange])

  const handleAddChild = useCallback((parentNodeId: string) => {
    setNodes(prevNodes => {
      const parent = prevNodes.find(n => n.id === parentNodeId)
      if (!parent) return prevNodes

      const newId = `node-${Date.now()}`
      const newNode: Node = {
        id: newId,
        type: 'mindmap',
        data: {
          label: 'New Concept',
          images: [],
          onChangeLabel: handleNodeChange,
          onDelete: handleDeleteNode,
          onAddChild: handleAddChild,
          onImageUpload: handleImageUpload,
          onImageDelete: handleImageDelete,
          isEditable,
        },
        position: { x: 0, y: 0 },
      }

      const updated = [...prevNodes, newNode]
      const newEdge: Edge = {
        id: `edge-${parentNodeId}-${newId}`,
        source: parentNodeId,
        target: newId,
      }

      setEdges(prevEdges => {
        const updatedEdges = [...prevEdges, newEdge]
        const layouted = calculateLayoutPositions(updated, updatedEdges)
        onNodesChange?.(layouted)
        onEdgesChange?.(updatedEdges)
        return updatedEdges
      })

      return calculateLayoutPositions(updated, [...edges, newEdge])
    })
  }, [handleNodeChange, handleDeleteNode, isEditable, edges, setEdges, onNodesChange, onEdgesChange])

  const handleImageUpload = useCallback((nodeId: string, imageUrl: string) => {
    setNodes(n => n.map(node =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              images: [...(node.data.images || []), imageUrl],
            },
          }
        : node
    ))
  }, [setNodes])

  const handleImageDelete = useCallback((nodeId: string, imageIndex: number) => {
    setNodes(n => n.map(node =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              images: (node.data.images || []).filter((_, i) => i !== imageIndex),
            },
          }
        : node
    ))
  }, [setNodes])

  const mappedNodes = useMemo(
    () =>
      nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onChangeLabel: handleNodeChange,
          onDelete: handleDeleteNode,
          onAddChild: handleAddChild,
          onImageUpload: handleImageUpload,
          onImageDelete: handleImageDelete,
          isEditable,
        },
      })),
    [nodes, handleNodeChange, handleDeleteNode, handleAddChild, handleImageUpload, handleImageDelete, isEditable]
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
