/**
 * Xee Harness Enhanced (XHE) - M.A.D GOD Runtime
 * 
 * The central coordination runtime for Multi-Agent Deployment.
 * Implements the GOD (Global Orchestration Director) architecture from TRANSCRIPT.md.
 * 
 * Key Responsibilities:
 * - Task decomposition and distribution
 * - Model/Agent routing with adaptive selection
 * - Discussion coordination
 * - Verification orchestration
 * - Memory management
 * - Telemetry and audit
 * 
 * @origin-ai/xhe/mad/core
 */

import type {
  GODRuntimeConfig,
  TaskSpecification,
  TaskGraph,
  TaskNode,
  TaskEdge,
  ModelAssignment,
  ActiveAgent,
  AgentConfig,
  ClaimNode,
  EvidenceNode,
  VerificationStatus,
  FinalReport,
  MADResult,
  DiscussionRound,
  StopPolicy,
  ConvergenceMetrics,
  ProviderCredential,
  RoutingDecision,
  AgentPerformance,
  MADMode,
  SpawnPolicy,
  BudgetPolicy
} from './types'

import { XHE_IDENTITY } from './types'

// ============================================================================
// GOD Runtime Implementation
// ============================================================================

export class GODRuntime implements GodRuntime {
  private config: Required<GODRuntimeConfig>
  private state: GODState
  private agents: Map<string, ActiveAgent> = new Map()
  private taskGraph: TaskGraph | null = null
  private discussions: DiscussionRound[] = []
  private claims: Map<string, ClaimNode> = new Map()
  private evidence: Map<string, EvidenceNode> = new map()
  private startTime: number = 0
  private telemetry: MADTelemetry

  constructor(config: GODRuntimeConfig) {
    this.config = this.normalizeConfig(config)
    this.state = this.initializeState()
    this.telemetry = this.initializeTelemetry()
    
    this.logInitialization()
  }

  // ============================================================================
  // Core Lifecycle Methods (from TRANSCRIPT Section 2.1)
  // ============================================================================

  async initializeTask(taskSpec: TaskSpecification): Promise<void> {
    this.startTime = Date.now()
    
    console.log(`\n${'='.repeat(70)}`)
    console.log(`👑 ${XHE_IDENTITY.name} - GOD Runtime Initializing`)
    console.log(`📦 Package: ${XHE_IDENTITY.packageScope}`)
    console.log(`🔄 Fork of: ${XHE_IDENTITY.forkOf}`)
    console.log(`${'='.repeat(70)}\n`)
    
    console.log(`🎯 TASK: ${taskSpec.description}`)
    console.log(`📊 MODE: ${taskSpec.mode}`)
    console.log(`⚡ Priority: ${taskSpec.priority.toUpperCase()}`)
    
    // Store task in state
    this.state.currentTask = taskSpec
    
    // Initialize providers and agents
    await this.initializeProviders()
    await this.initializeAgents()
    
    // Run observation layer (TRANSCRIPT: Observation Layer)
    await this.runObservationLayer(taskSpec)
    
    console.log(`\n✅ Task initialized successfully`)
    console.log(`   Agents available: ${this.agents.size}`)
    console.log(`   Providers loaded: ${this.config.providers.length}`)
  }

  async decomposeTask(): Promise<TaskGraph> {
    if (!this.state.currentTask) {
      throw new Error('No task initialized. Call initializeTask first.')
    }

    console.log(`\n🔍 DECOMPOSING TASK...`)

    // Create initial task graph based on mode
    const nodes = this.generateTaskNodes(this.state.currentTask)
    const edges = this.generateTaskEdges(nodes)
    
    this.taskGraph = { nodes, edges }
    
    console.log(`   Generated ${nodes.length} subtasks`)
    console.log(`   Dependencies: ${edges.length}`)
    
    return this.taskGraph
  }

