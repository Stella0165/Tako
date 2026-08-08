import type { Policy } from '@/components/ai/policies/PolicyCard'

export interface LeadOrchestratorOutput {
  lead_id: string
  // Compliance
  consent_status: 'granted' | 'denied' | 'unknown'
  do_not_contact: boolean
  // CRM Identity
  crm_match_confidence: number // 0-1
  crm_record_id: string | null
  // Buying Group
  buying_group_complete: boolean
  economic_buyer_identified: boolean
  // ICP / Strategic Lead Automation
  icp_score: number // 0-100
  human_review_required: boolean
}

export interface EvaluationLogEntry {
  id: string
  timestamp: string
  lead_id: string
  policy_id: string
  policy_name: string
  entity_name: string | null
  priority: number
  passed: boolean
  reason: string
}

export interface LeadEvaluationResult {
  lead_id: string
  eligible: boolean
  blocked_by: string | null // policy name that blocked, if any
  human_review_required: boolean
  logs: EvaluationLogEntry[]
}

// ============================================================================
// Sales Policies — hardcoded initial definitions only.
// No evaluation results, run counts, timestamps, CRM records, ICP scores,
// compliance results, or lead identities are hardcoded here.
// Priority: 1 Compliance, 2 CRM Identity, 3 Buying Group, 4 ICP
// ============================================================================

