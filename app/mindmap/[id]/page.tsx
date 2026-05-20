'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader, RefreshCw, Save, Download } from 'lucide-react'
import dynamic from 'next/dynamic'
import YAMLEditor from '@/components/YAMLEditor'
import { exportMindMapAsImage } from '@/lib/mindmap-export'
import type { Node, Edge } from 'reactflow'

const MindMapEditor = dynamic(() => import('@/components/MindMapEditor'), {
  ssr: false,
})

interface Document {
  id: string
  title: string
  content: string
}

interface MindMapData {
  id: string
  title: string
  root_node: Node[]
  edges: Edge[]
}

export default function MindMapPage() {
  const router = useRouter()
  const params = useParams()
  const docId = params.id as string

  const [document, setDocument] = useState<Document | null>(null)
  const [mindmap, setMindmap] = useState<MindMapData | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [yamlEditorOpen, setYamlEditorOpen] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [docId])

  // Auto-save nodes and edges every 5 seconds
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    if (nodes.length > 0 && mindmap) {
      autoSaveTimerRef.current = setTimeout(() => {
        autoSaveMindMap()
      }, 5000) // Auto-save every 5 seconds
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [nodes, edges, mindmap])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Fetch document
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .eq('user_id', user.id)
        .single()

      if (docError) throw docError
      setDocument(docData)

      // Fetch or create mindmap
      const { data: mmData } = await supabase
        .from('mindmaps')
        .select('*')
        .eq('document_id', docId)
        .eq('user_id', user.id)
        .single()

      if (mmData) {
        setMindmap(mmData)
        setNodes(Array.isArray(mmData.root_node) ? mmData.root_node : [])
        setEdges(mmData.edges || [])
      } else {
        // Create initial mindmap with root node
        const initialNodes: Node[] = [
          {
            id: 'root',
            type: 'mindmap',
            data: {
              label: docData.title,
              onChangeLabel: () => {},
              onDelete: () => {},
              onAddChild: () => {},
              isEditable: true,
            },
            position: { x: 0, y: 0 },
          },
        ]
        setNodes(initialNodes)
        setEdges([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMindMap = async () => {
    if (!document) return

    try {
      setGenerating(true)
      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: docId,
          documentTitle: document.title,
          documentContent: document.content,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate mind map')
      }

      const data = await response.json()
      console.log('[v0] Generated mindmap:', data)
      setNodes(data.nodes)
      setEdges(data.edges)
      if (data.mindmapId) {
        setMindmap({ id: data.mindmapId, title: document.title, root_node: data.nodes, edges: data.edges })
      }
      alert('Mind map generated successfully!')
    } catch (error) {
      console.error('[v0] Error generating mind map:', error)
      alert(`Failed to generate mind map: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleYAMLChange = (newNodes: Node[], newEdges: Edge[]) => {
    console.log('[v0] handleYAMLChange called with nodes:', newNodes.length, 'edges:', newEdges.length)
    
    // Add handler callbacks to new nodes
    const nodesWithHandlers = newNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onChangeLabel: () => {},
        onDelete: () => {},
        onAddChild: () => {},
        isEditable: true,
      }
    }))
    
    setNodes(nodesWithHandlers)
    setEdges(newEdges)
  }

  const handleExportAsImage = async () => {
    try {
      const element = document.querySelector('[role="presentation"]') as HTMLElement
      if (!element) {
        alert('Cannot find mindmap visualization. Please ensure the mindmap is loaded.')
        return
      }
      
      await exportMindMapAsImage('react-flow-container', document?.title || 'mindmap')
      alert('Mind map exported successfully!')
    } catch (error) {
      console.error('[v0] Error exporting mindmap:', error)
      alert(`Failed to export mindmap: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const autoSaveMindMap = async () => {
    if (!document || nodes.length === 0 || !mindmap) return

    try {
      setAutoSaveStatus('saving')
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const response = await fetch(`/api/mindmaps/${mindmap.id}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes,
          edges,
          root_node: nodes,
        }),
      })

      if (response.ok) {
        console.log('[v0] Auto-saved mindmap successfully')
        setAutoSaveStatus('saved')
        // Reset to idle after 2 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      }
    } catch (error) {
      console.error('[v0] Error auto-saving mindmap:', error)
      setAutoSaveStatus('idle')
    }
  }

  const handleSaveMindMap = async () => {
    if (!document || nodes.length === 0) {
      alert('No mind map to save. Generate one first!')
      return
    }

    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('Not authenticated')
        return
      }

      if (mindmap) {
        // Update existing mindmap
        const { error } = await supabase
          .from('mindmaps')
          .update({
            root_node: nodes,
            edges: edges,
            nodes: nodes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', mindmap.id)
          .eq('user_id', user.id)

        if (error) throw error
        console.log('[v0] Mind map updated successfully')
      } else {
        // Create new mindmap
        const { data, error } = await supabase
          .from('mindmaps')
          .insert({
            user_id: user.id,
            document_id: docId,
            title: `${document.title} Mind Map`,
            root_node: nodes,
            edges: edges,
            nodes: nodes,
          })
          .select()
          .single()

        if (error) {
          console.error('[v0] Error inserting mindmap:', error)
          throw error
        }
        setMindmap(data)
        console.log('[v0] Mind map created successfully:', data)
      }

      alert('Mind map saved successfully!')
    } catch (error) {
      console.error('[v0] Error saving mind map:', error)
      alert(`Failed to save mind map: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-card z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{document?.title}</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Mind Map View</p>
                {autoSaveStatus === 'saving' && (
                  <span className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                    <Loader className="w-3 h-3 animate-spin" />
                    Auto-saving...
                  </span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Save className="w-3 h-3" />
                    Saved
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleGenerateMindMap}
              disabled={generating}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Generate with AI'}
            </Button>
            {nodes.length > 0 && (
              <Button
                onClick={handleExportAsImage}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export Image
              </Button>
            )}
            <Button
              onClick={handleSaveMindMap}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? 'Saving...' : 'Save Mind Map'}
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative w-full flex">
        <div className="flex-1 relative">
          {nodes.length > 0 ? (
            <MindMapEditor
              initialNodes={nodes}
              initialEdges={edges}
              onNodesChange={setNodes}
              onEdgesChange={setEdges}
              isEditable={true}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">No mind map yet</p>
                <Button
                  onClick={handleGenerateMindMap}
                  disabled={generating}
                  className="bg-primary hover:bg-primary/90 gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'Generating...' : 'Generate Mind Map'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className={`transition-all duration-300 ${yamlEditorOpen ? 'w-80' : 'w-0'} overflow-hidden flex flex-col`}>
          {nodes.length > 0 && (
            <YAMLEditor
              nodes={nodes}
              edges={edges}
              onYAMLChange={handleYAMLChange}
              isOpen={yamlEditorOpen}
              onToggle={() => setYamlEditorOpen(!yamlEditorOpen)}
            />
          )}
        </div>
      </main>

      {nodes.length > 0 && !yamlEditorOpen && (
        <button
          onClick={() => setYamlEditorOpen(true)}
          className="fixed bottom-6 right-6 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-lg transition-all"
          title="Open YAML Editor"
        >
          YAML
        </button>
      )}
    </div>
  )
}