  async routeTask(taskId: string): Promise<ModelAssignment[]> {
    if (!this.taskGraph) {
      throw new Error('No task graph. Call decomposeTask first.')
    }

    const task = this.taskGraph.nodes.find(n => n.taskId === taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    console.log(`\n🛤️ ROUTING TASK: ${task.description}`)

    // Two-stage routing (from TRANSCRIPT Section 5)
    const eligibleAgents = this.eligibilityFilter(task)
    const assignments = this.selectionStage(task, eligibleAgents)
    
    // Log routing decision for telemetry
    const routingDecision: RoutingDecision = {
      taskId,
      selectedAgent: assignments[0]?.modelInstance?.id || 'none',
      selectionReason: 'Adaptive routing based on capability fit',
      score: assignments[0] ? this.calculateRoutingScore(assignments[0].modelInstance, task) : 0,
      alternatives: assignments.slice(1).map(a => a.modelInstance.id)
    }
    
    this.telemetry.routingDecisions.push(routingDecision)
    
    return assignments
  }

  recordClaim(claim: ClaimNode): void {
    this.claims.set(claim.claimId, claim)
    console.log(`📝 Claim recorded: ${claim.claimId.substring(0, 8)}... [${claim.status}]`)
  }

  checkProgress(): VerificationStatus {
    if (!this.state.currentTask) return 'CANCELLED'
    
    const convergence = this.calculateConvergenceMetrics()
    
    // Check stop conditions (from TRANSCRIPT: Stop Policy)
    if (convergence.decisionStability > 0.9 && convergence.evidenceSufficiency > 0.8) {
      return 'VERIFICATION_COMPLETE'
    }
    
    if (this.discussions.length >= (this.config.discussionPolicy.turnLimit || 10)) {
      return 'EVIDENCE_GATHERING'
    }
    
    if (Date.now() - this.startTime > (this.config.budgetPolicy.timeBudget || 300000)) {
      return 'FAILED'
    }
    
    return 'IN_PROGRESS'
  }

  cancelRun(reason: string): void {
    console.log(`\n❌ RUN CANCELLED: ${reason}`)
    this.state.status = 'CANCELLED'
  }

  finalize(): FinalReport {
    const endTime = Date.now()
    
    const result: MADResult = {
      success: this.state.status !== 'FAILED' && this.state.status !== 'CANCELLED',
      mode: this.state.currentTask?.mode || 'PLAN',
      discussions: this.discussions,
      participatingAgents: Array.from(this.agents.keys()),
      totalRounds: this.discussions.length,
      duration: endTime - this.startTime,
      finalDecision: this.generateFinalDecision(),
      knowledgeGraph: {
        claims: Array.from(this.claims.values()),
        evidence: Array.from(this.evidence.values()),
        edges: [] // Would be populated from knowledge extraction
      },
      telemetry: this.telemetry
    }
    
    return {
      runId: this.state.runId,
      task: this.state.currentTask!,
      result,
      recommendations: this.generateRecommendations(),
      lessonsLearned: this.extractLessons(),
      nextSteps: this.generateNextSteps()
    }
  }

  // ============================================================================
  // Provider & Agent Initialization (from TRANSCRIPT Section 1)
  // ============================================================================

  private async initializeProviders(): Promise<void> {
    console.log('\n🏢 INITIALIZING PROVIDERS...')
    
    for (const provider of this.config.providers) {
      console.log(`   ${provider.provider}: ${provider.models.length} models`)
      
      // In production, would validate API keys, check rate limits, etc.
      for (const model of provider.models) {
        console.log(`     └─ ${model.name} (${model.contextWindow} ctx)`)
      }
    }
  }

  private async initializeAgents(): Promise<void> {
    console.log('\n🤖 INITIALIZING AGENT MESH...')
    
    // Create agent instances from provider configs
    for (const provider of this.config.providers) {
      for (const model of provider.models) {
        // Can create multiple instances per model (from TRANSCRIPT: Same-model instances)
        const instanceCount = this.getInstanceCountForModel(model)
        
        for (let i = 0; i < instanceCount; i++) {
          const agentConfig: AgentConfig = {
            id: `${model.id}-${i}`,
            name: `${model.name}-${String.fromCharCode(65 + i)}`,
            provider: provider.provider,
            model: model.id,
            role: this.determineRoleForModel(model),
            specialization: model.capabilities,
            apiKeyRef: provider.key
          }
          
          const activeAgent: ActiveAgent = {
            ...agentConfig,
            instanceId: `${agentConfig.id}-${Date.now()}`,
            messageCount: 0,
            lastResponse: '',
            isActive: true,
            performanceScore: 1.0
          }
          
          this.agents.set(activeAgent.id, activeAgent)
        }
      }
    }
    
    console.log(`   Total agents created: ${this.agents.size}`)
  }

  // ============================================================================
  // Observation Layer (from TRANSCRIPT: Observation Layer)
  // ============================================================================

  private async runObservationLayer(task: TaskSpecification): Promise<void> {
    console.log('\n👁️ RUNNING OBSERVATION LAYER...')
    
    // Check for anomalies, contradictions, missing info (from TRANSCRIPT)
    const observations = [
      this.checkForAnomalies(task),
      this.checkContradictions(task),
      this.identifyMissingInfo(task),
      this.checkEdgeCases(task),
      this.validatePremises(task)
    ]
    
    // Store anomalies in memory fabric
    this.state.anomalies = observations.filter(o => o !== null) as string[]
    
    if (this.state.anomalies.length > 0) {
      console.log(`   ⚠️ Anomalies detected: ${this.state.anomalies.length}`)
      this.state.anomalies.forEach(a => console.log(`      - ${a}`))
    } else {
      console.log('   ✅ No anomalies detected')
    }
  }

  private checkForAnomalies(task: TaskSpecification): string | null {
    // Implementation would analyze task for unusual patterns
    return null
  }

  private checkContradictions(task: TaskSpecification): string | null {
    // Implementation would check requirements for conflicts
    return null
  }

  private identifyMissingInfo(task: TaskSpecification): string | null {
    // Implementation would identify gaps in specifications
    return null
  }

  private checkEdgeCases(task: TaskSpecification): string | null {
    // Implementation would identify edge cases
    return null
  }

  private validatePremises(task: TaskSpecification): string | null {
    // Implementation would validate user assumptions
    return null
  }

  // ============================================================================
  // Task Decomposition (from TRANSCRIPT: Decomposition)
  // ============================================================================

  private generateTaskNodes(task: TaskSpecification): TaskNode[] {
    const baseTasks = this.getBaseTasksForMode(task.mode)
    
    return baseTasks.map((desc, index) => ({
      taskId: `task-${index + 1}`,
      description: desc,
      status: 'pending' as const,
      dependencies: [],
      assignedAgent: undefined
    }))
  }

  private generateTaskEdges(nodes: TaskNode[]): TaskEdge[] {
    const edges: TaskEdge[] = []
    
    // Create dependency chains based on mode
    for (let i = 1; i < nodes.length; i++) {
      edges.push({
        from: nodes[i - 1].taskId,
        to: nodes[i].taskId,
        type: 'depends_on'
      })
    }
    
    return edges
  }

  private getBaseTasksForMode(mode: MADMode): string[] {
    switch (mode) {
      case 'PLAN':
        return [
          'Discover requirements and constraints',
          'Perform independent analysis',
          'Conduct architecture discussion',
          'Complete risk analysis',
          'Make final plan decisions',
          'Generate output plan document'
        ]
      case 'BUILD':
        return [
          'Assign tasks to specialized agents',
          'Execute parallel build operations',
          'Run micro-verification loops',
          'Perform code reviews',
          'Integrate components',
          'Run regression tests'
        ]
      case 'DEBUG':
        return [
          'Reproduce the issue',
          'Generate independent hypotheses',
          'Conduct debugging discussion',
          'Run diagnostic experiments',
          'Identify root cause',
          'Implement fix',
          'Verify fix with regression'
        ]
      default:
        return ['Execute task']
    }
  }

  // ============================================================================
  // Adaptive Routing (from TRANSCRIPT Section 5)
  // ============================================================================

  private eligibilityFilter(task: TaskNode): ActiveAgent[] {
    const eligible: ActiveAgent[] = []
    
    for (const [, agent] of this.agents) {
      if (!agent.isActive) continue
      
      // Check eligibility criteria (from TRANSCRIPT: Stage 1 - Eligibility)
      const checks = [
        this.checkCapabilityFit(agent, task),
        this.checkContextCompatibility(agent, task),
        this.checkRateLimits(agent),
        this.checkPermissions(agent, task),
        this.checkAvailability(agent)
      ]
      
      if (checks.every(check => check)) {
        eligible.push(agent)
      }
    }
    
    return eligible
  }

  private selectionStage(task: TaskNode, eligible: ActiveAgent[]): ModelAssignment[] {
    if (eligible.length === 0) {
      console.warn('⚠️ No eligible agents found for task')
      return []
    }
    
    // Score and rank agents (from TRANSCRIPT: Stage 2 - Selection)
    const scored = eligible.map(agent => ({
      agent,
      score: this.calculateRoutingScore(agent, task)
    }))
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score)
    
    // Select top candidates based on parallelism policy
    const selectCount = Math.min(
      this.config.spawnPolicy.maxParallel,
      scored.length
    )
    
    const selected = scored.slice(0, selectCount)
    
    return selected.map(s => ({
      modelInstance: s.agent,
      role: s.agent.role,
      taskId: task.taskId
    }))
  }