export const SALES_POLICIES: Policy[] = [
  {
    id: 'sales-policy-consent-gate',
    name: 'Automated Outreach Consent Gate',
    description: 'Blocks automated outreach to any lead without verified consent or with a do-not-contact flag set.',
    natural_language: 'Only allow automated outreach to a lead if consent has been explicitly granted and the lead is not flagged as do-not-contact. If consent is denied, unknown, or the lead is flagged do-not-contact, block automated outreach.',
    summary: 'Compliance gate — no automated outreach without verified consent.',
    policy_type: 'logical',
    dsl: {
      conditions: [
        { field: 'consent_status', operator: 'equals', value: 'granted' },
        { field: 'do_not_contact', operator: 'equals', value: 'false' },
      ],
      actions: [{ type: 'allow_outreach' }],
      match_mode: 'all',
    },
    refined_instruction: null,
    ai_instruction: 'WHEN consent_status = granted AND do_not_contact = false THEN allow_outreach ELSE block_outreach',
    entity_name: 'lead',
    is_active: true,
    priority: 1,
    tags: ['compliance', 'consent', 'sales'],
    execution_count: 0,
    last_executed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sales-policy-crm-identity-gate',
    name: 'CRM Identity Integrity Gate',
    description: 'Requires a high-confidence CRM identity match before any automated action proceeds on a lead.',
    natural_language: 'Before acting automatically on a lead, verify the lead resolves to a CRM record with match confidence of at least 90%. If confidence is below the threshold or no CRM record is found, route the lead for manual identity resolution instead of automating.',
    summary: 'Identity gate — requires verified CRM match before automation proceeds.',
    policy_type: 'logical',
    dsl: {
      conditions: [
        { field: 'crm_match_confidence', operator: 'greater_than_or_equal', value: '0.9' },
        { field: 'crm_record_id', operator: 'not_equals', value: 'null' },
      ],
      actions: [{ type: 'proceed' }],
      match_mode: 'all',
    },
    refined_instruction: null,
    ai_instruction: 'WHEN crm_match_confidence >= 0.9 AND crm_record_id IS NOT NULL THEN proceed ELSE route_manual_identity_resolution',
    entity_name: 'lead',
    is_active: true,
    priority: 2,
    tags: ['crm', 'identity', 'sales'],
    execution_count: 0,
    last_executed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sales-policy-buying-group-gate',
    name: 'Buying Group Completeness Gate',
    description: 'Requires the buying group to be fully mapped, including an identified economic buyer, before advancing a lead.',
    natural_language: 'Only advance a lead through automated stages if the buying group has been fully mapped and an economic buyer has been identified. Otherwise, hold the lead for stakeholder discovery.',
    summary: 'Stakeholder gate — requires complete buying group mapping before advancing.',
    policy_type: 'logical',
    dsl: {
      conditions: [
        { field: 'buying_group_complete', operator: 'equals', value: 'true' },
        { field: 'economic_buyer_identified', operator: 'equals', value: 'true' },
      ],
      actions: [{ type: 'advance_lead' }],
      match_mode: 'all',
    },
    refined_instruction: null,
    ai_instruction: 'WHEN buying_group_complete = true AND economic_buyer_identified = true THEN advance_lead ELSE hold_for_stakeholder_discovery',
    entity_name: 'lead',
    is_active: true,
    priority: 3,
    tags: ['buying-group', 'stakeholders', 'sales'],
    execution_count: 0,
    last_executed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sales-policy-icp-threshold',
    name: 'Strategic Lead Automation Threshold',
    description: 'Auto-qualifies a lead for strategic automation only when ICP score clears the threshold and no human review is required.',
    natural_language: 'Automate lead handling only when the ICP fit score is 75 or higher. If human review is required for the lead, that requirement overrides ICP eligibility and the lead must be routed to a human, regardless of ICP score.',
    summary: 'ICP gate — auto-qualifies high-fit leads unless human review is required.',
    policy_type: 'logical',
    dsl: {
      conditions: [
        { field: 'icp_score', operator: 'greater_than_or_equal', value: '75' },
        { field: 'human_review_required', operator: 'equals', value: 'false' },
      ],
      actions: [{ type: 'auto_qualify' }],
      match_mode: 'all',
    },
    refined_instruction: null,
    ai_instruction: 'WHEN icp_score >= 75 AND human_review_required = false THEN auto_qualify ELSE route_human_review',
    entity_name: 'lead',
    is_active: true,
    priority: 4,
    tags: ['icp', 'automation-threshold', 'sales'],
    execution_count: 0,
    last_executed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// ============================================================================
// Evaluation Engine — runs the four gates, in priority order, against a
// Lead_Orchestrator output object. Human review overrides ICP eligibility.
// Every step is written to the evaluation log.
// ============================================================================

function evalCondition(
  output: LeadOrchestratorOutput,
  condition: { field: string; operator: string; value: string }
): boolean {
  const raw = (output as unknown as Record<string, unknown>)[condition.field]

  switch (condition.operator) {
    case 'equals':
      return String(raw) === condition.value

    case 'not_equals':
      return condition.value === 'null'
        ? raw !== null && raw !== undefined
        : String(raw) !== condition.value

    case 'greater_than':
      return typeof raw === 'number' && raw > Number(condition.value)

    case 'greater_than_or_equal':
      return typeof raw === 'number' && raw >= Number(condition.value)

    case 'less_than':
      return typeof raw === 'number' && raw < Number(condition.value)

    default:
      return false
  }
}

function evaluatePolicyAgainstLead(
  policy: Policy,
  output: LeadOrchestratorOutput
): { passed: boolean; reason: string } {
  if (!policy.is_active) {
    return { passed: true, reason: 'Policy inactive — skipped' }
  }

  const dsl = policy.dsl as
    {
      conditions: { field: string; operator: string; value: string }[]
      actions: { type: string; value?: string }[]
      match_mode: 'all' | 'any'
    }
  | null
  | undefined

if (!dsl || !dsl.conditions || dsl.conditions.length === 0) {
  return { passed: true, reason: 'No DSL conditions — skipped' }
}

const results = dsl.conditions.map((c) => evalCondition(output, c))

const passed =
  dsl.match_mode === 'any'
    ? results.some(Boolean)
    : results.every(Boolean)

const reason = passed
  ? 'All conditions satisfied'
  : `Failed condition(s): ${dsl.conditions
      .filter((_, i) => !results[i])
      .map((c) => `${c.field} ${c.operator} ${c.value}`)
      .join(', ')}`

  return { passed, reason }
}

/**
 * Evaluates a lead against the four sales gates in priority order:
 * 1 Compliance -> 2 CRM Identity -> 3 Buying Group -> 4 ICP.
 *
 * Any failed gate blocks the lead (fail-fast). If human_review_required is
 * true, that overrides ICP eligibility regardless of icp_score.
 *
 * Returns the outcome plus a full evaluation log.
 */
export function evaluateLeadAgainstPolicies(
  policies: Policy[],
  output: LeadOrchestratorOutput
): LeadEvaluationResult {
  const logs: EvaluationLogEntry[] = []
  const ordered = [...policies].sort((a, b) => a.priority - b.priority)

  let blockedBy: string | null = null

  for (const policy of ordered) {
    const { passed, reason } = evaluatePolicyAgainstLead(policy, output)

    logs.push({
      id: `log-${policy.id}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      lead_id: output.lead_id,
      policy_id: policy.id,
      policy_name: policy.name,
      entity_name: policy.entity_name,
      priority: policy.priority,
      passed,
      reason,
    })

    if (!passed && policy.is_active && !blockedBy) {
      blockedBy = policy.name
    }
  }

  // Human review always overrides ICP eligibility, independent of gate order.
  const humanReview = output.human_review_required === true

  if (humanReview && !blockedBy) {
    logs.push({
      id: `log-human-review-${Date.now()}`,
      timestamp: new Date().toISOString(),
      lead_id: output.lead_id,
      policy_id: 'sales-policy-icp-threshold',
      policy_name: 'Strategic Lead Automation Threshold',
      entity_name: 'lead',
      priority: 4,
      passed: false,
      reason: 'human_review_required = true overrides ICP eligibility',
    })

    blockedBy = 'Human Review Required'
  }

  return {
    lead_id: output.lead_id,
    eligible: blockedBy === null,
    blocked_by: blockedBy,
    human_review_required: humanReview,
    logs,
  }
}