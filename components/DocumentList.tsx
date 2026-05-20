'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trash2, Edit, Eye } from 'lucide-react'

interface Document {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export default function DocumentList() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) throw error
      setDocuments(documents.filter(doc => doc.id !== id))
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading documents...</div>
  }

  if (documents.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed">
        <h3 className="text-lg font-semibold text-foreground mb-2">No documents yet</h3>
        <p className="text-muted-foreground mb-4">Create your first document to get started</p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {documents.map(doc => (
        <Card key={doc.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex flex-col h-full">
            <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2">
              {doc.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">
              {doc.content.substring(0, 150)}...
            </p>
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/editor/${doc.id}`)}
                className="flex-1 gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/mindmap/${doc.id}`)}
                className="flex-1 gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteDocument(doc.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