  private calculateRoutingScore(agent: ActiveAgent, task: TaskNode): number {
    // From TRANSCRIPT: Selection Score Formula
    const factors = {
      capabilityFit: this.getCapabilityFitScore(agent, task),       // How well can this agent do the task?
      historicalSuccess: agent.performanceScore,                   // Past performance on similar tasks
      diversityBenefit: this.getDiversityScore(agent),             // Adds unique perspective?
      evidenceQuality: this.getEvidenceQualityScore(agent),         // Quality of past contributions
      latency: this.getLatencyScore(agent),                        // Response time
      cost: this.getCostScore(agent),                              // Cost efficiency
      correlationRisk: this.getCorrelationRiskScore(agent)         // Risk of correlated failure
    }
    
    // Weighted combination (from TRANSCRIPT formula)
    const score = (
      factors.capabilityFit * 0.25 +
      factors.historicalSuccess * 0.20 +
      factors.diversityBenefit * 0.15 +
      factors.evidenceQuality * 0.15 +
      (100 - factors.latency) * 0.10 +
      (100 - factors.cost) * 0.10 +
      (100 - factors.correlationRisk) * 0.05
    )
    
    return Math.max(0, Math.min(100, score))
  }

  // ============================================================================
  // Discussion Management (from TRANSCRIPT Section 5)
  // ============================================================================

