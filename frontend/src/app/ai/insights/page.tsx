'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CardWatermark } from '@/components/ui/card-watermark'
import { Icons } from '@/components/ui/icons'
import { InsightCard, type Insight } from '@/components/ai/insights/InsightCard'
import { PatternCluster, type Pattern } from '@/components/ai/insights/PatternCluster'
import { ActionCard, type ActionItem } from '@/components/ai/insights/ActionCard'

const DEMO_INSIGHTS: Insight[] = [
  {
    id: 'demo-insight-001',
    type: 'pattern',
    severity: 'info',
    title: 'Deal Velocity Pattern Detected',
    description: 'Opportunities with 3+ stakeholder touchpoints in the first 2 weeks close 40% faster than average. Multi-threading early correlates strongly with shorter sales cycles.',
    data: { avg_days_to_close: 21, baseline_days: 35, sample_size: 128 },
    suggested_action: 'Share multi-threading playbook with reps',
    action_type: 'share_playbook',
    confidence: 0.92,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    is_demo: true,
  },
  {
    id: 'demo-insight-002',
    type: 'anomaly',
    severity: 'warning',
    title: 'Pipeline Stall Risk',
    description: '$340K across 9 deals have had no logged activity in 14+ days and are past their expected close date. These are at high risk of slipping to next quarter.',
    data: { at_risk_value: '$340,000', deal_count: 9, avg_days_stalled: 17 },
    suggested_action: 'Notify reps to re-engage stalled deals',
    action_type: 'reengage_pipeline',
    confidence: 0.95,
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    is_demo: true,
  },
  {
    id: 'demo-insight-003',
    type: 'recommendation',
    severity: 'info',
    title: 'Upsell Opportunity Identified',
    description: '12 accounts are using 90%+ of their current plan limits. These are strong candidates for expansion outreach this quarter.',
    data: { accounts: 12, avg_usage: '93%', potential_arr_lift: '$180,000' },
    suggested_action: 'Create expansion outreach list',
    action_type: 'create_campaign',
    confidence: 0.88,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    is_demo: true,
  },
  {
    id: 'demo-insight-004',
    type: 'anomaly',
    severity: 'warning',
    title: 'Duplicate Opportunity Detected',
    description: 'Two reps have open opportunities logged against the same account within 3 minutes of each other. Likely a duplicate entry or territory conflict.',
    data: { opportunity_1_id: 'OPP-2026-04521', opportunity_2_id: 'OPP-2026-04522', account: 'Meridian Logistics' },
    suggested_action: 'Flag for territory and dedupe review',
    action_type: 'review_duplicate',
    confidence: 0.97,
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    is_demo: true,
  },
  {
    id: 'demo-insight-005',
    type: 'alert',
    severity: 'critical',
    title: 'Quarter-End Revenue Gap',
    description: 'Current quarter pipeline is tracking $420K below target with 12 days remaining. Closing 3 of the top 5 open deals would close the gap.',
    data: { gap_to_target: '$420,000', days_remaining: 12, top_deals_needed: 3 },
    suggested_action: 'Escalate top 5 deals to leadership',
    action_type: 'escalate_deals',
    confidence: 0.94,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    is_demo: true,
  },
]

const DEMO_PATTERNS: Pattern[] = [
  { name: 'Multi-Threaded Deals Close Faster', frequency: 'weekly', confidence: 0.92, sample_size: 128, description: '3+ stakeholders engaged in first 2 weeks correlates with a 40% faster close', is_demo: true },
  { name: 'Early Demo Scheduling Drives Wins', frequency: 'monthly', confidence: 0.90, sample_size: 210, description: 'Demo booked within 5 days of first contact wins at 2.1x the rate', is_demo: true },
  { name: 'Usage-Based Expansion Signal', frequency: 'monthly', confidence: 0.88, sample_size: 64, description: 'Accounts at 90%+ plan usage convert to upsell 3x more often', is_demo: true },
  { name: 'Friday Deal Slippage', frequency: 'weekly', confidence: 0.81, sample_size: 95, description: 'Deals forecast to close on Fridays slip to the next week 35% of the time', is_demo: true },
]

