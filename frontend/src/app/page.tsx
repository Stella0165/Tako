'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CardWatermark } from '@/components/ui/card-watermark'
import { Icons } from '@/components/ui/icons'
import { ActivityChart } from '@/components/ActivityChart'
import { cn } from '@/lib/utils'

const ACCOUNT_STATS = {
  totalAccounts: 68,
  customers: 13,
  prospects: 39,
  partners: 68 - 13 - 39, // remaining Type values
  strategicAccounts: 4,
  byIndustry: {
    Manufacturing: 21,
    Logistics: 17,
    Technology: 12,
    Chemicals: 9,
    Retail: 9,
  },
}

const TOP_10_ACCOUNTS = [
  { name: 'Northgate Instruments', industry: 'Chemicals', employees: 5000, type: 'Customer', country: 'IN' },
  { name: 'Lumina Technology', industry: 'Retail', employees: 5000, type: 'Partner', country: 'ID' },
  { name: 'Pacific Rim Textiles', industry: 'Chemicals', employees: 5000, type: 'Partner', country: 'MY' },
  { name: 'Sunrise Logistics Co.', industry: 'Technology', employees: 5000, type: 'Partner', country: 'MY' },
  { name: 'Andaman Metal Works', industry: 'Chemicals', employees: 5000, type: 'Customer', country: 'SG' },
  { name: 'Munich Automation AG', industry: 'Technology', employees: 3000, type: 'Prospect', country: 'EU' },
  { name: 'Summit Steelworks', industry: 'Retail', employees: 2000, type: 'Prospect', country: 'IN' },
  { name: 'Lotus Facilities Bhd', industry: 'Retail', employees: 2000, type: 'Customer', country: 'IN' },
  { name: 'Zenith Office Solutions', industry: 'Logistics', employees: 2000, type: 'Customer', country: 'IN' },
  { name: 'Northgate Instruments (2)', industry: 'Logistics', employees: 2000, type: 'Prospect', country: 'ID' },
]

type Account = (typeof TOP_10_ACCOUNTS)[number]

const TYPE_BADGE_CLASS: Record<string, string> = {
  Customer: 'bg-emerald-100 text-emerald-700',
  Prospect: 'bg-amber-100 text-amber-700',
  Partner: 'bg-brand-cornflower/15 text-brand-cornflower',
}

const TYPE_FILL_CLASS: Record<string, string> = {
  Customer: 'fill-emerald-500',
  Prospect: 'fill-amber-500',
  Partner: 'fill-brand-cornflower',
}

const INDUSTRY_FILL_CLASSES = ['fill-brand-navy', 'fill-brand-cornflower', 'fill-brand-purple', 'fill-emerald-500', 'fill-amber-500']

const RANK_BADGE_CLASS: Record<number, string> = {
  0: 'bg-brand-navy text-white shadow-md shadow-brand-navy/30',
  1: 'bg-brand-purple text-white shadow-md shadow-brand-purple/30',
  2: 'bg-brand-cornflower text-white shadow-md shadow-brand-cornflower/30',
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

// Animated number component
function AnimatedNumber({
  value,
  suffix = '',
  duration = 1000,
}: {
  value: number
  suffix?: string
  duration?: number
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isInView || hasAnimated.current) return
    hasAnimated.current = true

    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(2, -10 * progress)

      setDisplayValue(Math.round(eased * value))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration, isInView])

  return (
    <span ref={ref}>
      {displayValue}
      {suffix}
    </span>
  )
}

// Stats Card Component
interface StatCardProps {
  title: string
  value: number
  suffix?: string
  icon: React.ElementType
  trend?: { value: string; positive: boolean }
  colorClass: string
  delay?: number
}