  async conductDiscussion(task: string, stopPolicy?: StopPromise): Promise<DiscussionRound[]> {
    console.log('\n🗣️ STARTING MULTI-AGENT DISCUSSION')
    
    const policy = stopPolicy || this.config.discussionPolicy
    let round = 0
    let discussionActive = true
    
    while (discussionActive) {
      round++
      console.log(`\n${'─'.repeat(50)}`)
      console.log(`📢 ROUND ${round}`)
      console.log(`${'─'.repeat(50)}`)
      
      const roundResult = await this.conductRound(round, task)
      this.discussions.push(roundResult)
      
      // Check convergence metrics (from TRANSCRIPT: Context-Ready Threshold)
      const convergence = this.calculateConvergenceMetrics()
      
      console.log(`\n📊 Round ${round} Metrics:`)
      console.log(`   Consensus Level: ${(roundResult.consensusLevel * 100).toFixed(1)}%`)
      console.log(`   New Info Rate: ${(convergence.stability * 100).toFixed(1)}%`)
      console.log(`   Coverage: ${(convergence.modelCoverage * 100).toFixed(1)}%`)
      
      // Check stop conditions
      discussionActive = !this.shouldStopDiscussion(round, roundResult, convergence, policy)
      
      // Check timeout
      if (Date.now() - this.startTime > (policy.timeLimit || this.config.budgetPolicy.timeBudget || 300000)) {
        console.log('⏰ Discussion timeout reached')
        break
      }
    }
    
    console.log(`\n✅ DISCUSSION COMPLETE after ${round} rounds`)
    return this.discussions
  }

  private async conductRound(roundNumber: number, task: string): Promise<DiscussionRound> {
    const messages = []
    
    // Each agent contributes (from TRANSCRIPT: Independent Reasoning)
    for (const [agentId, agent] of this.agents) {
      if (!agent.isActive) continue
      
      try {
        const message = await this.getAgentContribution(agent, task, roundNumber)
        messages.push(message)
        
        agent.messageCount++
        agent.lastResponse = message.content
        
        console.log(`\n💬 ${agent.name}:`)
        console.log(`   ${this.truncate(message.content, 150)}...`)
        
      } catch (error) {
        console.error(`❌ Error from ${agent.name}:`, error)
        agent.isActive = false
      }
    }
    
    // Generate summary and check consensus
    const summary = await this.generateRoundSummary(messages)
    const consensusLevel = this.calculateConsensusLevel(messages)
    
    return {
      roundId: `round-${roundNumber}`,
      roundNumber,
      messages,
      summary,
      consensusLevel,
      newInformationRate: this.calculateNewInformationRate(messages),
      contradictionsFound: this.countContradictions(messages),
      coverageScore: this.calculateCoverageScore(messages)
    }
  }

