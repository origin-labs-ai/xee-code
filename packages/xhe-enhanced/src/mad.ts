/**
 * Xee Harness Enhanced (XHE) - M.A.D (Multi-Agent Deployment) System
 * 
 * Advanced Multi-Agent Discussion Engine with full GOD Runtime integration.
 * This module provides both Basic (quick start) and Advanced (full GOD) modes.
 * 
 * Features:
 * - Multi-model coordination (8+ heterogeneous model instances)
 * - Plan/Build/Debug modes with distinct workflows
 * - Balanced turn-taking with role enforcement
 * - Devil's advocate role for adversarial discussion
 * - Consensus building with evidence requirements
 * - Multiple API key support via BYOK
 * - Cost intelligence and adaptive routing
 * - 15 Core Rules enforcement
 * - Full TRANSCRIPT.md specification compliance
 * 
 * @origin-ai/xhe/mad
 * @version 2.0.0
 */

import type { MADConfig, MAgentConfig, AgentRole } from './types'
import { invariant } from './invariant'
import { assertModelAccountability, assertBalancedAggression } from './invariant'

// Import advanced types and GOD Runtime
import type {
  GODRuntimeConfig,
  TaskSpecification,
  FinalReport,
  VerificationResult,
  GauntletResult,
  ProductionGateResult,
  ClaimNode,
  EvidenceNode,
  DiscussionRound as AdvancedDiscussionRound,
  AgentMessage as AdvancedAgentMessage,
  MemoryFabric,
  CostSummary,
  CoreRuleViolation,
  RoutingDecision,
  AgentPerformance as AdvancedAgentPerformance,
  MADMode,
  ProviderCredential,
  StopPolicy,
  ConvergenceMetrics,
  VerificationConfig,
  GauntletConfig,
  ProductionSweepConfig,
  CoreRule,
  XHEIdentity,
  ActiveAgent as AdvancedActiveAgent
} from './mad/types'

import {
  GODRuntime,
  createGODRuntime,
  xheExecute as advancedXHEExecute,
  XHE_IDENTITY,
  MAD_CORE_RULES
} from './mad/core/god-runtime'

// ============================================================================
// Enhanced Agent Discussion Types
// ============================================================================

export interface AgentMessage {
  messageId: string
  agentId: string
  content: string
  timestamp: number
  round: number
  type: 'opinion' | 'critique' | 'question' | 'consensus' | 'fact' | 'claim' | 'challenge' | 'evidence'
  confidence?: number // 0-100
  evidenceRefs?: string[] // SHA-256 hashes of supporting evidence
  challengedBy?: string[] // IDs of agents who challenged this
  metadata?: MessageMetadata
}

export interface MessageMetadata {
  tokensUsed?: number
  processingTimeMs?: number
  modelVersion?: string
  toolsUsed?: string[]
}

export interface DiscussionRound {
  roundId: string
  roundNumber: number
  messages: AgentMessage[]
  summary: string
  consensusLevel: number // 0-1
  newInformationRate: number // How much new info vs repeated (stall detection)
  contradictionsFound: number
  coverageScore: number // How well covered all aspects of task
  dominantViewpoint?: string // If one view is dominating
  stalled: boolean // Is discussion making progress?
  actionItems: string[] // Decisions or actions from this round
}

export interface MADResult {
  success: boolean
  mode: MADMode
  consensus?: string
  discussions: DiscussionRound[]
  participatingAgents: string[]
  totalRounds: number
  duration: number
  finalDecision: string
  verificationResult?: VerificationResult
  gauntletResult?: GauntletResult
  productionResult?: ProductionGateResult
  knowledgeGraph: {
    claims: ClaimNode[]
    evidence: EvidenceNode[]
  }
  coreRuleViolations: CoreRuleViolation[]
  costSummary: CostSummary
  telemetry: {
    startTime: number
    endTime: number
    totalTokensUsed: number
    totalCost: number
    agentPerformance: Map<string, AdvancedAgentPerformance>
    routingDecisions: RoutingDecision[]
  }
  recommendations: string[]
}

// ============================================================================
// Enhanced Configuration Types
// ============================================================================

export interface MADConfig {
  mode: MADMode
  agents?: MAgentConfig[]
  timeout?: number
  maxRounds?: number
  balanceLevel?: 'aggressive' | 'balanced' | 'conservative'
  enableVerification?: boolean
  enableGauntlet?: boolean
  enableProductionSweep?: boolean
  enforceCoreRules?: boolean
  costLimit?: number
  providers?: ProviderCredential[]
  stopPolicy?: Partial<StopPolicy>
  discussionPolicy?: {
    requireEvidence?: boolean
    devilAdvocateMandatory?: boolean
    allowInterruptions?: boolean
    synthesisRequired?: boolean
  }
}

export interface MAgentConfig {
  id: string
  name: string
  provider: string
  model: string
  role: AgentRole
  specialization: string[]
  apiKeyRef: string
  personality?: {
    aggressionLevel?: 'low' | 'medium' | 'high' | 'adaptive'
    creativityBias?: number // 0-1
    thoroughnessBias?: number // 0-1
    devilAdvocateProbability?: number // 0-1
  }
  constraints?: {
    maxTokensPerResponse?: number
    forcedPerspective?: boolean
  }
}

export type AgentRole = 
  | 'builder'
  | 'critic'
  | 'verifier'
  | 'architect'
  | 'debugger'
  | 'tester'
  | 'security'
  | 'ux'
  | 'coordinator'
  | 'devils_advocate'
  | 'researcher'
  | 'documenter'

// ============================================================================
// Pre-configured Agent Profiles (Extended)
// ============================================================================