function StatCard({
  title,
  value,
  suffix = '',
  icon: Icon,
  trend,
  colorClass,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      initial='hidden'
      animate='visible'
      transition={{ delay }}
      whileHover={{ y: -4 }}
    >
      <Card className='group relative h-full cursor-default overflow-hidden'>
        <CardWatermark opacity={3} scale={0.9} />
        <CardContent className='relative z-10 p-5'>
          <div className='flex items-start justify-between'>
            <div className='space-y-2'>
              <p className='text-micro uppercase text-brand-muted transition-colors duration-200 group-hover:text-brand-cornflower'>
                {title}
              </p>
              <p className='font-display text-[2.25rem] font-bold leading-none tracking-tight text-brand-navy'>
                <AnimatedNumber value={value} suffix={suffix} />
              </p>
              {trend && (
                <motion.p
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    trend.positive ? 'text-emerald-600' : 'text-red-500'
                  )}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.3 }}
                >
                  {trend.positive ? (
                    <Icons.trendingUp className='h-3 w-3' strokeWidth={2} />
                  ) : (
                    <Icons.trendingUp className='h-3 w-3 rotate-180' strokeWidth={2} />
                  )}
                  {trend.value}
                </motion.p>
              )}
            </div>
            <motion.div
              className={cn('rounded-xl p-2.5 text-white', 'shadow-lg', colorClass)}
              whileHover={{ scale: 1.15, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Icon className='h-5 w-5' strokeWidth={1.5} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Hero Section
function HeroSection({ userName }: { userName?: string }) {
  const firstName = userName?.split(' ')[0] || 'there'

  return (
    <motion.div
      className='col-span-12 py-2'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <h1 className='text-display-3 font-bold tracking-tight text-brand-navy lg:text-display-2'>
        Where Intelligence <br className='hidden sm:block' />
        <span className='text-gradient'>Meets Human.</span>
      </h1>
      <p className='mt-4 text-lg font-light text-muted-foreground'>
        Welcome back, {firstName}. Your Sales Intelligence Command Center is ready.
      </p>
    </motion.div>
  )
}

// Industry bar chart — click a bar to filter the leaderboard by industry.
function IndustryBarChart({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (industry: string | null) => void
}) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const acc of TOP_10_ACCOUNTS) counts[acc.industry] = (counts[acc.industry] ?? 0) + 1
    return Object.entries(counts).map(([industry, count]) => ({ industry, count }))
  }, [])

  return (
    <motion.div variants={itemVariants} className='col-span-12 lg:col-span-6'>
      <Card className='relative h-full overflow-hidden'>
        <CardWatermark opacity={3} scale={1.1} />
        <CardHeader className='relative z-10'>
          <CardTitle className='flex items-center gap-2'>
            <Icons.activity className='h-5 w-5 text-brand-cornflower' strokeWidth={1.5} />
            Top 10 by Industry
          </CardTitle>
          <p className='text-sm text-muted-foreground'>Click a bar to filter the leaderboard</p>
        </CardHeader>
        <CardContent className='relative z-10'>
          <ResponsiveContainer width='100%' height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} className='stroke-muted' />
              <XAxis dataKey='industry' tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={28} />
              <Tooltip
                cursor={{ className: 'fill-muted', opacity: 0.4 }}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Bar
                dataKey='count'
                radius={[6, 6, 0, 0]}
                cursor='pointer'
                onClick={(_data, index) => {
                  const entry = data[index]
                  if (!entry) return
                  onSelect(selected === entry.industry ? null : entry.industry)
                }}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={entry.industry}
                    className={cn(
                      INDUSTRY_FILL_CLASSES[i % INDUSTRY_FILL_CLASSES.length],
                      'transition-opacity',
                      selected && selected !== entry.industry && 'opacity-25'
                    )}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className='h-5'>
            {selected && (
              <button
                onClick={() => onSelect(null)}
                className='text-xs font-medium text-brand-cornflower hover:underline'
              >
                Clear filter — {selected} ×
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Account-type donut — click a slice to filter the leaderboard by type.
function TypeDonutChart({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (type: string | null) => void
}) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const acc of TOP_10_ACCOUNTS) counts[acc.type] = (counts[acc.type] ?? 0) + 1
    return Object.entries(counts).map(([type, count]) => ({ type, count }))
  }, [])

  return (
    <motion.div variants={itemVariants} className='col-span-12 lg:col-span-6'>
      <Card className='relative h-full overflow-hidden'>
        <CardWatermark opacity={3} scale={1.1} />
        <CardHeader className='relative z-10'>
          <CardTitle className='flex items-center gap-2'>
            <Icons.checkCircle className='h-5 w-5 text-brand-cornflower' strokeWidth={1.5} />
            Top 10 by Type
          </CardTitle>
          <p className='text-sm text-muted-foreground'>Click a slice to filter the leaderboard</p>
        </CardHeader>
        <CardContent className='relative z-10'>
          <ResponsiveContainer width='100%' height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey='count'
                nameKey='type'
                innerRadius={55}
                outerRadius={82}
                paddingAngle={3}
                cursor='pointer'
                onClick={(_data, index) => {
                  const entry = data[index]
                  if (!entry) return
                  onSelect(selected === entry.type ? null : entry.type)
                }}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.type}
                    className={cn(
                      TYPE_FILL_CLASS[entry.type] ?? 'fill-muted',
                      'transition-opacity',
                      selected && selected !== entry.type && 'opacity-25'
                    )}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend
                verticalAlign='bottom'
                height={28}
                formatter={(value: string) => <span className='text-xs text-muted-foreground'>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className='h-5'>
            {selected && (
              <button
                onClick={() => onSelect(null)}
                className='text-xs font-medium text-brand-cornflower hover:underline'
              >
                Clear filter — {selected} ×
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Account leaderboard. Receives an already-filtered list so it stays a dumb
// display component — all filter logic lives in AccountInsightsSection.
function Top10AccountsCard({
  accounts,
  isFiltered,
  onClearFilters,
}: {
  accounts: Account[]
  isFiltered: boolean
  onClearFilters: () => void
}) {
  // Scale bars against the full top-10 max so bar lengths stay stable while filtering.
  const maxEmployees = Math.max(...TOP_10_ACCOUNTS.map((a) => a.employees))

  return (
    <motion.div variants={itemVariants} className='col-span-12'>
      <Card className='relative overflow-hidden'>
        <CardWatermark opacity={3} scale={1.1} />
        <CardHeader className='relative z-10 flex-row items-start justify-between gap-4'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Icons.trendingUp className='h-5 w-5 text-brand-cornflower' strokeWidth={1.5} />
              Account Leaderboard
            </CardTitle>
            <p className='mt-1 text-sm text-muted-foreground'>
              {isFiltered
                ? `Showing ${accounts.length} of ${TOP_10_ACCOUNTS.length} accounts matching your selection.`
                : `Ranked by headcount out of ${ACCOUNT_STATS.totalAccounts} accounts in the book.`}
            </p>
          </div>
          {isFiltered && (
            <button
              onClick={onClearFilters}
              className='shrink-0 whitespace-nowrap rounded-full border border-brand-cornflower/30 px-3 py-1 text-xs font-medium text-brand-cornflower transition-colors hover:bg-brand-cornflower/10'
            >
              Clear all filters
            </button>
          )}
        </CardHeader>
        <CardContent className='relative z-10'>
          {accounts.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-10 text-center'>
              <p className='text-sm font-medium text-brand-navy'>No accounts match this combination.</p>
              <button onClick={onClearFilters} className='text-xs font-medium text-brand-cornflower hover:underline'>
                Clear filters
              </button>
            </div>
          ) : (
            <div className='space-y-1'>
              {accounts.map((acc) => {
                const rank = TOP_10_ACCOUNTS.findIndex((a) => a.name === acc.name)
                return (
                  <motion.div
                    key={acc.name}
                    layout
                    className='group grid grid-cols-[2rem_minmax(0,1fr)_5rem] items-center gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40 sm:grid-cols-[2rem_11rem_minmax(0,1fr)_4.5rem_5rem]'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold',
                        RANK_BADGE_CLASS[rank] ?? 'bg-muted text-brand-muted'
                      )}
                    >
                      {rank + 1}
                    </span>

                    <div className='min-w-0'>
                      <p className='truncate font-medium text-brand-navy'>{acc.name}</p>
                      <p className='truncate text-xs text-muted-foreground'>
                        {acc.industry} &middot; {acc.country}
                      </p>
                    </div>

                    <div className='hidden h-2 w-full overflow-hidden rounded-full bg-muted sm:block'>
                      <div
                        className='h-full rounded-full bg-gradient-to-r from-brand-navy to-brand-cornflower'
                        style={{ width: `${(acc.employees / maxEmployees) * 100}%` }}
                      />
                    </div>

                    <span className='hidden text-right font-mono text-sm text-muted-foreground sm:block'>
                      {acc.employees.toLocaleString()}
                    </span>

                    <span
                      className={cn(
                        'ml-auto rounded-full px-2.5 py-0.5 text-center text-xs font-medium sm:ml-0',
                        TYPE_BADGE_CLASS[acc.type] ?? 'bg-muted text-muted-foreground'
                      )}
                    >
                      {acc.type}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Industry Breakdown Card — full 68-account book, not filterable (no
// per-account detail exists for this aggregate, see the note near
// ACCOUNT_STATS above).
function IndustryBreakdownCard() {
  const industries = Object.entries(ACCOUNT_STATS.byIndustry).sort((a, b) => b[1] - a[1])
  const max = Math.max(...industries.map(([, v]) => v))

  return (
    <motion.div variants={itemVariants} className='col-span-12'>
      <Card className='relative h-full overflow-hidden'>
        <CardWatermark opacity={3} scale={1.1} />
        <CardHeader className='relative z-10'>
          <CardTitle className='flex items-center gap-2'>
            <Icons.activity className='h-5 w-5 text-brand-cornflower' strokeWidth={1.5} />
            Full Book by Industry
          </CardTitle>
          <p className='text-sm text-muted-foreground'>
            Share of all {ACCOUNT_STATS.totalAccounts} accounts by vertical
          </p>
        </CardHeader>
        <CardContent className='relative z-10 space-y-4'>
          {industries.map(([industry, count], i) => {
            const pct = Math.round((count / ACCOUNT_STATS.totalAccounts) * 100)
            return (
              <div key={industry} className='space-y-1.5'>
                <div className='flex items-baseline justify-between text-sm'>
                  <span className='flex items-center gap-2 font-medium text-brand-navy'>
                    <span className='font-mono text-xs text-brand-muted'>{String(i + 1).padStart(2, '0')}</span>
                    {industry}
                  </span>
                  <span className='font-mono text-xs text-muted-foreground'>
                    {count} &middot; {pct}%
                  </span>
                </div>
                <div className='h-2.5 w-full overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-brand-cornflower'
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Wraps the two charts + leaderboard together so the filter state (which
// industry / type is selected) stays local to this section.
function AccountInsightsSection() {
  const [industryFilter, setIndustryFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const filteredAccounts = useMemo(
    () =>
      TOP_10_ACCOUNTS.filter(
        (a) => (!industryFilter || a.industry === industryFilter) && (!typeFilter || a.type === typeFilter)
      ),
    [industryFilter, typeFilter]
  )

  const isFiltered = Boolean(industryFilter || typeFilter)

  const clearFilters = () => {
    setIndustryFilter(null)
    setTypeFilter(null)
  }

  return (
    <div className='grid gap-6 lg:grid-cols-12'>
      <IndustryBarChart selected={industryFilter} onSelect={setIndustryFilter} />
      <TypeDonutChart selected={typeFilter} onSelect={setTypeFilter} />
      <Top10AccountsCard accounts={filteredAccounts} isFiltered={isFiltered} onClearFilters={clearFilters} />
    </div>
  )
}

// Main Dashboard
export default function HomePage() {
  return (
    <motion.div className='space-y-6' variants={containerVariants} initial='hidden' animate='visible'>
      <HeroSection userName='Developer' />

      {/* Stats Grid */}
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <StatCard
          title='Total Accounts'
          value={ACCOUNT_STATS.totalAccounts}
          icon={Icons.users}
          trend={{ value: `${ACCOUNT_STATS.customers} customers`, positive: true }}
          colorClass='bg-brand-navy'
          delay={0.1}
        />
        <StatCard
          title='Active Prospects'
          value={ACCOUNT_STATS.prospects}
          icon={Icons.activity}
          trend={{
            value: `${Math.round((ACCOUNT_STATS.prospects / ACCOUNT_STATS.totalAccounts) * 100)}% of book`,
            positive: true,
          }}
          colorClass='bg-brand-cornflower'
          delay={0.2}
        />
        <StatCard
          title='Customer Accounts'
          value={ACCOUNT_STATS.customers}
          icon={Icons.checkCircle}
          trend={{
            value: `${Math.round((ACCOUNT_STATS.customers / ACCOUNT_STATS.totalAccounts) * 100)}% conversion`,
            positive: true,
          }}
          colorClass='bg-brand-purple'
          delay={0.3}
        />
        <StatCard
          title='Strategic Accounts'
          value={ACCOUNT_STATS.strategicAccounts}
          icon={Icons.sparkles}
          trend={{ value: 'Flagged', positive: true }}
          colorClass='bg-gradient-to-br from-brand-navy to-brand-purple'
          delay={0.4}
        />
      </div>

      {/* Interactive charts + cross-filtered leaderboard */}
      <AccountInsightsSection />

      {/* Full-book industry breakdown */}
      <IndustryBreakdownCard />
    </motion.div>
  )
}