const DEMO_ACTIONS: ActionItem[] = [
  { title: 'Re-engage 9 stalled deals worth $340K', priority: 'critical', estimated_impact: 'Protects $340,000 in at-risk pipeline', action_type: 'reengage_pipeline', action_config: { min_days_stalled: 14 }, is_demo: true },
  { title: 'Launch expansion campaign for 12 high-usage accounts', priority: 'high', estimated_impact: 'Potential $180,000 ARR lift', action_type: 'create_campaign', action_config: { segment: 'high_usage' }, is_demo: true },
  { title: 'Resolve duplicate opportunity for Meridian Logistics', priority: 'medium', estimated_impact: 'Prevents rep conflict and reporting error', action_type: 'review_duplicate', action_config: { opportunity_ids: ['OPP-2026-04521', 'OPP-2026-04522'] }, is_demo: true },
  { title: 'Escalate top 5 open deals to close quarter gap', priority: 'critical', estimated_impact: 'Closes $420,000 gap to quarter target', action_type: 'escalate_deals', action_config: { count: 5 }, is_demo: true },
]

interface _InsightsResponse {
  insights: Insight[]
  patterns: Pattern[]
  actions: ActionItem[]
}

// Tab configuration
interface Tab {
  id: string
  label: string
  icon: React.ElementType
}

