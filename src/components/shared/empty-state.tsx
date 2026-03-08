'use client'

import { Button } from '@/components/ui/button'
import { FileX, FolderOpen, Search, Users, Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: 'file' | 'folder' | 'search' | 'users' | 'inbox' | React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const iconMap = {
  file: FileX,
  folder: FolderOpen,
  search: Search,
  users: Users,
  inbox: Inbox,
}

export function EmptyState({
  icon = 'file',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const IconComponent = typeof icon === 'string' ? iconMap[icon] : null

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="rounded-full bg-muted p-4 mb-4">
        {IconComponent ? (
          <IconComponent className="h-8 w-8 text-muted-foreground" />
        ) : (
          icon
        )}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
