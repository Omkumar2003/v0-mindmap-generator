'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ReactFlowProvider } from 'reactflow'
import { cn } from '@/lib/utils'
import { 
  ArrowLeft, 
  Loader, 
  RefreshCw, 
  Save, 
  Download, 
  FileCode, 
  AlertCircle,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  ChevronRight,
  Database,
  Cloud,
  Layers,
  Sparkles,
  HelpCircle,
  Activity,
  Info,
  Command
} from 'lucide-react'
import dynamic from 'next/dynamic'
import YAMLEditor from '@/components/YAMLEditor'
import { exportMindMapAsImage } from '@/lib/mindmap-export'
import type { Node, Edge } from 'reactflow'
import { formatDistanceToNow } from 'date-fns' // For metadata info

/** 
 * MindMapEditor dynamic import.
 */
const MindMapEditor = dynamic(() => import('@/components/MindMapEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full gap-4 bg-background/50">
      <div className="relative flex items-center justify-center">
        <Loader className="w-16 h-16 animate-spin text-primary/20" />
        <Layers className="w-6 h-6 text-primary absolute animate-pulse" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-bold tracking-[0.2em] uppercase text-foreground/80">Initializing</p>
        <p className="text-xs text-muted-foreground">Preparing visual canvas...</p>
      </div>
    </div>
  ),
})

interface DocumentRecord {
  id: string
  title: string
  content: string
  created_at?: string
  updated_at?: string
  user_id?: string
}