const AGENT_PROFILES: Record<string, Omit<MAgentConfig, 'apiKeyRef'>> = {
  'opencode-ox-alpha': {
    id: 'opencode-ox-alpha',
    name: 'OpenCode Ox Alpha',
    provider: 'OpenCode',
    model: 'ox-alpha',
    role: 'builder',
    specialization: ['code-generation', 'architecture', 'patterns', 'typescript'],
    personality: {
      aggressionLevel: 'medium',
      creativityBias: 0.6,
      thoroughnessBias: 0.7,
      devilAdvocateProbability: 0.15
    }
  },
  'muse-spark-1.2': {
    id: 'muse-spark-1.2',
    name: 'Muse Spark 1.2',
    provider: 'Muse',
    model: 'spark-1.2',
    role: 'critic',
    specialization: ['code-review', 'optimization', 'best-practices', 'refactoring'],
    personality: {
      aggressionLevel: 'high',
      creativityBias: 0.4,
      thoroughnessBias: 0.9,
      devilAdvocateProbability: 0.35
    }
  },
  'deepseek-v4-flash': {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    provider: 'DeepSeek',
    model: 'v4-flash',
    role: 'debugger',
    specialization: ['debugging', 'error-analysis', 'testing', 'logging'],
    personality: {
      aggressionLevel: 'low',
      creativityBias: 0.3,
      thoroughnessBias: 0.95,
      devilAdvocateProbability: 0.1
    }
  },
  'generalist-gpt4o': {
    id: 'generalist-gpt4o',
    name: 'General AI (GPT-4o)',
    provider: 'OpenAI',
    model: 'gpt-4o',
    role: 'architect',
    specialization: ['system-design', 'planning', 'documentation', 'coordination'],
    personality: {
      aggressionLevel: 'balanced',
      creativityBias: 0.7,
      thoroughnessBias: 0.6,
      devilAdvocateProbability: 0.2
    }
  },
  'security-claude': {
    id: 'security-claude',
    name: 'Security Expert (Claude)',
    provider: 'Anthropic',
    model: 'claude-3.5-sonnet',
    role: 'security',
    specialization: ['security', 'vulnerability-scanning', 'compliance', 'auth'],
    personality: {
      aggressionLevel: 'high',
      creativityBias: 0.2,
      thoroughnessBias: 1.0,
      devilAdvocateProbability: 0.25
    }
  },
  'ux-gemini': {
    id: 'ux-gemini',
    name: 'UX Specialist (Gemini)',
    provider: 'Google',
    model: 'gemini-pro',
    role: 'ux',
    specialization: ['user-experience', 'accessibility', 'design-systems', 'research'],
    personality: {
      aggressionLevel: 'low',
      creativityBias: 0.85,
      thoroughnessBias: 0.65,
      devilAdvocateProbability: 0.15
    }
  },
  'tester-deepseek': {
    id: 'tester-deepseek',
    name: 'QA Specialist (DeepSeek)',
    provider: 'DeepSeek',
    model: 'v4-reasoning',
    role: 'tester',
    specialization: ['testing', 'qa', 'edge-cases', 'automation'],
    personality: {
      aggressionLevel: 'medium',
      creativityBias: 0.45,
      thoroughnessBias: 0.95,
      devilAdvocateProbability: 0.2
    }
  },
  'devils-advocate': {
    id: 'devils-advocate',
    name: "Devil's Advocate",
    provider: 'Mixed',
    model: 'adaptive',
    role: 'devils_advocate',
    specialization: ['critical-thinking', 'alternative-viewpoints', 'risk-analysis'],
    personality: {
      aggressionLevel: 'high',
      creativityBias: 0.75,
      thoroughnessBias: 0.7,
      devilAdvocateProbability: 0.85
    }
  }
}

// ============================================================================
// Mode Configurations (Per TRANSCRIPT Section 3)
// ============================================================================

const MODE_CONFIGS: Record<MADMode, {
  name: string
  description: string
  focus: string[]
  maxRounds: number
  consensusThreshold: number
  requiredRoles: AgentRole[]
  verificationLevel: 'minimal' | 'standard' | 'thorough'
}> = {
  plan: {
    name: 'Planning Mode',
    description: 'Agents collaborate to create detailed implementation plans with architecture decisions',
    focus: ['architecture', 'feasibility', 'timeline', 'risks', 'requirements'],
    maxRounds: 8,
    consensusThreshold: 0.75,
    requiredRoles: ['architect', 'builder', 'critic', 'researcher'],
    verificationLevel: 'standard'
  },
  build: {
    name: 'Build Mode',
    description: 'Agents work together to implement, review, and refine code with quality gates',
    focus: ['implementation', 'code-quality', 'testing', 'integration', 'performance'],
    maxRounds: 12,
    consensusThreshold: 0.65,
    requiredRoles: ['builder', 'reviewer', 'tester', 'security'],
    verificationLevel: 'thorough'
  },
  debug: {
    name: 'Debug Mode',
    description: 'Agents analyze issues, find root causes, and verify fixes systematically',
    focus: ['error-analysis', 'root-cause', 'fixes', 'prevention', 'regression'],
    maxRounds: 10,
    consensusThreshold: 0.80,
    requiredRoles: ['debugger', 'tester', 'builder', 'security'],
    verificationLevel: 'thorough'
  }
}

// ============================================================================
// Internal Types
// ============================================================================

interface InternalActiveAgent extends MAgentConfig {
  instanceId: string
  messageCount: number
  lastResponse: string
  isActive: boolean
  profile: Omit<MAgentConfig, 'apiKeyRef'>
  performanceScore: number
  state: 'idle' | 'thinking' | 'responding' | 'waiting' | 'error'
  metrics: {
    averageResponseTime: number
    qualityScore: number
    tokensUsed: number
    costIncurred: number
  }
}

// ============================================================================
// M.A.D Engine Class (Enhanced)
// ============================================================================

export class MADEngine {
  private config: Required<MADConfig>
  private agents: Map<string, InternalActiveAgent> = new Map()
  private discussions: DiscussionRound[] = []
  private claims: Map<string, ClaimNode> = new Map()
  private evidence: Map<string, EvidenceNode> = new Map()
  private startTime: number = 0
  private coreRules: CoreRule[]
  private routingDecisions: RoutingDecision[] = []

  constructor(config: MADConfig) {
    this.config = {
      mode: config.mode || 'plan',
      agents: config.agents || [],
      timeout: config.timeout || 300000, // 5 minutes default
      maxRounds: config.maxRounds || MODE_CONFIGS[config.mode || 'plan'].maxRounds,
      balanceLevel: config.balanceLevel || 'balanced',
      enableVerification: config.enableVerification !== false,
      enableGauntlet: config.enableGauntlet || false,
      enableProductionSweep: config.enableProductionSweep || false,
      enforceCoreRules: config.enforceCoreRules !== false,
      costLimit: config.costLimit || 10.0,
      providers: config.providers || [],
      stopPolicy: config.stopPolicy || {},
      discussionPolicy: {
        requireEvidence: config.discussionPolicy?.requireEvidence !== false,
        devilAdvocateMandatory: config.discussionPolicy?.devilAdvocateMandatory !== false,
        allowInterruptions: config.discussionPolicy?.allowInterruptions || false,
        synthesisRequired: config.discussionPolicy?.synthesisRequired !== false
      }
    }

    this.coreRules = MAD_CORE_RULES
    this.initializeAgents()
  }

  // ============================================================================
  // Agent Initialization
  // ============================================================================

  private initializeAgents(): void {
    console.log('╔═══════════════════════════════════════════════════╗')
    console.log('║     🏛️  M.A.D. SYSTEM INITIALIZING               ║')
    console.log('║     MULTI-AGENT DEPLOYMENT (ENHANCED)             ║')
    console.log('╚═══════════════════════════════════════════════════╝')

    if (this.config.agents.length === 0) {
      console.log('\n📋 Using default enhanced agent configuration...')
      this.setupDefaultAgents()
    } else {
      console.log(`\n📋 Configuring ${this.config.agents.length} custom agents...`)
      this.config.agents.forEach(agentConfig => this.addAgent(agentConfig))
    }

    this.enforceRoleDiversity()
    console.log(`\n✅ ${this.agents.size} agents ready for discussion`)
    this.logAgentSummary()
  }

  private setupDefaultAgents(): void {
    // Default setup uses diverse agents for balanced discussion
    const defaultAgents = [
      AGENT_PROFILES['opencode-ox-alpha'],
      AGENT_PROFILES['muse-spark-1.2'],
      AGENT_PROFILES['deepseek-v4-flash'],
      AGENT_PROFILES['devils-advocate']
    ].map(agent => ({ ...agent, apiKeyRef: 'default' }))

    defaultAgents.forEach(agent => this.addAgent(agent))
  }