  private shouldStopDiscussion(
    round: number,
    roundResult: DiscussionRound,
    convergence: ConvergenceMetrics,
    policy: StopPolicy
  ): boolean {
    // From TRANSCRIPT: Stop Policy conditions
    
    // 1. Context clear?
    if (policy.untilContextClear && convergence.decisionStability > 0.9) {
      console.log('✅ Context is clear - stopping discussion')
      return true
    }
    
    // 2. Decision ready?
    if (policy.untilDecisionReady && roundResult.consensusLevel > 0.8) {
      console.log('✅ Decision reached - stopping discussion')
      return true
    }
    
    // 3. Turn limit?
    if (policy.turnLimit && round >= policy.turnLimit) {
      console.log(`📋 Turn limit reached (${policy.turnLimit})`)
      return true
    }
    
    // 4. Marginal collapse (no new information)?
    if (convergence.stability < 0.05 && round > 3) {
      console.log('📉 Marginal collapse - no new information')
      return true
    }
    
    return false
  }

  // ============================================================================
  // Convergence Metrics (from TRANSCRIPT Section 4)
  // ============================================================================

  private calculateConvergenceMetrics(): ConvergenceMetrics {
    if (this.discussions.length === 0) {
      return {
        modelCoverage: 0,
        evidenceSufficiency: 0,
        stability: 0,
        decisionStability: 0
      }
    }
    
    const latestRound = this.discussions[this.discussions.length - 1]
    const previousRound = this.discussions.length > 1 
      ? this.discussions[this.discussions.length - 2] 
      : null
    
    return {
      modelCoverage: latestRound.coverageScore,
      evidenceSufficiency: latestRound.consensusLevel,
      stability: previousRound 
        ? Math.abs(latestRound.consensusLevel - previousRound.consensusLevel)
        : 1.0,
      decisionStability: latestRound.consensusLevel
    }
  }

