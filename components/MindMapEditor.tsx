'use client'

import { useCallback, useMemo } from 'react'
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

// Pure function for calculating layout
const calculateLayoutPositions = (nodesToLayout: Node[], edgesToLayout: Edge[]) => {
  const positions = new Map<string, { x: number; y: number }>()
  const visited = new Set<string>()
  const horizontalSpacing = 350
  const verticalSpacing = 200

  function layoutBranch(nodeId: string, x: number, y: number) {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    positions.set(nodeId, { x, y })

    const childEdges = edgesToLayout.filter(e => e.source === nodeId)
    if (childEdges.length === 0) return

    const childCount = childEdges.length
    const totalHeight = childCount * verticalSpacing
    const startY = y - totalHeight / 2

    childEdges.forEach((edge, index) => {
      const childY = startY + index * verticalSpacing
      const childX = x + horizontalSpacing
      layoutBranch(edge.target, childX, childY)
    })
  }

  const rootNode = nodesToLayout.find(n => n.id === 'root') || nodesToLayout[0]
  if (rootNode) {
    layoutBranch(rootNode.id, 0, 0)
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
    setNodes(n => n.map(node =>
      node.id === nodeId ? { ...node, data: { ...node.data, label } } : node
    ))
  }, [setNodes])

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
          onChangeLabel: handleNodeChange,
          onDelete: handleDeleteNode,
          onAddChild: handleAddChild,
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
