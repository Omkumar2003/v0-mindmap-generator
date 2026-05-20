// components/YAMLEditor.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  Copy, 
  Wand2, 
  BookOpen, 
  BrainCircuit, 
  Loader2, 
  Sparkles,
  X
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { Node, Edge } from 'reactflow'

interface YAMLEditorProps {
  nodes: Node[]
  edges: Edge[]
  onYAMLChange: (nodes: Node[], edges: Edge[]) => void
  isOpen: boolean
  onToggle: () => void
}

// --- EXISTING UTILS PRESERVED ---
const nodesToYAML = (nodes: Node[], edges: Edge[]): string => {
  if (nodes.length === 0) return ''
  const childrenMap = new Map<string, string[]>()
  edges.forEach(edge => {
    if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, [])
    childrenMap.get(edge.source)?.push(edge.target)
  })
  const nodeMap = new Map<string, Node>()
  nodes.forEach(node => nodeMap.set(node.id, node))
  let rootNode = nodes.find(n => n.id === 'root')
  if (!rootNode) {
    const childIds = new Set(edges.map(e => e.target))
    rootNode = nodes.find(n => !childIds.has(n.id)) || nodes[0]
  }
  if (!rootNode) return ''
  const buildYAML = (nodeId: string, indent: number = 0): string[] => {
    const node = nodeMap.get(nodeId)
    if (!node) return []
    const lines: string[] = []
    const indentStr = '  '.repeat(indent)
    lines.push(`${indentStr}- ${node.data.label}`)
    const children = childrenMap.get(nodeId) || []
    children.forEach(childId => {
      const childLines = buildYAML(childId, indent + 1)
      lines.push(...childLines)
    })
    return lines
  }
  return buildYAML(rootNode.id).join('\n')
}

const yamlToNodes = (yamlText: string): { nodes: Node[], edges: Edge[] } => {
  const lines = yamlText.split('\n')
  const nodes: Node[] = []
  const edges: Edge[] = []
  const nodeStack: Array<{ id: string; level: number }> = []
  let nodeCounter = 0
  for (const line of lines) {
    if (!line.trim()) continue
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0
    const level = Math.floor(leadingSpaces / 2)
    const match = line.match(/^\s*-\s+(.+)$/)
    if (!match) continue
    const label = match[1].trim()
    const nodeId = `node-yaml-${Date.now()}-${nodeCounter++}`
    const newNode: Node = {
      id: nodeId,
      type: 'mindmap',
      data: { label, images: [], isEditable: true, onChangeLabel: () => {}, onDelete: () => {}, onAddChild: () => {}, onImageUpload: () => {}, onImageDelete: () => {} },
      position: { x: 0, y: 0 },
    }
    nodes.push(newNode)
    while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].level >= level) nodeStack.pop()
    if (nodeStack.length > 0) {
      const parentId = nodeStack[nodeStack.length - 1].id
      edges.push({ id: `edge-${parentId}-${nodeId}`, source: parentId, target: nodeId })
    }
    nodeStack.push({ id: nodeId, level })
  }
  return { nodes, edges }
}

// --- UPDATED COMPONENT ---
export default function YAMLEditor({ nodes, edges, onYAMLChange, isOpen, onToggle }: YAMLEditorProps) {
  const [yaml, setYAML] = useState(nodesToYAML(nodes, edges))
  const [copied, setCopied] = useState(false)
  const [isUserEditing, setIsUserEditing] = useState(false)
  
  // AI States
  const [topic, setTopic] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ type: string, content: string } | null>(null)
