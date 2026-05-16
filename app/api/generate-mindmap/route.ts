import { createClient } from '@/lib/supabase/server'
import { Groq } from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

interface MindMapNode {
  id: string
  data: { label: string }
  position: { x: number; y: number }
  children?: string[]
}

interface GenerateRequest {
  documentId: string
  documentTitle: string
  documentContent: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId, documentTitle, documentContent }: GenerateRequest =
      await request.json()

    // Validate document belongs to user
    const { data: doc } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Generate mind map structure using Groq
    const prompt = `You are an expert at analyzing documents and creating hierarchical mind maps. 

Document Title: ${documentTitle}

Document Content:
${documentContent}

Analyze this document and create a structured mind map in JSON format. The mind map should:
1. Have a clear root concept (the main idea from the document)
2. 3-5 main branches representing key concepts
3. 2-3 sub-branches under each main branch with details
4. Use concise, meaningful labels (max 5 words per node)

Return ONLY a valid JSON object (no markdown, no code blocks) with this structure:
{
  "label": "Root Concept",
  "children": [
    {
      "label": "Main Concept 1",
      "children": [
        { "label": "Detail 1" },
        { "label": "Detail 2" }
      ]
    }
  ]
}

Make sure every node object has "label" and optionally "children" array. Be concise and clear.`

    const message = await groq.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse the JSON response
    let mindmapStructure
    try {
      mindmapStructure = JSON.parse(responseText)
    } catch (parseError) {
      console.error('[v0] Failed to parse Groq response:', responseText)
      // Try to extract JSON from response if it contains markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        mindmapStructure = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse mind map structure from AI response')
      }
    }

    // Convert tree structure to React Flow nodes and edges
    const nodes: MindMapNode[] = []
    const edges: Array<{ source: string; target: string }> = []
    let nodeId = 0

    function processNode(
      node: any,
      parentId: string | null,
      level: number
    ): string {
      const currentId = `node-${nodeId++}`
      const xSpacing = 250
      const ySpacing = 150
      const nodesAtLevel = 1 // Simplified for now

      nodes.push({
        id: currentId,
        data: { label: node.label || 'Untitled' },
        position: {
          x: level * xSpacing,
          y: parentId ? level * ySpacing : 0,
        },
      })

      if (parentId) {
        edges.push({
          source: parentId,
          target: currentId,
        })
      }

      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          processNode(child, currentId, level + 1)
        }
      }

      return currentId
    }

    processNode(mindmapStructure, null, 0)

    // Generate summary using Groq
    const summaryPrompt = `Based on this document, provide a brief 2-3 sentence summary and extract 5 key points as a JSON array.

Document: ${documentContent}

Return ONLY valid JSON (no markdown):
{
  "summary": "Your summary here",
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"]
}`

    const summaryMessage = await groq.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: summaryPrompt,
        },
      ],
    })

    const summaryText =
      summaryMessage.content[0].type === 'text'
        ? summaryMessage.content[0].text
        : ''

    let summary, keyPoints
    try {
      const summaryParsed = JSON.parse(summaryText)
      summary = summaryParsed.summary
      keyPoints = summaryParsed.keyPoints || []
    } catch (parseError) {
      summary = 'Document analyzed successfully'
      keyPoints = []
    }

    // Store mind map in database
    const { data: mindmap, error: mindmapError } = await supabase
      .from('mindmaps')
      .insert({
        user_id: user.id,
        document_id: documentId,
        title: documentTitle,
        root_node: { nodes, edges },
      })
      .select()
      .single()

    if (mindmapError) {
      console.error('[v0] Error saving mindmap:', mindmapError)
      throw mindmapError
    }

    // Store summary in database
    if (mindmap) {
      await supabase.from('summaries').insert({
        user_id: user.id,
        document_id: documentId,
        mindmap_id: mindmap.id,
        summary_text: summary,
        key_points: keyPoints,
      })
    }

    return NextResponse.json({
      mindmapId: mindmap?.id,
      nodes,
      edges,
      summary,
      keyPoints,
    })
  } catch (error) {
    console.error('[v0] Mind map generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate mind map' },
      { status: 500 }
    )
  }
}
