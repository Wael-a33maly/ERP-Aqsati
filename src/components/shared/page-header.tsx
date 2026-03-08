'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PageHeaderProps {
  title: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  backButton?: boolean
  backHref?: string
  actions?: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
}

export function PageHeader({
  title,
  titleAr,
  description,
  descriptionAr,
  backButton = false,
  backHref,
  actions,
  breadcrumbs,
}: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className="space-y-4 pb-4 border-b mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {backButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (backHref ? router.push(backHref) : router.back())}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {title}
              {titleAr && (
                <span className="text-muted-foreground mr-2 text-xl">
                  ({titleAr})
                </span>
              )}
            </h1>
            {(description || descriptionAr) && (
              <p className="text-muted-foreground mt-1">
                {description}
                {descriptionAr && (
                  <span className="text-muted-foreground mr-2">
                    ({descriptionAr})
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