interface MindMapRecord {
  id: string
  title: string
  root_node: Node[]
  edges: Edge[]
  document_id?: string
  user_id?: string
  updated_at?: string
}

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function MindMapPage() {
  const router = useRouter()
  const params = useParams()
  const docId = params.id as string

  const [docRecord, setDocRecord] = useState<DocumentRecord | null>(null)
  const [mindmap, setMindmap] = useState<MindMapRecord | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [yamlEditorOpen, setYamlEditorOpen] = useState<boolean>(false)
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle')
  
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .eq('user_id', user.id)
        .single()

      if (docError) throw docError
      setDocRecord(docData)

      const { data: mmData, error: mmError } = await supabase
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
        const initialNodes: Node[] = [{
            id: 'root',
            type: 'mindmap',
            data: { label: docData.title, onChangeLabel: () => {}, onDelete: () => {}, onAddChild: () => {}, isEditable: true },
            position: { x: 0, y: 0 },
        }]
        setNodes(initialNodes)
        setEdges([])
      }
    } catch (error) {
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [docId, router, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const autoSaveMindMap = useCallback(async () => {
    if (!docRecord || nodes.length === 0 || !mindmap?.id) return
    try {
      setAutoSaveStatus('saving')
      const response = await fetch(`/api/mindmaps/${mindmap.id}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      })
      if (response.ok) {
        setAutoSaveStatus('saved')
        setTimeout(() => { setAutoSaveStatus((c) => c === 'saved' ? 'idle' : c) }, 2500)
      } else { setAutoSaveStatus('error') }
    } catch (error) { setAutoSaveStatus('error') }
  }, [docRecord, nodes, edges, mindmap])

  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    if (nodes.length > 0 && mindmap) {
      autoSaveTimerRef.current = setTimeout(() => { autoSaveMindMap() }, 5000) 
    }
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current) }
  }, [nodes, edges, mindmap, autoSaveMindMap])

  const handleYAMLChange = (newNodes: Node[], newEdges: Edge[]) => {
    const nodesWithHandlers = newNodes.map(node => ({
      ...node,
      data: { ...node.data, isEditable: true }
    }))
    setNodes(nodesWithHandlers)
    setEdges(newEdges)
  }

  const handleExportAsImage = async () => {
    if (nodes.length === 0) return
    const fileName = docRecord?.title?.replace(/\s+/g, '_').toLowerCase() || 'mindmap'
    await exportMindMapAsImage(nodes, `${fileName}_export`)
  }

  const handleSaveMindMap = async () => {
    if (!docRecord || nodes.length === 0) return
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const payload = { root_node: nodes, edges: edges, updated_at: new Date().toISOString() }
      if (mindmap?.id) {
        await supabase.from('mindmaps').update(payload).eq('id', mindmap.id).eq('user_id', user.id)
      } else {
        const { data } = await supabase.from('mindmaps').insert({ ...payload, user_id: user.id, document_id: docId, title: `${docRecord.title} Mind Map` }).select().single()
        setMindmap(data)
      }
      alert('Changes saved successfully.')
    } catch (error: any) { alert(`Save error: ${error.message}`) } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center">
      <Loader className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Syncing Map...</p>
    </div>
  )

 return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col selection:bg-primary/20 overflow-hidden text-foreground font-sans">
      {/* 
          NAVIGATION BAR 
      */}
      <nav className="border-b border-white/5 bg-card/40 backdrop-blur-2xl sticky top-0 z-50 h-16">
        <div className="max-w-[1800px] mx-auto px-6 h-full flex justify-between items-center">
          
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2 hover:bg-white/5 transition-all active:scale-95 group border border-transparent hover:border-white/10"
            >
              <LayoutDashboard className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-bold text-[10px] uppercase tracking-[0.2em]">Dashboard</span>
            </Button>
            
            <div className="h-8 w-px bg-white/5" />
            
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-tight truncate max-w-[180px] lg:max-w-md text-white/90">
                  {docRecord?.title || 'Untitled Project'}
                </h1>
                <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-md border border-primary/20">
                  <Activity className="w-3 h-3 text-primary animate-pulse" />
                  <span className="text-[9px] font-black uppercase text-primary tracking-[0.1em]">{nodes.length} Nodes</span>
                </div>
              </div>

              {/* Enhanced Meta Info */}
              <div className="flex items-center gap-3 mt-1">
                {autoSaveStatus === 'saving' ? (
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-yellow-500 uppercase tracking-widest">
                    <div className="w-1 h-1 rounded-full bg-yellow-500 animate-ping" />
                    Syncing to Cloud
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                    <Cloud className="w-2.5 h-2.5" />
                    {mindmap?.updated_at ? `Updated ${formatDistanceToNow(new Date(mindmap.updated_at))} ago` : 'Local Draft'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
          <Button
  onClick={() => setYamlEditorOpen((prev) => !prev)}
  variant="ghost"
  size="sm"
  data-state={yamlEditorOpen ? "open" : "closed"}
  className={cn(
    // Base
    "group relative h-9 px-4 gap-2 overflow-hidden rounded-xl border transition-all duration-300",

    // Theme-aware colors
    "border-border/50 bg-background/60 text-foreground backdrop-blur-md",
    "hover:bg-accent hover:text-accent-foreground",
    "dark:bg-background/40",

    // Open state
    yamlEditorOpen && [
      "bg-primary text-primary-foreground border-primary/40",
      "shadow-[0_0_20px_hsl(var(--primary)/0.35)]",
      "hover:bg-primary/90",
    ],

    // Closed state
    !yamlEditorOpen && [
      "hover:border-border",
      "hover:shadow-sm",
    ]
  )}
>
  {/* Animated glow */}
  <div
    className={cn(
      "absolute inset-0 opacity-0 transition-opacity duration-300",
      "bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10",
      yamlEditorOpen && "opacity-100"
    )}
  />

  {/* Icon */}
  <FileCode
    className={cn(
      "relative z-10 w-3.5 h-3.5 transition-all duration-500 ease-out",
      yamlEditorOpen
        ? "rotate-180 scale-110"
        : "rotate-0 scale-100 group-hover:scale-105"
    )}
  />

  {/* Label */}
  <span
    className={cn(
      "relative z-10 font-bold text-[10px] uppercase tracking-[0.2em] transition-colors duration-300"
    )}
  >
    Intelligence
  </span>
</Button>

            <div className="w-px h-6 bg-white/5 mx-1" />

            <Button
              onClick={handleExportAsImage}
              variant="outline"
              size="sm"
              className="gap-2 h-9 px-4 bg-white/5 border-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="font-bold text-[10px] uppercase tracking-widest">Export PNG</span>
            </Button>

            <Button
              onClick={handleSaveMindMap}
              disabled={saving}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_8px_20px_rgba(59,130,246,0.2)] px-6 h-9 active:scale-95 transition-all"
            >
              {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />}
              <span className="font-bold text-[10px] uppercase tracking-widest">Manual Save</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* 
          MAIN WORKSPACE
      */}
     <main className="flex-1 relative w-full overflow-hidden">
        {/* Canvas Layer - Now Absolute to fill the background completely */}
        <div id="react-flow-container" className="absolute inset-0 z-0">
          {nodes.length > 0 ? (
            <ReactFlowProvider>
              <MindMapEditor
                initialNodes={nodes}
                initialEdges={edges}
                onNodesChange={setNodes}
                onEdgesChange={setEdges}
                isEditable={true}
              />
              
              {/* Floating Information Overlay: Legend */}
              <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-3 pointer-events-none">
                 <div className="p-3 rounded-xl glass-panel bg-card/60 backdrop-blur-md border border-white/10 shadow-2xl flex flex-col gap-2 animate-in slide-in-from-left-4 duration-700">
                    <div className="flex items-center gap-2 mb-1">
                       <Info className="w-3.5 h-3.5 text-primary" />
                       <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/70">Map Intelligence</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-zinc-500" />
                          <span className="text-[9px] font-bold text-zinc-400 uppercase">Topic Path</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-[9px] font-bold text-zinc-400 uppercase">Active Branch</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Help & Shortcuts Floating Button */}
              <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                {showShortcuts && (
                  <div className="p-4 rounded-2xl bg-[#111113] border border-white/10 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 w-64">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Power User Guide</p>
                    <div className="space-y-2">
                       {[
                         { k: 'Ctrl + Z', d: 'Undo last change' },
                         { k: 'Ctrl + Y', d: 'Redo change' },
                         { k: 'Double Click', d: 'Edit node label' },
                         { k: 'Wheel', d: 'Smooth Zoom' }
                       ].map(s => (
                         <div key={s.k} className="flex justify-between items-center group">
                            <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">{s.d}</span>
                            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-primary">{s.k}</kbd>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
                <Button 
                  onClick={() => setShowShortcuts(!showShortcuts)} 
                  variant="outline" 
                  size="icon" 
                  className={cn("rounded-full h-10 w-10 border-white/10 bg-card/60 backdrop-blur-md shadow-xl transition-all hover:scale-110", showShortcuts && "bg-primary text-primary-foreground border-primary")}
                >
                  <Command className="w-4 h-4" />
                </Button>
              </div>
            </ReactFlowProvider>
          ) : (
            /* Enhanced Empty State */
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-10 animate-in fade-in zoom-in duration-1000">
               <div className="relative group cursor-pointer">
                  <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                  <div className="relative w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center border border-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                    <Database className="w-12 h-12 text-primary/30" />
                  </div>
               </div>
               <div className="space-y-3">
                 <h2 className="text-2xl font-black tracking-tight text-white/90">Forge New Connections</h2>
                 <p className="text-xs text-muted-foreground leading-relaxed px-16 uppercase tracking-widest font-medium opacity-60">
                    Your canvas is primed for intelligence. Input a structure manually or let the system restore your latest session.
                  </p>
               </div>
               <div className="flex gap-4">
                 <Button onClick={() => setYamlEditorOpen(true)} className="gap-3 h-12 px-8 rounded-2xl bg-white text-black font-black hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95">
                   <FileCode className="w-4 h-4" />
                   OPEN YAML CONTEXT
                 </Button>
                 <Button onClick={fetchData} variant="outline" className="gap-3 h-12 px-8 rounded-2xl border-white/10 text-white font-black hover:bg-white/5 transition-all">
                   <RefreshCw className="w-4 h-4" />
                   REFRESH
                 </Button>
               </div>
            </div>
          )}
        </div>

        {/* 
          YAML Sidebar - Now an Overlay 
          - Width set to 70% of screen
          - Absolute positioning to avoid pushing the mindmap
          - Right-to-left slide animation
        */}
        <aside 
          className={cn(
            "fixed top-16 right-0 bottom-0 z-40 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-l border-white/10 bg-[#0d0d0f]/95 backdrop-blur-3xl flex flex-col shadow-[-40px_0_80px_rgba(0,0,0,0.9)]",
            "w-full md:w-[75%] lg:w-[70%]", // 70% width extension
            yamlEditorOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          {nodes.length > 0 && (
            <YAMLEditor
              nodes={nodes}
              edges={edges}
              onYAMLChange={handleYAMLChange}
              isOpen={yamlEditorOpen}
              onToggle={() => setYamlEditorOpen(!yamlEditorOpen)}
            />
          )}
        </aside>
      </main>

      {/* Global Background Grid (Parallax-ready) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-[-1]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="premium-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
              <circle cx="0" cy="0" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#premium-grid)" />
        </svg>
      </div>
    </div>
  );
}