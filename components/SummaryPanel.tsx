'use client'

import { Card } from '@/components/ui/card'

interface SummaryPanelProps {
  summary?: string
  keyPoints?: string[]
}

export function SummaryPanel({ summary, keyPoints }: SummaryPanelProps) {
  if (!summary && !keyPoints) {
    return (
      <div className="space-y-4">
        <Card className="p-4 border border-border bg-muted">
          <p className="text-sm text-muted-foreground">
            Generate a mind map to see AI-powered summaries and key points here.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {summary && (
        <Card className="p-4 border border-border">
          <h3 className="font-semibold text-foreground mb-2">Summary</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {summary}
          </p>
        </Card>
      )}

      {keyPoints && keyPoints.length > 0 && (
        <Card className="p-4 border border-border">
          <h3 className="font-semibold text-foreground mb-3">Key Points</h3>
          <ul className="space-y-2">
            {keyPoints.map((point, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-foreground font-semibold">•</span>
                <span className="text-sm text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
