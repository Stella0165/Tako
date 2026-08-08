'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import type { ComponentType, SVGProps } from 'react'

// Icons is keyed by string, but not every value in that map is guaranteed by
// its own type to be a renderable component (e.g. non-icon exports living on
// the same object). Cast at the point of dynamic lookup so TS treats it as
// the same callable shape as every other lucide icon in this file.
type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>

// ---------------------------------------------------------------------------
// Data
//
// Swap this for your real operator fetch (Supabase / API route). Shape is
// intentionally flat so it maps cleanly onto whatever table you're already
// listing operators from.
// ---------------------------------------------------------------------------

type OperatorStatus = 'ready' | 'draft' | 'coming-soon'

interface Operator {
  id: string
  name: string
  description: string
  status: OperatorStatus
  category: string
  updatedAt: string // ISO date
  integrations: Array<keyof typeof Icons>
}

interface Category {
  id: string
  title: string
  description: string
  icon: keyof typeof Icons
  accent: string // tailwind gradient classes, matches brand palette
}

const categories: Category[] = [
  {
    id: 'lead-intelligence',
    title: 'Lead intelligence',
    description: 'Score and qualify incoming activity before it reaches a rep',
    icon: 'activity',
    accent: 'from-brand-cornflower to-brand-purple',
  },
  {
    id: 'routing-orchestration',
    title: 'Routing & orchestration',
    description: 'Get the right lead to the right person, automatically',
    icon: 'zap',
    accent: 'from-brand-navy to-brand-purple',
  },
  {
    id: 'account-crm',
    title: 'Account & CRM',
    description: 'Resolve contacts and keep your CRM in sync',
    icon: 'share',
    accent: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'compliance',
    title: 'Compliance & governance',
    description: 'Keep data handling within policy, without manual review',
    icon: 'flag',
    accent: 'from-amber-500 to-orange-500',
  },
]

const operators: Operator[] = [
  {
    id: 'visitor-intent-scoring',
    name: 'Visitor Intent Scoring Operator',
    description:
      "Calculates a visitor's intent score and level from activity data — page visits, durations, and repeat sessions.",
    status: 'ready',
    category: 'lead-intelligence',
    updatedAt: '2026-08-09T02:00:00Z',
    integrations: ['activity', 'zap'],
  },
  {
    id: 'visitor-intent-aggregator',
    name: 'Visitor Intent Aggregator',
    description:
      'Converts one incoming visitor activity event into a reliable, multi-touch intent summary. Deduplicates near-identical activity.',
    status: 'ready',
    category: 'lead-intelligence',
    updatedAt: '2026-08-08T09:00:00Z',
    integrations: ['zap'],
  },
  {
    id: 'icp-scorer',
    name: 'ICP Scorer Operator',
    description:
      'Scores an account against your ideal customer profile using firmographic and engagement signals.',
    status: 'ready',
    category: 'lead-intelligence',
    updatedAt: '2026-08-08T11:00:00Z',
    integrations: ['zap'],
  },
  {
    id: 'territory-capacity-router',
    name: 'Territory Capacity Router',
    description:
      'Determines the right SDR based on territory and live capacity, fetched from Supabase routing rules.',
    status: 'ready',
    category: 'routing-orchestration',
    updatedAt: '2026-08-09T01:00:00Z',
    integrations: ['activity'],
  },
  {
    id: 'lead-orchestrator',
    name: 'Lead Orchestrator',
    description:
      'Routes strategic leads through native Slack and Outlook integrations, coordinating every downstream operator.',
    status: 'ready',
    category: 'routing-orchestration',
    updatedAt: '2026-08-09T03:00:00Z',
    integrations: ['mail', 'sparkles', 'send'],
  },
  {
    id: 'buying-group-resolver',
    name: 'Buying Group Resolver Operator',
    description:
      'Assembles contacts and recent visitor signals for one account into a single buying-group play, preventing duplicate outreach.',
    status: 'ready',
    category: 'account-crm',
    updatedAt: '2026-08-08T10:00:00Z',
    integrations: ['mail', 'activity', 'zap'],
  },
  {
    id: 'crm-matcher',
    name: 'CRM Matcher Operator',
    description:
      'Matches inbound contact and account records against your CRM to prevent duplicate creation.',
    status: 'ready',
    category: 'account-crm',
    updatedAt: '2026-08-07T14:00:00Z',
    integrations: ['zap'],
  },
  {
    id: 'anonymization-gdpr',
    name: 'Anonymization / GDPR Operator',
    description:
      'Fetches contact data from Supabase and applies GDPR anonymization rules when a contact has opted out.',
    status: 'ready',
    category: 'compliance',
    updatedAt: '2026-07-20T08:00:00Z',
    integrations: ['zap'],
  },
]

const statusLabel: Record<OperatorStatus, string> = {
  ready: 'Ready',
  draft: 'Draft',
  'coming-soon': 'Coming soon',
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diffMs / 3_600_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

// ---------------------------------------------------------------------------
// Operator card
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: OperatorStatus }) {
  const styles: Record<OperatorStatus, string> = {
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: 'bg-muted text-brand-muted border-border',
    'coming-soon': 'bg-muted text-brand-muted border-border',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
        styles[status]
      )}
    >
      {status === 'ready' && <Icons.check className='h-3 w-3' />}
      {statusLabel[status]}
    </span>
  )
}