const tabs: Tab[] = [
  { id: 'summary', label: 'Summary', icon: Icons.activity },
  { id: 'patterns', label: 'Patterns', icon: Icons.layers },
  { id: 'actions', label: 'Actions', icon: Icons.zap },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function AIInsightsPage() {
  const [activeTab, setActiveTab] = useState('summary')
  const [insights, setInsights] = useState<Insight[]>([])
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [actions, setActions] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const router = useRouter()

  const fetchInsights = useCallback(async () => {
    setIsLoading(true)
    // Simulate loading — replace with real API call
    setTimeout(() => {
      setInsights(DEMO_INSIGHTS)
      setPatterns(DEMO_PATTERNS)
      setActions(DEMO_ACTIONS)
      setIsLoading(false)
    }, 300)
  }, [])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    // Simulate analysis — replace with real API call
    setTimeout(() => {
      setInsights(DEMO_INSIGHTS)
      setPatterns(DEMO_PATTERNS)
      setActions(DEMO_ACTIONS)
      setIsAnalyzing(false)
    }, 1500)
  }

  const handleInsightAction = useCallback(async (insight: Insight) => {
    // Route based on action_type — adjust these paths to match your app's routes
    switch (insight.action_type) {
      case 'reengage_pipeline':
      case 'escalate_deals':
        router.push('/pipeline')
        break
      case 'create_campaign':
        router.push('/accounts?filter=high-usage')
        break
      case 'review_duplicate':
        router.push('/deals')
        break
      case 'share_playbook':
        router.push('/playbooks')
        break
      default:
        break
    }
  }, [router])

  const handleDismissInsight = useCallback(async (id: string) => {
    // Optimistic UI update
    setInsights(prev => prev.filter(i => i.id !== id))
  }, [])

  const handleApplyAction = useCallback(async (action: ActionItem) => {
    // Route based on action type — adjust these paths to match your app's routes
    switch (action.action_type) {
      case 'reengage_pipeline':
      case 'escalate_deals':
        router.push('/pipeline')
        break
      case 'create_campaign':
        router.push('/accounts?filter=high-usage')
        break
      case 'review_duplicate':
        router.push('/deals')
        break
      default:
        break
    }
  }, [router])

  // Stats for summary
  const criticalCount = insights.filter(i => i.severity === 'critical').length
  const warningCount = insights.filter(i => i.severity === 'warning').length
  const infoCount = insights.filter(i => i.severity === 'info').length

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-display-3 font-bold tracking-tight text-brand-navy lg:text-display-2">
            Sales Intelligence
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            AI-powered analysis of your pipeline and revenue. Discover deal risk, patterns, and growth opportunities.
          </p>
        </div>
        <Button
          variant="gradient"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Icons.sparkles className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Run Analysis
            </>
          )}
        </Button>
      </motion.div>

      {/* Demo Data Notice */}
      <motion.div 
        variants={itemVariants}
        className="rounded-lg border border-amber-200 bg-amber-50 p-4"
      >
        <div className="flex items-start gap-3">
          <Icons.info className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-900">Demo Insights</p>
            <p className="text-sm text-amber-700 mt-1">
              Items marked with [DEMO] are sample data for demonstration purposes.
              Connect your CRM or revenue data source to enable real-time analysis.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
        <Card className="relative overflow-hidden">
          <CardWatermark opacity={2} scale={0.8} />
          <CardContent className="relative z-10 flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <Icons.alertCircle className="h-6 w-6 text-red-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-navy">{criticalCount}</p>
              <p className="text-sm text-muted-foreground">Critical Issues</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardWatermark opacity={2} scale={0.8} />
          <CardContent className="relative z-10 flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <Icons.alertTriangle className="h-6 w-6 text-amber-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-navy">{warningCount}</p>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardWatermark opacity={2} scale={0.8} />
          <CardContent className="relative z-10 flex items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Icons.lightbulb className="h-6 w-6 text-blue-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-navy">{infoCount + patterns.length}</p>
              <p className="text-sm text-muted-foreground">Recommendations</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants}>
        <div className={cn(
          'inline-flex items-center gap-1 rounded-xl p-1',
          'bg-white/50 border border-border/50',
          'backdrop-blur-sm'
        )}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-2 rounded-lg px-4 py-2.5',
                  'text-sm font-medium transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cornflower/50',
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeInsightTab"
                    className="absolute inset-0 rounded-lg bg-brand-navy shadow-soft"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icons.loader className="h-8 w-8 animate-spin text-brand-cornflower" />
            </div>
          ) : (
            <>
              {activeTab === 'summary' && (
                <Card className="relative overflow-hidden">
                  <CardWatermark opacity={2} scale={1} />
                  <CardHeader className="relative z-10">
                    <CardTitle>All Insights</CardTitle>
                    <CardDescription>
                      {insights.length} insights generated from your pipeline and revenue data.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-4">
                    {insights.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className={cn(
                          'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl',
                          'bg-gradient-to-br from-brand-cornflower/20 to-brand-purple/20'
                        )}>
                          <Icons.lightbulb className="h-8 w-8 text-brand-cornflower" strokeWidth={1.5} />
                        </div>
                        <h3 className="font-display text-lg font-semibold text-brand-navy">
                          No insights yet
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                          Run an analysis to discover pipeline risk, patterns, and revenue opportunities.
                        </p>
                        <Button
                          variant="gradient"
                          className="mt-6"
                          onClick={handleAnalyze}
                          disabled={isAnalyzing}
                        >
                          <Icons.sparkles className="mr-2 h-4 w-4" strokeWidth={1.5} />
                          Generate Insights
                        </Button>
                      </div>
                    ) : (
                      insights.map((insight) => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onAction={handleInsightAction}
                          onDismiss={handleDismissInsight}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'patterns' && (
                <Card className="relative overflow-hidden">
                  <CardWatermark opacity={2} scale={1} />
                  <CardHeader className="relative z-10">
                    <CardTitle>Detected Patterns</CardTitle>
                    <CardDescription>
                      Recurring behaviors and trends identified in your sales data.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <PatternCluster patterns={patterns} />
                  </CardContent>
                </Card>
              )}

              {activeTab === 'actions' && (
                <Card className="relative overflow-hidden">
                  <CardWatermark opacity={2} scale={1} />
                  <CardHeader className="relative z-10">
                    <CardTitle>Recommended Actions</CardTitle>
                    <CardDescription>
                      AI-suggested moves to protect and grow revenue.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-3">
                    {actions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className={cn(
                          'mb-4 flex h-12 w-12 items-center justify-center rounded-xl',
                          'bg-muted/50'
                        )}>
                          <Icons.zap className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          No actions recommended at this time.
                        </p>
                      </div>
                    ) : (
                      actions.map((action, idx) => (
                        <ActionCard
                          key={idx}
                          action={action}
                          onApply={handleApplyAction}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}