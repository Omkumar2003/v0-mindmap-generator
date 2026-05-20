import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Node, Edge } from 'reactflow'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { nodes, edges, root_node } = await request.json()

    if (!nodes || !edges) {
      return NextResponse.json(
        { error: 'Nodes and edges are required' },
        { status: 400 }
      )
    }

    // Verify ownership before updating
    const { data: existing } = await supabase
      .from('mindmaps')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Mindmap not found' }, { status: 404 })
    }

    // Update mindmap with nodes and edges
    const { data: mindmap, error } = await supabase
      .from('mindmaps')
      .update({
        nodes,
        edges,
        root_node,
        updated_at: new Date().toISOString(),
        last_autosave: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error auto-saving mindmap:', error)
      return NextResponse.json(
        { error: 'Failed to save mindmap' },
        { status: 500 }
      )
    }

    return NextResponse.json(mindmap)
  } catch (error) {
    console.error('[v0] Error in autosave API:', error)
    return NextResponse.json(
      { error: 'Failed to auto-save mindmap' },
      { status: 500 }
    )
  }
}