function OperatorCard({ operator }: { operator: Operator }) {
  const isComingSoon = operator.status === 'coming-soon'

  return (
    <motion.div variants={itemVariants}>
      <Card
        className={cn(
          'group flex h-full flex-col justify-between transition-all duration-200 hover:border-brand-purple/40 hover:shadow-md',
          isComingSoon && 'opacity-60'
        )}
      >
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between gap-3'>
            <StatusBadge status={operator.status} />
            <span className='shrink-0 text-xs text-muted-foreground'>
              {timeAgo(operator.updatedAt)}
            </span>
          </div>
          <CardTitle className='mt-3 text-base leading-snug'>
            {operator.name}
          </CardTitle>
          <CardDescription className='line-clamp-2'>
            {operator.description}
          </CardDescription>
        </CardHeader>
        <CardContent className='flex items-center justify-between pt-0'>
          <div className='flex items-center gap-1.5'>
            {operator.integrations.map((iconKey) => {
              const Icon = Icons[iconKey] as IconComponent
              return (
                <span
                  key={iconKey}
                  className='flex h-7 w-7 items-center justify-center rounded-md border bg-muted/50'
                >
                  <Icon className='h-3.5 w-3.5 text-brand-muted' />
                </span>
              )
            })}
          </div>
          <Button
            variant='ghost'
            size='sm'
            disabled={isComingSoon}
            className='text-brand-purple hover:text-brand-purple hover:bg-brand-purple/10'
          >
            Open
            <Icons.arrowRight className='ml-1 h-3.5 w-3.5' />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Category section
// ---------------------------------------------------------------------------

function CategorySection({
  category,
  items,
}: {
  category: Category
  items: Operator[]
}) {
  if (items.length === 0) return null
  const Icon = Icons[category.icon] as IconComponent

  return (
    <motion.section variants={itemVariants} className='space-y-4'>
      <div className='flex items-center gap-3'>
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white',
            category.accent
          )}
        >
          <Icon className='h-4.5 w-4.5' strokeWidth={1.75} />
        </div>
        <div>
          <h2 className='text-lg font-semibold tracking-tight text-brand-navy'>
            {category.title}
          </h2>
          <p className='text-sm text-muted-foreground'>
            {category.description}
          </p>
        </div>
        <span className='ml-auto rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-brand-muted'>
          {items.length} operator{items.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {items.map((operator) => (
          <OperatorCard key={operator.id} operator={operator} />
        ))}
      </div>
    </motion.section>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorkbenchPage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all')

  const filtered = useMemo(() => {
    return operators.filter((op) => {
      const matchesQuery = op.name
        .toLowerCase()
        .includes(query.trim().toLowerCase())
      const matchesCategory =
        activeCategory === 'all' || op.category === activeCategory
      return matchesQuery && matchesCategory
    })
  }, [query, activeCategory])

  const readyCount = operators.filter((o) => o.status === 'ready').length

  return (
    <motion.div
      className='space-y-10'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'
      >
        <div>
          <h1 className='text-display-3 font-bold tracking-tight text-brand-navy'>
            Workbench
          </h1>
          <p className='mt-2 text-lg text-muted-foreground'>
            Every operator your team runs, organized by what it does.
          </p>
        </div>

        <div className='flex items-center gap-4 rounded-xl border bg-card px-5 py-3'>
          <div>
            <p className='text-2xl font-bold text-brand-navy'>
              {operators.length}
            </p>
            <p className='text-xs text-muted-foreground'>Total operators</p>
          </div>
          <div className='h-8 w-px bg-border' />
          <div>
            <p className='text-2xl font-bold text-emerald-600'>
              {readyCount}
            </p>
            <p className='text-xs text-muted-foreground'>Ready</p>
          </div>
          <div className='h-8 w-px bg-border' />
          <div>
            <p className='text-2xl font-bold text-brand-navy'>
              {categories.length}
            </p>
            <p className='text-xs text-muted-foreground'>Categories</p>
          </div>
        </div>
      </motion.div>

      {/* Search + category filter */}
      <motion.div
        variants={itemVariants}
        className='flex flex-col gap-3 sm:flex-row sm:items-center'
      >
        <div className='sm:w-72'>
          <Input
            placeholder='Search operators'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button
            variant={activeCategory === 'all' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setActiveCategory('all')}
          >
            All
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={activeCategory === c.id ? 'default' : 'outline'}
              size='sm'
              onClick={() => setActiveCategory(c.id)}
            >
              {c.title}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Categorized operator grid */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={activeCategory + query}
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='space-y-10'
        >
          {categories
            .filter((c) => activeCategory === 'all' || activeCategory === c.id)
            .map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                items={filtered.filter((op) => op.category === category.id)}
              />
            ))}

          {filtered.length === 0 && (
            <motion.div
              variants={itemVariants}
              className='rounded-xl border border-dashed py-16 text-center'
            >
              <p className='text-sm font-medium text-brand-navy'>
                No operators match &quot;{query}&quot;
              </p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Try a different search term or clear the category filter.
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}