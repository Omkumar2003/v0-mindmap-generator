'use client'

import { useCallback, useState } from 'react'
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
      const updatedNodes = nodes.filter(node => node.id !== nodeId)
      const updatedEdges = edges.filter(
        edge => edge.source !== nodeId && edge.target !== nodeId
      )
      setNodes(updatedNodes)
      setEdges(updatedEdges)
      onNodesChange?.(updatedNodes)
      onEdgesChange?.(updatedEdges)
    },
    [nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange]
  )

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
          x: parentNode.position.x + 200,
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
      setNodes(updatedNodes)
      setEdges(updatedEdges)
      onNodesChange?.(updatedNodes)
      onEdgesChange?.(updatedEdges)
    },
    [nodes, edges, setNodes, setEdges, handleNodeChange, handleDeleteNode, isEditable, onNodesChange, onEdgesChange]
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onChangeLabel: handleNodeChange,
            onDelete: handleDeleteNode,
            onAddChild: handleAddChild,
            isEditable,
          },
        }))}
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