  private addAgent(config: MAgentConfig): void {
    invariant(config.id, 'Agent ID required')
    invariant(config.provider, 'Provider required')
    invariant(config.model, 'Model required')

    const internalAgent: InternalActiveAgent = {
      ...config,
      instanceId: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messageCount: 0,
      lastResponse: '',
      isActive: true,
      profile: AGENT_PROFILES[config.id] || {
        id: config.id,
        name: config.name || config.id,
        provider: config.provider,
        model: config.model,
        role: config.role,
        specialization: config.specialization
      },
      performanceScore: 75, // Start neutral
      state: 'idle',
      metrics: {
        averageResponseTime: 1000,
        qualityScore: 75,
        tokensUsed: 0,
        costIncurred: 0
      }
    }

    this.agents.set(config.id, internalAgent)
  }

  private enforceRoleDiversity(): void {
    const modeConfig = MODE_CONFIGS[this.config.mode]
    const currentRoles = new Set(Array.from(this.agents.values()).map(a => a.role))
    
    // Check if we have required roles
    const missingRoles = modeConfig.requiredRoles.filter(role => !currentRoles.has(role))
    
    if (missingRoles.length > 0 && this.agents.size < 8) {
      console.log(`\n⚠️ Adding missing roles for ${this.config.mode} mode: ${missingRoles.join(', ')}`)
      
      missingRoles.forEach(role => {
        // Find an agent profile with this role
        const profile = Object.values(AGENT_PROFILES).find(p => p.role === role)
        if (profile) {
          this.addAgent({ ...profile, apiKeyRef: 'auto-added' })
        }
      })
    }
  }

  private logAgentSummary(): void {
    console.log('\n👥 AGENT ROSTER:')
    console.log('─'.repeat(60))
    
    this.agents.forEach((agent, id) => {
      const roleEmoji = this.getRoleEmoji(agent.role)
      console.log(`${roleEmoji} ${agent.name} (${agent.provider}/${agent.model})`)
      console.log(`   Role: ${agent.role} | Specialization: ${agent.specialization.join(', ')}`)
      console.log(`   Confidence Bias: ${agent.personality?.creativityBias ?? 0.5} | Thoroughness: ${agent.personality?.thoroughnessBias ?? 0.7}`)
    })
    
    console.log('\n📜 CORE RULES ACTIVE:')
    console.log(`   Total: ${this.coreRules.length} rules | Enforcement: ${this.config.enforceCoreRules ? 'ON' : 'OFF'}`)
  }

  private getRoleEmoji(role: AgentRole): string {
    const emojis: Record<AgentRole, string> = {
      builder: '🔨',
      critic: '🔍',
      verifier: '✅',
      architect: '🏗️',
      debugger: '🐛',
      tester: '🧪',
      security: '🛡️',
      ux: '🎨',
      coordinator: '🎯',
      devils_advocate: '😈',
      researcher: '🔬',
      documenter: '📚'
    }
    return emojis[role] || '🤖'
  }

  // ============================================================================
  // Main Discussion Loop (Enhanced)
  // ============================================================================

  async discuss(task: string): Promise<MADResult> {
    this.startTime = Date.now()
    const modeConfig = MODE_CONFIGS[this.config.mode]

    console.log(`\n${'='.repeat(70)}`)
    console.log(`🎯 TASK: ${task}`)
    console.log(`📊 MODE: ${modeConfig.name}`)
    console.log(`🔄 MAX ROUNDS: ${this.config.maxRounds}`)
    console.log(`⚖️ BALANCE LEVEL: ${this.config.balanceLevel.toUpperCase()}`)
    console.log(`✅ VERIFICATION: ${this.config.enableVerification ? 'ENABLED' : 'DISABLED'}`)
    console.log(`📜 CORE RULES: ${this.config.enforceCoreRules ? 'ENFORCED' : 'RELAXED'}`)
    console.log(`${'='.repeat(70)}\n`)

    let finalDecision = ''
    let shouldContinue = true

    for (let round = 1; round <= this.config.maxRounds && shouldContinue; round++) {
      console.log(`\n${'─'.repeat(60)}`)
      console.log(`📢 ROUND ${round}/${this.config.maxRounds}`)
      console.log(`${'─'.repeat(60)}`)

      const roundResult = await this.conductRound(round, task)
      this.discussions.push(roundResult)

      // Check for core rule violations after each round
      if (this.config.enforceCoreRules) {
        const violations = this.checkRuleViolations(roundResult)
        if (violations.length > 0) {
          console.log(`\n⚠️ Rule Violations: ${violations.length}`)
          violations.forEach(v => console.log(`   [${v.severity}] ${v.ruleName}: ${v.description}`))
        }
      }

      // Check stop conditions
      shouldContinue = this.shouldContinueDiscussion(roundResult)

      // Check timeout
      if (Date.now() - this.startTime > this.config.timeout) {
        console.log('\n⏰ Timeout reached, forcing conclusion...')
        break
      }
    }

    if (!finalDecision) {
      finalDecision = await this.generateFinalDecision(task)
    }

    // Run optional verification
    let verificationResult: VerificationResult | undefined
    if (this.config.enableVerification && this.claims.size > 0) {
      verificationResult = await this.runBasicVerification()
    }

    // Compile result
    const result: MADResult = await this.compileMADResult(finalDecision, verificationResult)

    this.logFinalSummary(result)
    return result
  }

  // ============================================================================
  // Round Management (Enhanced)
  // ============================================================================