const [activeTab, setActiveTab] = useState<'yaml' | 'ai'>('ai')
  useEffect(() => {
    if (isUserEditing) return
    const timer = setTimeout(() => {
      setYAML(nodesToYAML(nodes, edges))
    }, 500)
    return () => clearTimeout(timer)
  }, [nodes, edges, isUserEditing])

  const handleAiAction = async (action: 'generate' | 'summarize' | 'tricks') => {
    if (action === 'generate' && !topic.trim() && !yaml.trim()) {
      alert("Please provide a topic or some starting YAML.");
      return;
    }
    
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/yaml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, yamlContext: yaml, topic })
      });
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      if (action === 'generate') {
        // Clean YAML response (remove markdown blocks if LLM included them)
        const cleanYaml = data.result.replace(/```yaml|```/g, '').trim();
        setYAML(cleanYaml);
        setAiResult({ type: 'Success', content: 'YAML Structure generated! Review and click Apply.' });
      } else {
        setAiResult({ type: action === 'summarize' ? 'AI Summary' : 'AI Learning Tricks', content: data.result });
      }
    } catch (err: any) {
      alert("AI Error: " + err.message);
    } finally {
      setAiLoading(false);
    }
  }

  const applyYAMLChanges = () => {
    try {
      const { nodes: newNodes, edges: newEdges } = yamlToNodes(yaml)
      if (newNodes.length > 0) {
        onYAMLChange(newNodes, newEdges)
        setAiResult(null)
      } else {
        alert('No valid nodes found in YAML.')
      }
    } catch (error) {
      alert('Error parsing YAML.')
    }
  }

  return (
   <div className="
  border-l
  border-white/5
  bg-[#070709]
  backdrop-blur-3xl
  flex
  flex-col
  h-[calc(100vh-64px)]
  mt-16
  shadow-[0_0_80px_rgba(0,0,0,0.6)]
  relative
  z-0
  overflow-hidden
">
      <button
        onClick={onToggle}
        className="
  w-full
  px-5
  h-14
  flex
  items-center
  justify-between
  border-b
  border-white/[0.04]
  bg-black/20
">
        <div className="flex items-center gap-2">
          <ChevronDown className={`w-4 h-4 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          <span className="text-sm font-medium text-zinc-200">Intelligence & Editor</span>
        </div>
        <Sparkles className="w-3 h-3 text-primary animate-pulse" />
      </button>

      {isOpen && (
  <div className="flex flex-col flex-1 overflow-hidden">

    {/* ========================================= */}
    {/* TOP TAB SWITCHER */}
    {/* ========================================= */}

    {/* <div className="p-3 border-b border-white/5 bg-black/30"> */}
   <div className="px-5 py-4 border-b border-white/[0.04]">

  <div className="
    flex
    items-center
    gap-1
    p-1
    rounded-2xl
    bg-white/[0.03]
    border
    border-white/[0.04]
    w-fit
  ">

    {/* YAML TAB */}

    <button
      onClick={() => setActiveTab('yaml')}
      className={`
        h-9
        px-5
        rounded-xl
        transition-all
        duration-200
        text-[12px]
        font-medium

        ${
          activeTab === 'yaml'
            ? `
              bg-white
              text-black
              shadow-sm
            `
            : `
              text-zinc-500
              hover:text-zinc-300
              hover:bg-white/[0.03]
            `
        }
      `}
    >
      YAML Editor
    </button>

    {/* AI TAB */}

    <button
      onClick={() => setActiveTab('ai')}
      className={`
        h-9
        px-5
        rounded-xl
        transition-all
        duration-200
        text-[12px]
        font-medium

        ${
          activeTab === 'ai'
            ? `
              bg-white
              text-black
              shadow-sm
            `
            : `
              text-zinc-500
              hover:text-zinc-300
              hover:bg-white/[0.03]
            `
        }
      `}
    >
      AI
    </button>

  </div>

</div>

    {/* ========================================= */}
    {/* AI TAB */}
    {/* ========================================= */}

    {activeTab === 'ai' && (
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* AI TOOLBAR */}

        <div className="p-4 space-y-4 bg-white/5 border-b border-white/5">

          {/* GENERATE */}

          <div className="flex gap-2">

            <Input
              placeholder="Topic for AI generation..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-8 text-[11px] bg-black/40 border-white/10"
            />

            <Button
              size="sm"
              onClick={() => handleAiAction('generate')}
              disabled={aiLoading}
              className="h-8 bg-primary text-primary-foreground font-bold text-[10px] px-3"
            >
              {aiLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3" />
              )}
            </Button>

          </div>

          {/* OTHER ACTIONS */}

          <div className="grid grid-cols-2 gap-2">

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAiAction('summarize')}
              disabled={aiLoading || !yaml}
              className="h-8 text-[9px] font-black uppercase tracking-tighter border-white/10 bg-white/5"
            >
              <BookOpen className="w-3 h-3 mr-2 text-blue-400" />
              Summarize
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAiAction('tricks')}
              disabled={aiLoading || !yaml}
              className="h-8 text-[20px] font-black uppercase tracking-tighter border-white/10 bg-white/5"
            >
              <BrainCircuit className="w-3 h-3 mr-2 text-yellow-400" />
              AI Tricks
            </Button>

          </div>

        </div>

        {/* ========================================= */}
        {/* AI RESULT */}
        {/* ========================================= */}

        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {aiResult && (() => {

            const lines = aiResult.content
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)

            const extractedWords: Array<{
              original: string
              compressed: string
            }> = []

            const storyLines: string[] = []

            let currentSection = ''

            lines.forEach((line) => {

              if (line.startsWith('##')) {
                currentSection = line.toLowerCase()
                return
              }

              // COMPRESSION MAP

              if (
                currentSection.includes('compression map') &&
                (
                  line.includes('→') ||
                  line.includes('->')
                )
              ) {

                const parts = line.includes('→')
                  ? line.split('→')
                  : line.split('->')

                if (parts.length >= 2) {

                  const original = parts[0]
                    .replace(/[-•]/g, '')
                    .trim()

                  const compressed = parts[1]
                    .replace(/[^a-zA-Z]/g, '')
                    .trim()

                  if (
                    original &&
                    compressed &&
                    compressed.length < 20 &&
                    !compressed.includes(original)
                  ) {

                    extractedWords.push({
                      original,
                      compressed,
                    })

                  }
                }
              }

              // STORY ONLY

              if (
                currentSection.includes('story') &&
                !line.includes('##') &&
                !line.includes('→') &&
                !line.includes('->')
              ) {

                storyLines.push(
                  line.replace(/^[-•]\s*/, '')
                )

              }

            })

            return (

              <div className="m-3 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/5">

                {/* HEADER */}

                <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-white/5 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>

                    <div>

                      <h4 className="text-[20px] font-black tracking-wide text-white">
                        {aiResult.type}
                      </h4>

                      <p className="text-[13px] text-zinc-500">
                        Memory Compression
                      </p>

                    </div>

                  </div>

                  <button
                    onClick={() => setAiResult(null)}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-zinc-400" />
                  </button>

                </div>

                {/* BODY */}

                <div className="p-4 space-y-5">

                  {/* MEMORY CHUNKS */}

                  {extractedWords.length > 0 && (

                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">

                      <div className="flex items-center gap-2 mb-3">

                        <BrainCircuit className="w-4 h-4 text-primary" />

                        <span className="text-[15px] tracking-wide font-black text-primary">
                          Memory Chunks
                        </span>

                      </div>

                      <div className="flex flex-wrap gap-3">

                        {extractedWords.map((item, index) => (

                          <div
                            key={index}
                            className="
  px-3
  py-2
  rounded-xl
  bg-white/[0.04]
  border
  border-white/5
  hover:bg-white/[0.06]
  transition-colors
"
                          >

                            <div className="text-red-800 text-lg font-black leading-none">
                              {item.compressed}
                            </div>

                            <div className="text-[9px] text-white mt-1 font-bold">
                              {item.original}
                            </div>

                          </div>

                        ))}

                      </div>

                    </div>

                  )}

                  {/* STORY */}

                  {storyLines.length > 0 && (

                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5">

                      <div className="flex items-center gap-2 mb-4">

                        <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />

                        <span className="text-[15px] tracking-wide font-black text-slate-300">
                          Cinematic Recall Story
                        </span>

                      </div>

                      <div className="text-[15px] leading-[2] text-zinc-200 font-medium">

                        {(() => {

                          let fullStory = storyLines.join(' ')

                          extractedWords.forEach((item) => {

                            const regex = new RegExp(
                              `\\b${item.compressed}\\b`,
                              'gi'
                            )

                            fullStory = fullStory.replace(
                              regex,
                              `[[${item.compressed}::${item.original}]]`
                            )

                          })

                          const parts = fullStory.split(
                            /(\[\[.*?::.*?\]\])/
                          )

                          return parts.map((part, index) => {

                            const match = part.match(
                              /\[\[(.*?)::(.*?)\]\]/
                            )

                            if (match) {

                              const compressed = match[1]
                              const original = match[2]

                              return (

                                <span
                                  key={index}
                                  title={original}
                                  className="
  inline
  text-red-800
  font-semibold
  border-b
  border-white/20
  cursor-help
  hover:border-white/50
  transition-colors
"
                                >
                                  {compressed}
                                </span>

                              )
                            }

                            return (
                              <span key={index}>
                                {part}
                              </span>
                            )

                          })

                        })()}

                      </div>

                    </div>

                  )}

                </div>

              </div>

            )

          })()}

        </div>

      </div>
    )}

    {/* ========================================= */}
    {/* YAML TAB */}
    {/* ========================================= */}

    {activeTab === 'yaml' && (
      // <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden bg-gradient-to-b from-black/20 to-transparent">

        {/* CONTROLS */}

        {/* <div className="flex gap-2 p-3 bg-black/20 border-b border-white/5">
         */}
<div className="px-5 pt-4">

  <div className="
    flex items-center justify-between
    rounded-2xl
    border border-white/10
    bg-white/[0.03]
    backdrop-blur-xl
    px-4
    py-3
  ">

    {/* LEFT INFO */}

    <div className="flex items-center gap-5">

      {/* NODE COUNT */}

      <div>

        <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-black">
          Nodes
        </div>

        <div className="text-sm font-black text-white">
          {nodes.length}
        </div>

      </div>

      {/* EDGE COUNT */}

      <div>

        <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-black">
          Connections
        </div>

        <div className="text-sm font-black text-white">
          {edges.length}
        </div>

      </div>

      {/* YAML LINES */}

      <div>

        <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-black">
          Lines
        </div>

        <div className="text-sm font-black text-white">
          {yaml.split('\n').length}
        </div>

      </div>

    </div>

    {/* RIGHT ACTIONS */}

    <div className="flex items-center gap-2">

      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          navigator.clipboard.writeText(yaml)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
        className="
          h-9
          px-4
          rounded-xl
          text-[10px]
          font-black
          uppercase
          tracking-[0.2em]
          hover:bg-white/10
        "
      >
        <Copy className="w-3 h-3 mr-2" />
        {copied ? 'Copied' : 'Copy'}
      </Button>

      <Button
        size="sm"
        onClick={applyYAMLChanges}
        className="
          h-9
          px-5
          rounded-xl
          bg-white
          text-black
          hover:bg-zinc-200
          text-[10px]
          font-black
          uppercase
          tracking-[0.2em]
        "
      >
        Apply
      </Button>

    </div>

  </div>

</div>

        {/* YAML TEXTAREA */}

        <textarea
          value={yaml}
          onChange={(e) => {
            setIsUserEditing(true)
            setYAML(e.target.value)
          }}
          onBlur={() => setIsUserEditing(false)}
          className="
  flex-1
  mx-5
  mt-4
  mb-4
  p-6
  rounded-3xl
  border
  border-white/10
  bg-black/30
  backdrop-blur-xl
  font-mono
  text-[12px]
  leading-7
  text-zinc-300
  resize-none
  focus:outline-none
  focus:border-primary/30
  focus:ring-1
  focus:ring-primary/20
  shadow-[0_0_40px_rgba(0,0,0,0.3)]
  selection:bg-primary/30
"
                  placeholder="- Root Concept..."
        />

        {/* GUIDE */}

        {/* <div className="p-4 text-[9px] text-zinc-500 border-t border-white/5 bg-black/40">
         */}
<div className="
  mx-5
  mb-4
  rounded-2xl
  border
  border-white/10
  bg-white/[0.02]
  px-4
  py-3
  text-[10px]
  text-zinc-500
">

          <p className="mb-1 text-[9px] font-black tracking-wide text-zinc-500">
            Structure Guide
          </p>

          <code className="block leading-relaxed opacity-60">
            - Parent Concept
            <br />
            &nbsp;&nbsp;- Child Detail
            <br />
            &nbsp;&nbsp;- Another Detail
          </code>

        </div>

      </div>
    )}

  </div>
)}
    </div>
  )
}