'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader, RefreshCw } from 'lucide-react'
import dynamic from 'next/dynamic'
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
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [docId])

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
          title: document.title,
          content: document.content,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate mind map')

      const data = await response.json()
      setNodes(data.nodes)
      setEdges(data.edges)
    } catch (error) {
      console.error('Error generating mind map:', error)
      alert('Failed to generate mind map')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveMindMap = async () => {
    if (!document) return

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
            updated_at: new Date().toISOString(),
          })
          .eq('id', mindmap.id)

        if (error) throw error
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
          })
          .select()
          .single()

        if (error) throw error
        setMindmap(data)
      }

      alert('Mind map saved successfully')
    } catch (error) {
      console.error('Error saving mind map:', error)
      alert('Failed to save mind map')
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
              <p className="text-xs text-muted-foreground">Mind Map View</p>
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

      <main className="flex-1 relative w-full">
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
      </main>
    </div>
  )
}