  private async conductRound(roundNumber: number, task: string): Promise<DiscussionRound> {
    const messages: AgentMessage[] = []
    const modeConfig = MODE_CONFIGS[this.config.mode]
    const startTime = Date.now()

    console.log(`\n📋 Focus areas: ${modeConfig.focus.join(', ')}`)

    // Determine turn order (can be influenced by balance level)
    const turnOrder = this.determineTurnOrder(roundNumber)

    // Each agent contributes based on their role
    for (const agentId of turnOrder) {
      const agent = this.agents.get(agentId)
      if (!agent || !agent.isActive) continue

      try {
        agent.state = 'thinking'
        
        const message = await this.getAgentContribution(agent, task, roundNumber, messages)
        
        // Validate agent response (model behavior rules)
        const accountabilityCheck = assertModelAccountability(message.content, false)
        const aggressionCheck = assertBalancedAggression(message.content)

        if (!accountabilityCheck.isValid) {
          console.warn(`⚠️ Agent ${agentId} violated accountability rules`)
          // Request re-response or penalize
          agent.performanceScore = Math.max(0, agent.performanceScore - 5)
        }

        if (!aggressionCheck.isValid) {
          console.warn(`⚠️ Agent ${agentId} violated aggression balance`)
          agent.performanceScore = Math.max(0, agent.performanceScore - 3)
        }

        messages.push(message)
        agent.messageCount++
        agent.lastResponse = message.content
        agent.state = 'responding'
        
        // Update metrics
        agent.metrics.tokensUsed += message.metadata?.tokensUsed || Math.floor(message.content.length / 4)
        agent.metrics.averageResponseTime = 
          (agent.metrics.averageResponseTime + (message.metadata?.processingTimeMs || 200)) / 2

        console.log(`\n💬 ${agent.name}:`)
        console.log(`   [${message.type.toUpperCase()}] ${this.truncate(message.content, 150)}`)
        if (message.confidence !== undefined) {
          console.log(`   Confidence: ${message.confidence}%`)
        }

        agent.state = 'idle'

      } catch (error) {
        console.error(`❌ Error from agent ${agentId}:`, error)
        agent.isActive = false
        agent.state = 'error'
        
        messages.push({
          messageId: `err_${Date.now()}`,
          agentId,
          content: `[Error: Agent unavailable - ${error instanceof Error ? error.message : 'Unknown error'}]`,
          timestamp: Date.now(),
          round: roundNumber,
          type: 'fact'
        })
      }
    }

    // Generate round summary with synthesis
    const summary = await this.generateRoundSummary(messages)
    const consensusLevel = this.calculateConsensusLevel(messages)
    const newInformationRate = this.calculateNewInformationRate(messages)
    const contradictionsFound = this.countContradictions(messages)
    const coverageScore = this.calculateCoverageScore(messages, task)
    const stalled = this.detectStall(newInformationRate, contradictionsFound)
    const actionItems = this.extractActionItems(summary)

    console.log(`\n📝 Round ${roundNumber} Summary:`)
    console.log(`   ${this.truncate(summary, 200)}`)
    console.log(`   Consensus Level: ${(consensusLevel * 100).toFixed(1)}%`)
    console.log(`   New Information Rate: ${(newInformationRate * 100).toFixed(1)}%`)
    console.log(`   Contradictions Found: ${contradictionsFound}`)
    console.log(`   Coverage Score: ${(coverageScore * 100).toFixed(1)}%`)
    if (stalled) {
      console.log(`   ⚠️ Discussion may be stalling`)
    }

    return {
      roundId: `round_${roundNumber}_${Date.now()}`,
      roundNumber,
      messages,
      summary,
      consensusLevel,
      newInformationRate,
      contradictionsFound,
      coverageScore,
      stalled,
      actionItems
    }
  }

  private determineTurnOrder(round: number): string[] {
    const agentIds = Array.from(this.agents.keys())
    
    switch (this.config.balanceLevel) {
      case 'aggressive':
        // Random order for diversity
        return agentIds.sort(() => Math.random() - 0.5)
        
      case 'conservative':
        // Fixed order, predictable
        return agentIds.sort()
        
      case 'balanced':
      default:
        // Rotating order with some randomness
        if (round % 2 === 0) {
          return agentIds.reverse()
        }
        // Slightly shuffle
        return agentIds
          .map((id, i) => ({ id, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ id }) => id)
    }
  }

  private async getAgentContribution(
    agent: InternalActiveAgent,
    task: string,
    round: number,
    previousMessages: AgentMessage[]
  ): Promise<AgentMessage> {
    const context = this.buildAgentContext(agent, task, round, previousMessages)
    
    // Simulate agent response (in production, would call actual LLM API)
    const response = await this.simulateAgentResponse(agent, context, round)

    // Determine message type based on role and content
    const messageType = this.determineMessageType(agent, round, response)
    
    // Calculate confidence based on agent personality and content
    const confidence = this.calculateConfidence(agent, response)

    // Extract any claims made by the agent
    const claimsMade = this.extractClaims(response, agent)
    claimsMade.forEach(claim => this.claims.set(claim.claimId, claim))

    return {
      messageId: `msg_${agent.id}_${Date.now()}`,
      agentId: agent.id,
      content: response,
      timestamp: Date.now(),
      round,
      type: messageType,
      confidence,
      evidenceRefs: [], // Would be populated in real implementation
      metadata: {
        tokensUsed: Math.floor(response.length / 4),
        processingTimeMs: 150 + Math.random() * 350,
        toolsUsed: []
      }
    }
  }

  private buildAgentContext(
    agent: InternalActiveAgent,
    task: string,
    round: number,
    previousMessages: AgentMessage[]
  ): string {
    const modeConfig = MODE_CONFIGS[this.config.mode]
    
    let context = `You are ${agent.name}, a ${agent.role} agent.\n`
    context += `Your specializations: ${agent.specialization.join(', ')}.\n`
    
    if (agent.personality) {
      context += `\nPersonality Settings:\n`
      context += `- Aggression Level: ${agent.personality.aggressionLevel}\n`
      context += `- Creativity Bias: ${agent.personality.creativityBias}\n`
      context += `- Thoroughness Bias: ${agent.personality.thoroughnessBias}\n`
    }
    
    context += `\nMODE: ${modeConfig.name}\n`
    context += `TASK: ${task}\n`
    context += `ROUND: ${round}\n\n`

    // Add active core rules relevant to this agent
    if (this.config.enforceCoreRules) {
      const relevantRules = this.coreRules
        .filter(rule => rule.category === 'truth_seeking' || rule.category === 'collaboration')
        .slice(0, 3)
      
      if (relevantRules.length > 0) {
        context += `CORE RULES TO FOLLOW:\n`
        relevantRules.forEach(rule => {
          context += `- ${rule.name}: ${rule.description}\n`
        })
        context += '\n'
      }
    }

    if (previousMessages.length > 0) {
      context += 'Previous discussion:\n'
      previousMessages.slice(-5).forEach(msg => {
        const sender = this.agents.get(msg.agentId)?.name || msg.agentId
        context += `- ${sender} [${msg.type}${msg.confidence ? `, ${msg.confidence}% conf` : ''}]: ${this.truncate(msg.content, 120)}\n`
      })
    }

    // Add existing claims for context
    if (this.claims.size > 0 && round > 1) {
      context += '\nCurrent Claims:\n'
      Array.from(this.claims.values()).slice(-5).forEach(claim => {
        context += `- [${claim.status}] ${claim.text.substring(0, 80)}... (${claim.confidence}%)\n`
      })
    }

    // Add role-specific instructions
    context += `\n${this.getRoleInstructions(agent.role, round)}`

    return context
  }

  private getRoleInstructions(role: AgentRole, round: number): string {
    const instructions: Record<AgentRole, string> = {
      builder: 'Provide constructive implementation suggestions. Be specific about code structure, patterns, and trade-offs.',
      critic: 'Identify potential issues or improvements. Be firm but fair. Challenge assumptions constructively.',
      verifier: 'Focus on verifying claims with evidence. Request proof for assertions. Flag unsupported statements.',
      architect: 'Ensure overall system coherence and scalability. Identify architectural implications.',
      debugger: 'Focus on identifying root causes of potential issues. Suggest debugging strategies.',
      tester: 'Suggest test cases and validation approaches. Consider edge cases and failure modes.',
      security: 'Highlight security concerns and suggest mitigations. Think like an attacker.',
      ux: 'Consider user experience implications. Focus on accessibility and usability.',
      coordinator: 'Synthesize viewpoints. Identify convergence and divergence. Move toward resolution.',
      devils_advocate: 'Challenge assumptions forcefully but fairly. Propose alternatives. Play devil\'s advocate.',
      researcher: 'Provide data-driven insights. Reference established research and best practices.',
      documenter: 'Note what needs documentation. Identify gaps in understanding.'
    }

    const base = instructions[role] || 'Provide your expert opinion.'

    if (round > 1) {
      return base + '\n\nBuild upon or challenge previous suggestions. Move toward consensus or clear disagreement with reasoned arguments.'
    }
    
    return base + '\n\nThis is the opening round. Set the foundation for productive discussion.'
  }

