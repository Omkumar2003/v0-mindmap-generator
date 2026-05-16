'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.push('/dashboard')
      } else {
        setUser(null)
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-foreground">MindMap Pro</h1>
          <p className="text-xl text-muted-foreground">
            Transform your documents into interactive mind maps with AI-powered
            insights
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="text-2xl mb-2">📄</div>
              <h3 className="font-semibold text-foreground mb-2">
                Smart Analysis
              </h3>
              <p className="text-sm text-muted-foreground">
                Upload documents and let AI extract key concepts automatically
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="text-2xl mb-2">🗺️</div>
              <h3 className="font-semibold text-foreground mb-2">
                Interactive Maps
              </h3>
              <p className="text-sm text-muted-foreground">
                Edit, drag, and explore your mind maps with full interactivity
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold text-foreground mb-2">
                AI Summaries
              </h3>
              <p className="text-sm text-muted-foreground">
                Get instant summaries and key points from your documents
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center pt-8">
          <Link href="/auth/sign-up">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="outline" className="px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