  private calculateConsensusLevel(messages: AgentMessage[]): number {
    if (messages.length < 2) return messages.length > 0 ? 0.5 : 0
    
    // Simplified consensus calculation (would use semantic similarity in production)
    const agreementCount = messages.filter(m => m.type === 'consensus').length
    const totalActiveMessages = messages.filter(m => m.type !== 'error').length
    
    return totalActiveMessages > 0 ? agreementCount / totalActiveMessages : 0
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private normalizeConfig(config: GODRuntimeConfig): Required<GODRuntimeConfig> {
    return {
      mode: config.mode || 'PLAN',
      providers: config.providers || [],
      discussionPolicy: {
        manualStopAllowed: true,
        ...config.discussionPolicy
      },
      verificationPolicy: {
        level: 'STRICT',
        adversarialEnabled: true,
        formalVerification: false,
        humanApprovalRequired: false,
        proofGateThreshold: 0.8,
        ...config.verificationPolicy
      },
      budgetPolicy: {
        concurrencyBudget: 8,
        ...config.budgetPolicy
      },
      spawnPolicy: {
        maxAgents: 20,
        maxTreeDepth: 3,
        maxChildrenPerAgent: 4,
        maxParallel: 8,
        cancellationEnabled: true,
        ...config.spawnPolicy
      },
      skillPolicy: {
        globalRegistry: true,
        githubDiscovery: false,
        lazyLoading: true,
        maxActiveSkills: 10,
        trustRemoteSkills: false,
        ...config.skillPolicy
      },
      toolPolicy: {
        filesystemAccess: true,
        terminalAccess: true,
        networkAccess: true,
        dangerousSystemCalls: false,
        sandboxEnabled: true,
        ...config.toolPolicy
      }
    }
  }

  private initializeState(): GODState {
    return {
      runId: `run-${Date.now()}`,
      status: 'INITIALIZED',
      currentTask: null,
      anomalies: [],
      globalContext: new Map()
    }
  }

  private initializeTelemetry(): MADTelemetry {
    return {
      startTime: 0,
      endTime: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      agentPerformance: new Map(),
      routingDecisions: []
    }
  }

  private logInitialization(): void {
    console.log('\n╔══════════════════════════════════════════════════════════╗')
    console.log('║                                                          ║')
    console.log('║   👑  XEE HARNESS ENHANCED (XHE) - GOD RUNTIME           ║')
    console.log('║   Multi-Agent Deployment System                         ║')
    console.log('║                                                          ║')
    console.log('╚════════════════════════════════════════════════════════╝')
  }

  private getInstanceCountForModel(model: any): number {
    // From TRANSCRIPT: Same model can have multiple independent instances
    return Math.min(3, this.config.spawnPolicy.maxAgents / this.config.providers.length)
  }

  private determineRoleForModel(model: any): AgentRole {
    // Assign roles based on model capabilities
    if (model.capabilities.includes('code-generation')) return 'builder'
    if (model.capabilities.includes('debugging')) return 'debugger'
    if (model.capabilities.includes('security')) return 'security'
    if (model.capabilities.includes('analysis')) return 'critic'
    return 'builder' // default
  }

  // Placeholder implementations for scoring methods
  private getCapabilityFitScore(agent: ActiveAgent, task: TaskNode): number { return 80 + Math.random() * 20 }
  private getDiversityScore(agent: ActiveAgent): number { return 70 + Math.random() * 30 }
  private getEvidenceQualityScore(agent: ActiveAgent): number { return 75 + Math.random() * 25 }
  private getLatencyScore(agent: ActiveAgent): number { return 50 + Math.random() * 50 }
  private getCostScore(agent: ActiveAgent): number { return 60 + Math.random() * 40 }
  private getCorrelationRiskScore(agent: ActiveAgent): number { return 30 + Math.random() * 40 }
  
  private checkCapabilityFit(agent: ActiveAgent, task: TaskNode): boolean { return true }
  private checkContextCompatibility(agent: ActiveAgent, task: TaskNode): boolean { return true }
  private checkRateLimits(agent: ActiveAgent): boolean { return true }
  private checkPermissions(agent: ActiveAgent, task: TaskNode): boolean { return true }
  private checkAvailability(agent: ActiveAgent): boolean { return agent.isActive }
  
  private async getAgentContribution(agent: ActiveAgent, task: string, round: number): Promise<any> {
    // Simulated - would call actual LLM API
    return {
      messageId: `msg-${Date.now()}`,
      agentId: agent.id,
      content: `[${agent.role}] Analysis of task from ${agent.name}'s perspective`,
      timestamp: Date.now(),
      round,
      type: round === 1 ? 'opinion' : 'critique',
      confidence: 70 + Math.random() * 30
    }
  }
  
  private async generateRoundSummary(messages: any[]): Promise<string> {
    return `Summary of ${messages.length} agent contributions`
  }
  
  private calculateNewInformationRate(messages: any[]): number { return 0.7 + Math.random() * 0.3 }
  private countContradictions(messages: any[]): number { return Math.floor(Math.random() * 3) }
  private calculateCoverageScore(messages: any[]): number { return 0.8 + Math.random() * 0.2 }
  
  private generateFinalDecision(): string {
    return `Final decision based on ${this.discussions.length} rounds of multi-agent discussion`
  }
  
  private generateRecommendations(): string[] { return ['Recommendation 1', 'Recommendation 2'] }
  private extractLessons(): string[] { return ['Lesson 1', 'Lesson 2'] }
  private generateNextSteps(): string[] { return ['Next step 1', 'Next step 2'] }
  
  private truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }
}

// ============================================================================
// Internal State Interface
// ============================================================================

interface GODState {
  runId: string
  status: 'INITIALIZED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  currentTask: TaskSpecification | null
  anomalies: string[]
  globalContext: Map<string, any>
}

interface MADTelemetry {
  startTime: number
  endTime: number
  totalTokensUsed: number
  totalCost: number
  agentPerformance: Map<string, AgentPerformance>
  routingDecisions: RoutingDecision[]
}

interface StopPromise extends StopPolicy {}

// ============================================================================
// Export
// ============================================================================

export { GODRuntime as default }