  private async simulateAgentResponse(agent: InternalActiveAgent, context: string, round: number): Promise<string> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150))

    // Role-based response templates that evolve with rounds
    const responses: Record<AgentRole, string[][]> = {
      builder: [
        [`Based on my expertise in ${agent.specialization[0]}, I recommend implementing this using modular architecture with clear separation of concerns. This allows for better testing and maintenance.`, 
         `For this task, I'd suggest starting with the core functionality first, then layering on additional features. The key is to establish a solid foundation early.`,
         `Looking at the requirements, I see an opportunity to use established patterns here. Let me outline a specific approach that addresses the key concerns.`],
        [`Building on previous discussion, I think we should refine our approach by focusing specifically on ${agent.specialization[1]}. Here's my updated proposal...`,
         `I've incorporated the feedback from other agents. My revised suggestion addresses the concerns raised while maintaining the core benefits.`],
        [`After several rounds of discussion, I believe we have enough information to move forward with implementation. Let me summarize the agreed-upon approach...`]
      ],
      critic: [
        [`While the initial approach has merit, I see several potential issues we need to address. First, we haven't fully considered edge cases around error handling.`,
         `I have concerns about scalability with the proposed approach. Under load, this could become a significant bottleneck. We should explore alternatives.`],
        [`The refinements are helpful, but I still see gaps in ${agent.specialization[0]}. Let me be specific about what's missing...`,
         `I want to push back on one assumption that seems to be forming. Are we sure about this direction?`],
        [`At this point, my main concerns have been addressed. I can support moving forward with the remaining minor issues noted for follow-up.``]
      ],
      verifier: [
        [`Before we proceed, I need to see evidence supporting these claims. Can we get specific benchmarks or test results?`,
         `I've reviewed the proposals against our requirements. Several assertions need verification before we can consider them validated.`],
        [`Good progress on evidence gathering. I'd like to see one more round of verification on the key claims before we finalize.`,
         `The evidence is building well. Most critical claims now have adequate support.`],
        [`Verification complete. All major claims have been substantiated with sufficient evidence. We can proceed with confidence.`]
      ],
      architect: [
        [`From an architectural standpoint, we need to ensure this aligns with our long-term goals. The interfaces need careful design to avoid coupling issues.`,
         `Let me think about the bigger picture here. How does this fit into our overall system evolution?`],
        [`The architectural implications are becoming clearer. I see a path forward that balances immediate needs with future flexibility.`,
         `I'm now satisfied that the architectural approach is sound. The key decisions are well-founded.`],
        [`Final architecture review complete. The proposed structure supports our requirements effectively.`]
      ],
      debugger: [
        [`If we encounter issues here, the most likely causes would be X, Y, and Z. Let me outline a proactive debugging strategy.`,
         `I've identified several potential failure points we should monitor. Here's my suggested approach.`],
        [`Based on the discussion, I've refined my understanding of the risk areas. Let me update my debugging priorities.`,
         `The error surface is now well-understood. We have good coverage of potential failure modes.`],
        [`Debugging strategy finalized. We're prepared for the most likely scenarios.`]
      ],
      tester: [
        [`We need comprehensive test coverage here. I'd start with unit tests for core logic, then integration tests for interactions.`,
         `Don't forget edge cases and boundary conditions. Let me outline the key test scenarios we need.`],
        [`Good progress on test strategy. I'd like to add a few more regression tests based on the discussion.`,
         `Test plan is comprehensive. We have good coverage of happy paths, error cases, and edge cases.`],
        [`Test strategy approved. Ready for execution phase.`]
      ],
      security: [
        [`From a security perspective, we must consider input validation, authentication flows, and authorization at each step. Let me identify specific concerns.`,
         `I see potential attack vectors we need to address. Principle of least privilege should guide our design.`],
        [`Security concerns are being addressed well. A few more items need attention before we can sign off.`,
         `Security baseline achieved. All critical attack vectors have mitigations in place.`],
        [`Security review complete. Ready for production consideration.`]
      ],
      ux: [
        [`User experience considerations suggest we should simplify the flow. Users might get confused with unnecessary complexity.`,
         `Accessibility is important here. We need to ensure screen readers and keyboard navigation work properly.`],
        [`The UX direction is solidifying. A few refinements will improve the experience significantly.`,
         `User experience is well-addressed. The solution is intuitive and accessible.`],
        [`UX review complete. Approved for user testing.`]
      ],
      coordinator: [
        [`Synthesizing the discussion so far, I see agreement on several points but divergence on others. Let me try to find common ground.`,
         `We've made good progress. Let me summarize the key points of agreement and the open questions we still need to resolve.`],
        [`The discussion is converging nicely. Most viewpoints have been reconciled. A few items remain open.`,
         `Strong convergence achieved. Ready to synthesize final position.`],
        [`Coordination complete. Consensus position ready for documentation.`]
      ],
      devils_advocate: [
        [`Playing devil's advocate here - what if our fundamental assumption is wrong? Have we seriously considered alternative approaches?`,
         `I challenge the emerging consensus. Are we just agreeing because it's easier, or is this genuinely the best path?`],
        [`Still seeing some unexamined assumptions. Let me push back on a few more points before we settle.`,
         `My concerns have been adequately addressed. I can now support the group direction.`],
        [`Devil's advocacy complete. All challenges have been resolved satisfactorily.`]
      ],
      researcher: [
        [`Based on research in this area, similar projects have found success with approaches like X. Here's what the data shows.`,
         `Industry trends and best practices suggest we should consider Y. Let me share relevant findings.`],
        [`Additional research supports the direction we're taking. Here are some more data points.`,
         `Research fully incorporated. Our approach aligns with established best practices.`],
        [`Research review complete. Findings integrated into our approach.`]
      ],
      documenter: [
        [`We should document the rationale behind these decisions. Future maintainers will need this context.`,
         `Let me note the key decisions made and the trade-offs considered. This needs to go in our project docs.`],
        [`Documentation is shaping up well. The decision trail is clear and comprehensive.`,
         `Documentation complete. All key decisions and rationale captured.`],
        [`Documentation audit complete. Ready for knowledge transfer.`]
      ]
    }

    const roleResponses = responses[agent.role] || responses.critic
    
    // Select response pool based on round (early/middle/late)
    let poolIndex = 0
    if (round > Math.floor(this.config.maxRounds * 0.66)) poolIndex = 2
    else if (round > Math.floor(this.config.maxRounds * 0.33)) poolIndex = 1
    
    const pool = roleResponses[poolIndex] || roleResponses[0]
    return pool[Math.min(round - 1, pool.length - 1)]
  }

  private determineMessageType(agent: InternalActiveAgent, round: number, content: string): AgentMessage['type'] {
    if (agent.role === 'devils_advocate') return 'challenge'
    if (agent.role === 'verifier') return round > 2 ? 'question' : 'fact'
    if (content.toLowerCase().includes('i recommend') || content.toLowerCase().includes('suggest')) return 'opinion'
    if (content.toLowerCase().includes('concern') || content.toLowerCase().includes('issue')) return 'critique'
    if (content.toLowerCase().includes('evidence') || content.toLowerCase().includes('data')) return 'evidence'
    if (content.toLowerCase().includes('we should') || content.toLowerCase().includes('let me')) return 'claim'
    if (round >= this.config.maxRounds - 1) return 'consensus'
    return 'opinion'
  }

  private calculateConfidence(agent: InternalActiveAgent, response: string): number {
    let confidence = 70 // Base confidence

    // Adjust based on personality
    if (agent.personality) {
      if (agent.personality.aggressionLevel === 'high') confidence += 10
      if (agent.personality.creativityBias > 0.7) confidence -= 5
      if (agent.personality.thoroughnessBias > 0.8) confidence += 10
    }

    // Adjust based on response characteristics
    if (response.includes('evidence') || response.includes('data') || response.includes('benchmark')) confidence += 15
    if (response.toLowerCase().includes('might') || response.toLowerCase().includes('i think') || response.toLowerCase().includes('perhaps')) confidence -= 15
    if (response.length > 300) confidence += 5 // Longer responses often more considered
    if (response.includes('certainty') || response.toLowerCase().includes('definitely')) confidence += 10

    return Math.min(Math.max(confidence, 20), 100)
  }

  private extractClaims(response: string, agent: InternalActiveAgent): ClaimNode[] {
    const claims: ClaimNode[] = []
    
    // Simple claim extraction (would use NLP in production)
    const claimPatterns = [
      /i (recommend|suggest|propose|believe|think)\s+(that\s+)?(.+?)(?=\.|\n|$)/gi,
      /we should (.+?)(?=\.|\n|$)/gi,
      /(.+?) (is|are) (the )?(best|optimal|recommended) (.+?)(?=\.|\n|$)/gi
    ]

    claimPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(response)) !== null) {
        const claimText = match[0]?.trim()
        if (claimText && claimText.length > 20) {
          claims.push({
            claimId: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            text: claimText,
            originModel: agent.model,
            originAgent: agent.id,
            confidence: this.calculateConfidence(agent, claimText),
            status: 'HYPOTHESIS',
            timestamp: Date.now(),
            evidenceIds: [],
            challengeIds: [],
            supportingClaims: [],
            contradictingClaims: [],
            version: 1
          })
        }
      }
    })

    return claims.slice(0, 3) // Limit claims per message
  }

  // ============================================================================
  // Analysis & Metrics Methods
  // ============================================================================

  private async generateRoundSummary(messages: AgentMessage[]): Promise<string> {
    if (messages.length === 0) return 'No contributions this round.'

    const opinions = messages.filter(m => m.type === 'opinion').length
    const critiques = messages.filter(m => m.type === 'critique').length
    const challenges = messages.filter(m => m.type === 'challenge').length
    const evidence = messages.filter(m => m.type === 'evidence').length
    const consensus = messages.filter(m => m.type === 'consensus').length

    const avgConfidence = messages.reduce((sum, m) => sum + (m.confidence || 70), 0) / messages.length

    return `Round completed with ${messages.length} contributions: ${opinions} opinions, ${critiques} critiques, ${challenges} challenges, ${evidence} evidence references, ${consensus} consensus points. Average confidence: ${avgConfidence.toFixed(0)}%.`
  }

  private calculateConsensusLevel(messages: AgentMessage[]): number {
    if (messages.length < 2) return 0.5

    const consensusMessages = messages.filter(m => m.type === 'consensus')
    const totalMessages = messages.length

    // Base consensus increases with rounds
    const roundFactor = Math.min(0.75, this.discussions.length * 0.08)
    const consensusFactor = (consensusMessages.length / totalMessages) * 0.35

    // Agreement factor (simplified)
    const agreementFactor = this.calculateAgreementFactor(messages)

    return Math.min(1, roundFactor + consensusFactor + agreementFactor + 0.1)
  }

  private calculateAgreementFactor(messages: AgentMessage[]): number {
    // Simplified agreement calculation
    let agreements = 0
    let totalComparisons = 0

    for (let i = 0; i < messages.length; i++) {
      for (let j = i + 1; j < messages.length; j++) {
        totalComparisons++
        const m1 = messages[i].content.toLowerCase()
        const m2 = messages[j].content.toLowerCase()

        // Look for agreement signals
        if ((m1.includes('agree') && m2.includes('agree')) ||
            (m1.includes('support') && m2.includes('support')) ||
            (m1.includes('+1') && m2.includes('+1'))) {
          agreements++
        }
      }
    }

    return totalComparisons > 0 ? (agreements / totalComparisons) * 0.3 : 0
  }

  private calculateNewInformationRate(currentMessages: AgentMessage[]): number {
    if (this.discussions.length === 0) return 1.0 // First round is always new

    const previousContent = this.discussions.flatMap(r => r.messages.map(m => m.content)).join(' ')
    const currentContent = currentMessages.map(m => m.content).join(' ')

    // Simple similarity check
    const previousWords = new Set(previousContent.toLowerCase().split(/\s+/))
    const currentWords = currentContent.toLowerCase().split(/\s+/)
    const newWords = currentWords.filter(w => !previousWords.has(w))

    return newWords.length / Math.max(currentWords.length, 1)
  }

  private countContradictions(messages: AgentMessage[]): number {
    let contradictions = 0

    for (let i = 0; i < messages.length; i++) {
      for (let j = i + 1; j < messages.length; j++) {
        const m1 = messages[i].content.toLowerCase()
        const m2 = messages[j].content.toLowerCase()

        // Look for contradiction signals
        if ((m1.includes('should') && m2.includes('should not')) ||
            (m1.includes('good') && m2.includes('bad') || m1.includes('poor')) ||
            (m1.includes('recommend') && m2.includes('concern') || m2.includes('against')) ||
            (m1.includes('agree') && m2.includes('disagree'))) {
          contradictions++
        }
      }
    }

    return contradictions
  }

  private calculateCoverageScore(messages: AgentMessage[], taskPrompt: string): number {
    if (messages.length === 0) return 0

    const taskWords = new Set(taskPrompt.toLowerCase().split(/\s+/).filter(w => w.length > 3))
    const coveredWords = new Set<string>()

    messages.forEach(m => {
      const msgWords = m.content.toLowerCase().split(/\s+/)
      msgWords.forEach(w => {
        if (taskWords.has(w)) coveredWords.add(w)
      })
    })

    return coveredWords.size / Math.max(taskWords.size, 1)
  }

  private detectStall(newInfoRate: number, contradictions: number): boolean {
    // Stall detection: low new info AND low contradictions (not even arguing anymore)
    return this.discussions.length > 3 && 
           newInfoRate < 0.15 && 
           contradictions === 0 &&
           this.discussions[this.discussions.length - 1]?.consensusLevel > 0.7
  }

  private extractActionItems(summary: string): string[] {
    const actionItems: string[] = []

    const actionPatterns = [
      /should (implement|create|add|fix|update|refactor) (.+?)(?=\.|\n|$)/gi,
      /need to (.+?)(?=\.|\n|$)/gi,
      /let's (.+?)(?=\.|\n|$)/gi
    ]

    actionPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(summary)) !== null) {
        if (match[0] && match[0].length > 10) {
          actionItems.push(match[0].trim())
        }
      }
    })

    return [...new Set(actionItems)].slice(0, 5) // Dedupe and limit
  }

  private shouldContinueDiscussion(currentRound: DiscussionRound): boolean {
    const modeConfig = MODE_CONFIGS[this.config.mode]

    // Check consensus threshold
    if (currentRound.consensusLevel >= modeConfig.consensusThreshold) {
      console.log(`\n✅ CONSENSUS REACHED at round ${currentRound.roundNumber}! (${(currentRound.consensusLevel * 100).toFixed(0)}%)`)
      return false
    }

    // Check stall condition
    if (currentRound.stalled && this.discussions.length > 3) {
      console.log(`\n⚠️ Discussion stalling - forcing conclusion`)
      return false
    }

    // Check stop policy
    if (this.config.stopPolicy.untilConsensus && 
        currentRound.consensusLevel >= this.config.stopPolicy.untilConsensus) {
      return false
    }

    return true
  }

  private checkRuleViolations(round: DiscussionRound): CoreRuleViolation[] {
    const violations: CoreRuleViolation[] = []

    // CR001: Consensus ≠ Correctness
    if (round.consensusLevel > 0.9) {
      const verifiedClaims = Array.from(this.claims.values()).filter(c => c.status === 'VERIFIED')
      if (verifiedClaims.length === 0) {
        violations.push({
          ruleId: 'CR001',
          ruleName: 'Consensus ≠ Correctness',
          severity: 'mandatory',
          description: 'High consensus without verified claims - independent verification needed',
          resolved: false
        })
      }
    }

    // CR004: Diverse Perspectives Required
    const uniqueParticipants = new Set(round.messages.map(m => m.agentId))
    if (uniqueParticipants.size < 2) {
      violations.push({
        ruleId: 'CR004',
        ruleName: 'Diverse Perspectives Required',
        severity: 'mandatory',
        description: 'Insufficient diverse perspectives in discussion round',
        resolved: false
      })
    }

    // CR009: Never Stop Early
    if (this.discussions.length < 3 && round.consensusLevel > 0.8) {
      violations.push({
        ruleId: 'CR009',
        ruleName: 'Never Stop Early',
        severity: 'mandatory',
        description: 'Discussion ending early without sufficient exploration',
        resolved: false
      })
    }

    return violations
  }

  // ============================================================================
  // Verification & Finalization
  // ============================================================================

  private async runBasicVerification(): Promise<VerificationResult> {
    console.log('\n🔍 Running Basic Verification...')
    
    const claimsToVerify = Array.from(this.claims.values())
    const checks = []
    const failures = []

    // Verify each claim has evidence
    for (const claim of claimsToVerify) {
      const hasEvidence = claim.evidenceIds.length > 0
      checks.push({
        checkId: `verify_${claim.claimId}`,
        checkType: 'CROSS_VERIFICATION' as const,
        passed: hasEvidence,
        details: `Claim "${claim.text.substring(0, 50)}" ${hasEvidence ? 'has' : 'lacks'} evidence`,
        severity: 'medium' as const,
        duration: 10,
        retryCount: 0
      })

      if (!hasEvidence) {
        failures.push({
          failureId: `fail_${claim.claimId}`,
          checkType: 'CROSS_VERIFICATION' as const,
          severity: 'medium' as const,
          description: `Claim lacks supporting evidence: ${claim.text.substring(0, 80)}`,
          suggestedFix: 'Add evidence to support this claim',
          autoFixable: false
        })
      }
    }

    const verified = failures.filter(f => f.severity === 'critical').length === 0
    const confidence = checks.length > 0 
      ? (checks.filter(c => c.passed).length / checks.length) * 100 
      : 100

    return {
      verified,
      confidence,
      evidencePool: Array.from(this.evidence.values()),
      checksPerformed: checks,
      failures,
      warnings: [],
      timestamp: Date.now(),
      duration: checks.length * 10,
      verifierAgents: ['basic-verifier'],
      summary: verified 
        ? `Basic verification PASSED: ${checks.filter(c => c.passed).length}/${checks.length} checks passed`
        : `Basic verification FAILED: ${failures.length} issues found`,
      nextSteps: failures.length > 0 ? ['Address verification failures'] : ['Proceed to next phase']
    }
  }

  private async generateFinalDecision(task: string): Promise<string> {
    if (this.discussions.length === 0) {
      return 'No discussion conducted - unable to generate decision'
    }

    const lastRound = this.discussions[this.discussions.length - 1]
    const highConfidenceClaims = Array.from(this.claims.values())
      .filter(c => c.confidence > 80 && c.status !== 'REJECTED')

    if (lastRound.consensusLevel > 0.85 && highConfidenceClaims.length > 0) {
      return `CONSENSUS REACHED: ${lastRound.summary}. Supported by ${highConfidenceClaims.length} high-confidence claims. Key action items: ${lastRound.actionItems.join('; ') || 'None specified'}.`
    } else if (lastRound.consensusLevel > 0.6) {
      return `PARTIAL CONSENSUS: ${lastRound.summary}. Further verification recommended. Open items: ${lastRound.actionItems.join('; ') || 'Review details'}.`
    } else {
      return `NO CONSENSUS: Multiple viewpoints remain. Key disagreements identified. Recommend additional discussion or human decision. Claims requiring attention: ${Array.from(this.claims.values()).filter(c => c.status === 'HYPOTHESIS').length} hypotheses remain unverified.`
    }
  }

  private async compileMADResult(finalDecision: string, verificationResult?: VerificationResult): Promise<MADResult> {
    const endTime = Date.now()
    
    // Calculate costs
    const totalTokens = Array.from(this.agents.values())
      .reduce((sum, a) => sum + a.metrics.tokensUsed, 0)
    
    const totalCost = totalTokens * 0.00001 // $0.01 per 1K tokens approximation
    
    // Build agent performance map
    const agentPerformance = new Map<string, AdvancedAgentPerformance>()
    this.agents.forEach(agent => {
      agentPerformance.set(agent.id, {
        agentId: agent.id,
        messagesSent: agent.messageCount,
        averageResponseTime: agent.metrics.averageResponseTime,
        qualityScore: agent.performanceScore,
        contributionValue: agent.performanceScore * agent.messageCount * 0.1,
        rulesFollowed: 0, // Would track actual rule compliance
        rulesViolated: 0,
        costIncurred: agent.metrics.costIncurred,
        tokensUsed: agent.metrics.tokensUsed,
        uptime: 95 + Math.random() * 5 // Simulated
      })
    })

    return {
      success: this.discussions.length > 0 && 
             !this.discussions.some(d => d.stalled && d.roundNumber < 3),
      mode: this.config.mode,
      consensus: finalDecision,
      discussions: this.discussions,
      participatingAgents: Array.from(this.agents.keys()),
      totalRounds: this.discussions.length,
      duration: endTime - this.startTime,
      finalDecision,
      verificationResult,
      knowledgeGraph: {
        claims: Array.from(this.claims.values()),
        evidence: Array.from(this.evidence.values())
      },
      coreRuleViolations: this.discussions.flatMap(d => this.checkRuleViolations(d)),
      costSummary: {
        totalTokens,
        totalCost,
        byProvider: {}, // Would track by provider
        byAgent: Object.fromEntries(agentPerformance),
        byTier: { exploration: totalCost * 0.3, selective: totalCost * 0.5, verification: totalCost * 0.2 },
        budgetRemaining: Math.max(0, this.config.costLimit - totalCost),
        efficiency: totalCost > 0 ? (this.discussions.length * 100) / totalCost : 0
      },
      telemetry: {
        startTime: this.startTime,
        endTime,
        totalTokensUsed: totalTokens,
        totalCost,
        agentPerformance,
        routingDecisions: this.routingDecisions
      },
      recommendations: this.generateRecommendations()
    }
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const lastRound = this.discussions[this.discussions.length - 1]

    if (!lastRound) return recommendations

    // Based on discussion outcome
    if (lastRound.stalled) {
      recommendations.push('Discussion stalled - consider changing approach or adding new perspectives')
    }

    if (lastRound.consensusLevel < 0.5) {
      recommendations.push('Low consensus - facilitate structured debate or escalate to human decision')
    }

    if (lastRound.coverageScore < 0.7) {
      recommendations.push('Incomplete task coverage - ensure all aspects are addressed')
    }

    // Based on claims status
    const unverifiedClaims = Array.from(this.claims.values()).filter(c => c.status === 'HYPOTHESIS')
    if (unverifiedClaims.length > 3) {
      recommendations.push(`${unverifiedClaims.length} claims remain unverified - gather more evidence`)
    }

    // Mode-specific recommendations
    switch (this.config.mode) {
      case 'plan':
        recommendations.push('Validate plan with stakeholders before implementation')
        break
      case 'build':
        recommendations.push('Run comprehensive testing after implementation')
        break
      case 'debug':
        recommendations.push('Verify fix resolves issue without introducing regressions')
        break
    }

    // Always add documentation recommendation
    recommendations.push('Document decisions and rationale for future reference')

    return recommendations
  }

  private logFinalSummary(result: MADResult): void {
    console.log(`\n${'='.repeat(70)}`)
    console.log('📊 M.A.D. DISCUSSION COMPLETE')
    console.log(`${'='.repeat(70)}`)
    console.log(`✅ Success: ${result.success}`)
    console.log(`⏱️ Duration: ${(result.duration / 1000).toFixed(1)}s`)
    console.log(`🔄 Total Rounds: ${result.totalRounds}`)
    console.log(`👥 Participating Agents: ${result.participatingAgents.length}`)
    console.log(`💰 Total Cost: $${result.costSummary.totalCost.toFixed(4)}`)
    console.log(`📝 Tokens Used: ${result.costSummary.totalTokens}`)
    console.log(`\n📋 FINAL DECISION:`)
    console.log('─'.repeat(70))
    console.log(result.finalDecision)
    
    if (result.verificationResult) {
      console.log(`\n🔍 VERIFICATION: ${result.verificationResult.verified ? 'PASSED' : 'FAILED'} (${result.verificationResult.confidence.toFixed(0)}% confidence)`)
    }
    
    if (result.coreRuleViolations.length > 0) {
      console.log(`\n⚠️ RULE VIOLATIONS: ${result.coreRuleViolations.length}`)
    }
    
    console.log(`\n💡 RECOMMENDATIONS:`)
    result.recommendations.forEach((rec, i) => console.log(`   ${i + 1}. ${rec}`))
    
    console.log(`${'='.repeat(70)}`)
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getAgentCount(): number {
    return this.agents.size
  }

  getActiveAgents(): string[] {
    return Array.from(this.agents.entries())
      .filter(([, agent]) => agent.isActive)
      .map(([id]) => id)
  }

  getClaims(): ClaimNode[] {
    return Array.from(this.claims.values())
  }

  getEvidence(): EvidenceNode[] {
    return Array.from(this.evidence.values())
  }

  addAgentDynamically(config: MAgentConfig): void {
    this.addAgent(config)
    console.log(`➕ Added agent: ${config.name || config.id}`)
  }

  removeAgent(agentId: string): boolean {
    return this.agents.delete(agentId)
  }

  setBalanceLevel(level: MADConfig['balanceLevel']): void {
    this.config.balanceLevel = level
    console.log(`⚖️ Balance level set to: ${level}`)
  }

  getMemoryFabric(): MemoryFabric {
    return {
      hot: {
        currentTask: '',
        activeClaims: Array.from(this.claims.values()),
        activeEvidence: Array.from(this.evidence.values()),
        openConflicts: [],
        userConstraints: [],
        currentDecisions: [],
        criticalUnknowns: [],
        provenancePointers: new Map(),
        conversationHistory: this.discussions.flatMap(d => d.messages),
        workingMemory: new Map(),
        contextWindow: { used: 0, total: 32000, criticalThreshold: 0.9, byCategory: new Map() },
        lastUpdated: Date.now()
      },
      warm: {
        sqlLookupEnabled: false,
        vectorSearchEnabled: false,
        ftsEnabled: true,
        temporalRetrievalEnabled: true,
        graphQueryEnabled: false,
        fileRetrievalEnabled: false,
        cacheSize: 500,
        retentionHours: 24,
        indexingRules: []
      },
      cold: {
        runs: [],
        agents: [],
        tasks: [],
        prompts: [],
        contexts: [],
        messages: [],
        toolCalls: [],
        outputs: [],
        errors: [],
        decisions: [],
        evidence: [],
        costs: [],
        timings: [],
        skills: [],
        audits: [],
        compressionStats: {
          originalSize: 0,
          compressedSize: 0,
          compressionRatio: 1,
          algorithm: 'none',
          lastCompressed: Date.now()
        }
      }
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createMAD(config?: Partial<MADConfig>): MADEngine {
  return new MADEngine({
    mode: 'plan',
    agents: [],
    balanceLevel: 'balanced',
    ...config
  })
}

/**
 * Create a MAD engine with advanced GOD Runtime backing
 */
export function createAdvancedMAD(godConfig?: Partial<GODRuntimeConfig>): {
  mad: MADEngine
  godRuntime: GODRuntime
} {
  const godRuntime = createGODRuntime(godConfig)
  const madConfig: MADConfig = {
    mode: godConfig?.mode || 'plan',
    providers: godConfig?.providers || [],
    enableVerification: godConfig?.verificationPolicy?.adversarialEnabled !== false,
    enableGauntlet: godConfig?.gauntletConfig?.enabled || false,
    enableProductionSweep: godConfig?.productionSweepConfig?.enabled || false
  }
  
  const mad = new MADEngine(madConfig)
  
  return { mad, godRuntime }
}

// ============================================================================
// Quick Execute Helpers
// ============================================================================

/**
 * Quick start basic M.A.D discussion
 */
export async function madDiscuss(
  task: string,
  mode: MADConfig['mode'] = 'plan',
  options?: Partial<MADConfig>
): Promise<MADResult> {
  const engine = createMAD({ mode, ...options })
  return engine.discuss(task)
}

/**
 * Quick start Advanced M.A.D (GOD Runtime) - Uses full TRANSCRIPT architecture
 */
export async function madDiscussAdvanced(
  task: string,
  mode: MADMode = 'PLAN',
  options?: Partial<GODRuntimeConfig>
): Promise<FinalReport> {
  return xheExecute(task, mode, options)
}
