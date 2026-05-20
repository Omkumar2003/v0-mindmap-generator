'use client'

import { useCallback, useMemo, useEffect, useRef, useState } from 'react'
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
  OnNodesChange,
  Position,
  Panel,
  MarkerType,
  useReactFlow, // Hook to control viewport
} from 'reactflow'
import dagre from 'dagre'
import 'reactflow/dist/style.css'
import MindMapNode from './MindMapNode'
import { Button } from '@/components/ui/button'
import { LayoutGrid, ArrowDown, ArrowRight, Undo2, Redo2 } from 'lucide-react'

const nodeTypes = {
  mindmap: MindMapNode,
}

const BRANCH_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#ec4899'
]

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const calculateNodeDimensions = (label: string) => {
  const text = label || "New Concept";
  const estimatedWidth = Math.min(Math.max(text.length * 8 + 40, 120), 280);
  const estimatedHeight = 60; 
  return { width: estimatedWidth, height: estimatedHeight };
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ 
    rankdir: direction,
    ranksep: isHorizontal ? 60 : 50,
    nodesep: isHorizontal ? 20 : 35,
    marginx: 40,
    marginy: 40
  })

  nodes.forEach((node) => {
    const label = (node.data?.label || "").trim().replace(/\n\s*\n/g, '\n');
    const { width, height } = calculateNodeDimensions(label);
    dagreGraph.setNode(node.id, { width, height });
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const { width, height } = calculateNodeDimensions(node.data?.label);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

export default function MindMapEditor({
  initialNodes = [],
  initialEdges = [],
  onNodesChange,
  onEdgesChange,
  isEditable = true,
}: any) {
  const [nodes, setNodes, onNodesChange_internal] = useNodesState([])
  const [edges, setEdges, onEdgesChange_internal] = useEdgesState([])
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB')
  
  // React Flow instance for programmatic viewport control
  const { fitView } = useReactFlow();

  const [past, setPast] = useState<{nodes: Node[], edges: Edge[]}[]>([])
  const [future, setFuture] = useState<{nodes: Node[], edges: Edge[]}[]>([])
  
  const isInternalUpdate = useRef(false)

  // Snapshot Helper
  const takeSnapshot = useCallback(() => {
    setPast(prev => [...prev, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }].slice(-20));
    setFuture([]);
  }, [nodes, edges]);

  // Undo with auto-fit
  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setFuture(prev => [{ nodes, edges }, ...prev]);
    setPast(newPast);
    setNodes(previous.nodes);
    setEdges(previous.edges);
    onNodesChange?.(previous.nodes);
    onEdgesChange?.(previous.edges);
    window.requestAnimationFrame(() => fitView({ duration: 400 }));
  }, [past, nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, fitView]);

  // Redo with auto-fit
  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast(prev => [...prev, { nodes, edges }]);
    setFuture(newFuture);
    setNodes(next.nodes);
    setEdges(next.edges);
    onNodesChange?.(next.nodes);
    onEdgesChange?.(next.edges);
    window.requestAnimationFrame(() => fitView({ duration: 400 }));
  }, [future, nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, fitView]);

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const getStyledEdges = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    const targetIds = new Set(currentEdges.map(e => e.target));
    const rootNode = currentNodes.find(n => !targetIds.has(n.id)) || currentNodes[0];
    if (!rootNode) return currentEdges;

    const level1Edges = currentEdges.filter(e => e.source === rootNode.id);
    const branchMap: Record<string, number> = {}; 
    level1Edges.forEach((edge, index) => { branchMap[edge.target] = index; });

    let changed = true;
    while (changed) {
      changed = false;
      currentEdges.forEach(edge => {
        if (branchMap[edge.source] !== undefined && branchMap[edge.target] === undefined) {
          branchMap[edge.target] = branchMap[edge.source];
          changed = true;
        }
      });
    }

    return currentEdges.map(edge => {
      const isFromRoot = edge.source === rootNode.id;
      const branchIdx = branchMap[edge.target] ?? branchMap[edge.source];
      const color = isFromRoot ? '#94a3b8' : (branchIdx !== undefined ? BRANCH_COLORS[branchIdx % BRANCH_COLORS.length] : '#94a3b8');

      return {
        ...edge,
        type: 'smoothstep',
        style: { stroke: color, strokeWidth: isFromRoot ? 2 : 3, strokeOpacity: isFromRoot ? 0.5 : 0.9 },
        markerEnd: { type: MarkerType.ArrowClosed, color: color, width: 18, height: 18 },
      };
    });
  }, []);

  const notifyParent = useCallback((updatedNodes: Node[], updatedEdges: Edge[]) => {
    isInternalUpdate.current = true
    requestAnimationFrame(() => {
      onNodesChange?.(updatedNodes)
      onEdgesChange?.(updatedEdges)
      isInternalUpdate.current = false
    })
  }, [onNodesChange, onEdgesChange])

  const onLayout = useCallback((direction: 'TB' | 'LR') => {
    takeSnapshot();
    setLayoutDirection(direction)
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, direction)
    const styledEdges = getStyledEdges(layoutedNodes, layoutedEdges)
    setNodes([...layoutedNodes])
    setEdges(styledEdges)
    notifyParent(layoutedNodes, styledEdges)
    
    // AUTO FIT VIEW AFTER LAYOUT
    window.requestAnimationFrame(() => fitView({ duration: 500, padding: 0.1 }));
  }, [nodes, edges, setNodes, setEdges, notifyParent, getStyledEdges, takeSnapshot, fitView])

  useEffect(() => {
    if (isInternalUpdate.current) return
    if (initialNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges, layoutDirection)
      const styledEdges = getStyledEdges(layoutedNodes, layoutedEdges)
      setNodes(layoutedNodes)
      setEdges(styledEdges)
      
      // Auto fit on initial load
      if (nodes.length === 0) {
        window.requestAnimationFrame(() => fitView({ padding: 0.2 }));
      }
    }
  }, [initialNodes, initialEdges, layoutDirection, setNodes, setEdges, getStyledEdges, fitView, nodes.length])

  const onConnect = useCallback((connection: Connection) => {
      takeSnapshot();
      const newEdges = addEdge(connection, edges)
      setEdges(getStyledEdges(nodes, newEdges))
      notifyParent(nodes, newEdges)
    }, [edges, nodes, setEdges, notifyParent, getStyledEdges, takeSnapshot]
  )

  const handleNodeChange = useCallback((nodeId: string, label: string) => {
    takeSnapshot();
    setNodes(prevNodes => {
        const sanitizedLabel = label.trim().replace(/\n\s*\n/g, '\n');
        const updatedNodes = prevNodes.map(node =>
            node.id === nodeId ? { ...node, data: { ...node.data, label: sanitizedLabel } } : node
        )
        const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(updatedNodes, edges, layoutDirection);
        const styledEdges = getStyledEdges(layouted, layoutedEdges);
        setEdges(styledEdges);
        notifyParent(layouted, styledEdges);
        return layouted;
    })
  }, [edges, layoutDirection, notifyParent, getStyledEdges, takeSnapshot])

  const handleDeleteNode = useCallback((nodeId: string) => {
    takeSnapshot();
    setNodes(prevNodes => {
      const filteredNodes = prevNodes.filter(n => n.id !== nodeId)
      const filteredEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId)
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(filteredNodes, filteredEdges, layoutDirection)
      const styledEdges = getStyledEdges(layoutedNodes, layoutedEdges)
      setEdges(styledEdges)
      notifyParent(layoutedNodes, styledEdges)
      window.requestAnimationFrame(() => fitView({ duration: 400 }));
      return layoutedNodes
    })
  }, [edges, setNodes, setEdges, notifyParent, layoutDirection, getStyledEdges, takeSnapshot, fitView])

  const handleAddChild = useCallback((parentNodeId: string) => {
    takeSnapshot();
    const newId = `node-${Date.now()}`
    setNodes(prevNodes => {
      const newNode: Node = {
        id: newId,
        type: 'mindmap',
        data: { label: 'New concept', images: [], isEditable: true },
        position: { x: 0, y: 0 },
      }
      const newEdge: Edge = {
        id: `edge-${parentNodeId}-${newId}`,
        source: parentNodeId,
        target: newId,
      }
      const updatedNodes = [...prevNodes, newNode]
      const updatedEdges = [...edges, newEdge]
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(updatedNodes, updatedEdges, layoutDirection)
      const styledEdges = getStyledEdges(layoutedNodes, layoutedEdges)
      setEdges(styledEdges)
      notifyParent(layoutedNodes, styledEdges)
      window.requestAnimationFrame(() => fitView({ duration: 400 }));
      return layoutedNodes
    })
  }, [edges, setNodes, setEdges, notifyParent, layoutDirection, getStyledEdges, takeSnapshot, fitView])

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
    <div className="w-full h-[85vh] bg-background">
      <ReactFlow
        nodes={mappedNodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange_internal}
        onEdgesChange={onEdgesChange_internal}
        nodeTypes={nodeTypes}
      >
        <Background />
        <Controls />
        <MiniMap />
        
        <Panel position="top-right" className="flex flex-col gap-2 scale-90 origin-top-right">
          {/* History Panel */}
          <div className="bg-card/80 backdrop-blur p-1.5 rounded-xl border border-border shadow-xl flex gap-1 items-center">
            <div className="flex items-center gap-2 px-2 border-r border-border mr-1 py-1">
              <LayoutGrid className="w-4 h-4 text-primary" />
              <span className="text-[13px] font-black uppercase tracking-tighter text-muted-foreground">History</span>
            </div>
            <Button variant="ghost" size="icon" onClick={undo} disabled={past.length === 0} className="h-8 w-8 hover:bg-primary/10 disabled:opacity-30">
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0} className="h-8 w-8 hover:bg-primary/10 disabled:opacity-30">
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Layout Panel */}
          <div className="bg-card/80 backdrop-blur p-1.5 rounded-xl border border-border shadow-xl flex gap-1 items-center">
            <div className="flex items-center gap-2 px-2 border-r border-border mr-1 py-1">
              <LayoutGrid className="w-4 h-4 text-primary" />
              <span className="text-[13px] font-black uppercase tracking-tighter text-muted-foreground">Layout</span>
            </div>
            <Button variant={layoutDirection === 'TB' ? "secondary" : "ghost"} size="sm" onClick={() => onLayout('TB')} className="h-7 gap-1 px-2">
              <ArrowDown className="w-3 h-3" />
              <span className="text-[13px] font-bold">Vertical</span>
            </Button>
            <Button variant={layoutDirection === 'LR' ? "secondary" : "ghost"} size="sm" onClick={() => onLayout('LR')} className="h-7 gap-1 px-2">
              <ArrowRight className="w-3 h-3" />
              <span className="text-[13px] font-bold">Horizontal</span>
            </Button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}