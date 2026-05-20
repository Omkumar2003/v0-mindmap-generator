import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Resolve the ID from params
    const { id } = await context.params
    
    if (!id) {
      return NextResponse.json({ error: 'Missing Mindmap ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Extract nodes and edges from request body
    const { nodes, edges } = await request.json()

    if (!nodes || !edges) {
      return NextResponse.json(
        { error: 'Nodes and edges are required' },
        { status: 400 }
      )
    }

    // 3. Update mindmap
    // REMOVED: 'last_autosave' because the column does not exist in your DB.
    // We only update 'root_node', 'edges', and 'updated_at'.
    const { data: mindmap, error: updateError } = await supabase
      .from('mindmaps')
      .update({
        root_node: nodes,
        edges: edges,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('[AutoSave API] Supabase Error:', updateError.message)
      
      // Handle the case where the record wasn't found or doesn't belong to the user
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Mindmap not found or access denied' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(mindmap)
  } catch (error: any) {
    console.error('[AutoSave API] Runtime Error:', error.message || error)
    return NextResponse.json(
      { error: 'Internal server error during auto-save' },
      { status: 500 }
    )
  }
}