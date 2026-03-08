'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

interface LoadingProps {
  variant?: 'spinner' | 'skeleton' | 'page' | 'card'
  text?: string
  className?: string
}

export function Loading({
  variant = 'spinner',
  text,
  className = '',
}: LoadingProps) {
  switch (variant) {
    case 'spinner':
      return (
        <div className={`flex items-center justify-center gap-2 ${className}`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          {text && <span className="text-sm text-muted-foreground">{text}</span>}
        </div>
      )

    case 'skeleton':
      return (
        <div className={`space-y-3 ${className}`}>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )

    case 'page':
      return (
        <div className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          {text && (
            <p className="mt-4 text-muted-foreground">{text}</p>
          )}
        </div>
      )

    case 'card':
      return (
        <div className={`rounded-lg border bg-card p-6 ${className}`}>
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      )

    default:
      return null
  }
}

export function TableLoading({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="rounded-md border">
      <div className="border-b bg-muted/50 p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardLoading() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-8 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}
