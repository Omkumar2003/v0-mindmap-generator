import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
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

    const { data: mindmap, error } = await supabase
      .from('mindmaps')
      .select('*, summaries(*)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Mind map not found' }, { status: 404 })
    }

    return NextResponse.json(mindmap)
  } catch (error) {
    console.error('[v0] Error fetching mindmap:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mind map' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const { root_node } = await request.json()

    const { data: mindmap, error } = await supabase
      .from('mindmaps')
      .update({
        root_node,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Mind map not found' }, { status: 404 })
    }

    return NextResponse.json(mindmap)
  } catch (error) {
    console.error('[v0] Error updating mindmap:', error)
    return NextResponse.json(
      { error: 'Failed to update mind map' },
      { status: 500 }
    )
  }
}
