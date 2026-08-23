/**
 * Xee Harness Enhanced (XHE) - M.A.D (Multi-Agent Deployment) System
 * 
 * Core type definitions for the Multi-Agent Deployment architecture.
 * This implements the GOD Runtime specification from TRANSCRIPT.md.
 * 
 * @origin-ai/xhe/mad
 * @version 1.0.0
 */

// ============================================================================
// Core Identity Types
// ============================================================================

export interface XHEIdentity {
  /** Primary project name */
  name: 'Xee Harness Enhanced' | 'XHE'
  /** Alternative names / aliases */
  aliases: ('XeeCode' | 'XCode' | 'Xee Harness Enhanced')[]
  /** Package scope */
  packageScope: '@origin-ai/xhe'
  /** Fork origin */
  forkOf: 'DSH/SeepSeek Harness'
}

export const XHE_IDENTITY: XHEIdentity = {
  name: 'Xee Harness Enhanced',
  aliases: ['XeeCode', 'XCode', 'Xee Harness Enhanced'],
  packageScope: '@origin-ai/xhe',
  forkOf: 'DSH/SeepSeek Harness'
}

// ============================================================================
// Provider & Model Types (from TRANSCRIPT Section 1)
// ============================================================================

export interface ProviderCredential {
  id: string
  key: string
  provider: string
  models: ModelConfig[]
  rateLimits?: RateLimit
}

export interface ModelConfig {
  id: string
  name: string
  contextWindow: number // tokens
  maxOutput: number // tokens
  cost?: CostStructure
  capabilities: ModelCapability[]
}

export interface RateLimit {
  concurrent: number
  rpm?: number // requests per minute
  tpm?: number // tokens per minute
}

export interface CostStructure {
  inputPer1K: number
  outputPer1K: number
  cacheHitPer1K?: number
}

export type ModelCapability = 
  | 'code-generation'
  | 'debugging'
  | 'analysis'
  | 'vision'
  | 'math'
  | 'reasoning'
  | 'creative'
  | 'security'

// ============================================================================
// Agent Types (from TRANSCRIPT Section 4-5)
// ============================================================================

export interface AgentConfig {
  id: string
  name: string
  provider: string
  model: string
  role: AgentRole
  specialization: string[]
  apiKeyRef: string
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

export interface ActiveAgent extends AgentConfig {
  instanceId: string
  messageCount: number
  lastResponse: string
  isActive: boolean
  performanceScore: number
  subAgents?: ActiveAgent[]
}

// ============================================================================
// Discussion Bus Types (from TRANSCRIPT Section 5)
// ============================================================================

export interface AgentMessage {
  messageId: string
  agentId: string
  content: string
  timestamp: number
  round: number
  type: MessageType
  confidence?: number // 0-100
  evidenceRefs?: string[] // SHA-256 hashes of evidence
}

export type MessageType = 
  | 'opinion'
  | 'critique'
  | 'question'
  | 'consensus'
  | 'fact'
  | 'claim'
  | 'challenge'
  | 'evidence'

export interface DiscussionRound {
  roundId: string
  roundNumber: number
  messages: AgentMessage[]
  summary: string
  consensusLevel: number // 0-1
  newInformationRate: number
  contradictionsFound: number
  coverageScore: number
}

export interface DiscussionBusState {
  isActive: boolean
  currentRound: number
  totalMessages: number
  stopPolicy: StopPolicy
  convergenceMetrics: ConvergenceMetrics
}

export interface StopPolicy {
  maxTurns?: number
  maxTimeMs?: number
  untilContextClear?: boolean
  manualStop?: boolean
}

export interface ConvergenceMetrics {
  modelCoverage: number // fraction of models participated
  evidenceSufficiency: number // verified supports / total claims
  stability: number // change rate between rounds
  decisionStability: number // how stable are decisions
}

// ============================================================================
// Knowledge Graph Types (from TRANSCRIPT Section 4)
// ============================================================================

export interface ClaimNode {
  claimId: string
  text: string
  originModel: string
  confidence: number
  status: ClaimStatus
  timestamp: number
  evidenceIds: string[]
  challengeIds: string[]
}

export type ClaimStatus = 
  | 'HYPOTHESIS'
  | 'PLAUSIBLE'
  | 'VERIFIED'
  | 'CONTRADICTED'
  | 'REJECTED'
  | 'PENDING'

export interface EvidenceNode {
  evidenceId: string
  type: EvidenceType
  content: string
  sourceModel: string
  sourceType: 'agent' | 'external' | 'tool'
  verifiedBy: string[]
  timestamp: number
  hash: string // SHA-256
}

export type EvidenceType = 
  | 'CODE'
  | 'LOG'
  | 'TEST_RESULT'
  | 'BENCHMARK'
  | 'EXTERNAL_REF'
  | 'TOOL_OUTPUT'
  | 'MATHEMATICAL_PROOF'

export interface KnowledgeEdge {
  from: string // claim or evidence ID
  to: string // claim or evidence ID
  relation: EdgeRelation
  timestamp: number
}

export type EdgeRelation = 
  | 'supports'
  | 'contradicts'
  | 'derived_from'
  | 'challenges'
  | 'verified_by'

// ============================================================================
// Memory Fabric Types (from TRANSCRIPT Section 6)
// ============================================================================

export interface MemoryFabric {
  hot: HotContext
  warm: WarmMemory
  cold: ColdArchive
}

export interface HotContext {
  currentTask: string
  activeClaims: ClaimNode[]
  activeEvidence: EvidenceNode[]
  openConflicts: string[]
  userConstraints: string[]
  currentDecisions: string[]
  criticalUnknowns: string[]
  provenancePointers: Map<string, string>
}

export interface WarmMemory {
  sqlLookupEnabled: boolean
  vectorSearchEnabled: boolean
  ftsEnabled: boolean
  temporalRetrievalEnabled: boolean
  graphQueryEnabled: boolean
  fileRetrievalEnabled: boolean
}

export interface ColdArchive {
  runs: TelemetryRun[]
  agents: TelemetryAgent[]
  tasks: TelemetryTask[]
  prompts: TelemetryPrompt[]
  contexts: TelemetryContext[]
  messages: TelemetryMessage[]
  toolCalls: TelemetryToolCall[]
  outputs: TelemetryOutput[]
  errors: TelemetryError[]
  decisions: TelemetryDecision[]
  evidence: TelemetryEvidence[]
  costs: TelemetryCost[]
  timings: TelemetryTiming[]
  skills: TelemetrySkill[]
  audits: TelemetryAudit[]
}

// ============================================================================
// Verification Types (from TRANSCRIPT Section 10)
// ============================================================================

export interface VerificationConfig {
  level: VerificationLevel
  adversarialEnabled: boolean
  formalVerification: boolean
  humanApprovalRequired: boolean
  proofGateThreshold: number
}

export type VerificationLevel = 
  | 'NORMAL'
  | 'STRICT'
  | 'ADVERSARIAL'
  | 'FORMAL_MATHEMATICAL'

export interface VerificationResult {
  verified: boolean
  confidence: number
  evidencePool: EvidenceNode[]
  checksPerformed: VerificationCheck[]
  failures: VerificationFailure[]
  timestamp: number
}

export interface VerificationCheck {
  checkType: VerificationCheckType
  passed: boolean
  details: string
  evidenceRef?: string
}

export type VerificationCheckType = 
  | 'REPRODUCE'
  | 'UNIT_TEST'
  | 'STATIC_ANALYSIS'
  | 'RUNTIME_CHECK'
  | 'BENCHMARK'
  | 'SECURITY_CHECK'
  | 'FORMAL_PROOF'
  | 'HUMAN_APPROVAL'
  | 'CROSS_VERIFICATION'

export interface VerificationFailure {
  checkType: VerificationCheckType
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  suggestedFix?: string
}

// ============================================================================
// Gauntlet Loop Types (from TRANSCRIPT Section 10.2)
// ============================================================================

export interface GauntletConfig {
  enabled: boolean
  barSource: BarSource
  freezeHash: string
  maxRounds: number
  budget?: GauntletBudget
  stopConditions: GauntletStopConditions
}

export interface BarSource {
  type: 'url' | 'repo' | 'file' | 'test_suite'
  location: string
  description: string
  acquiredAt: number
  frozenAt?: number
  sha256?: string
}

export interface GauntletBudget {
  rounds?: number
  timeMs?: number
  tokens?: number
  cost?: number
}

export interface GauntletStopConditions {
  artifactWins: boolean
  marginalCollapseRounds: number
  budgetExhausted: boolean
  userOverride: boolean
}

export interface GauntletResult {
  passed: boolean
  roundsCompleted: number
  finalVerdict: 'BAR_WINS' | 'ARTIFACT_WINS' | 'TIE' | 'ABORTED'
  roundLog: GauntletRound[]
  gapsIdentified: string[]
  regressionPassed: boolean
}

export interface GauntletRound {
  roundNumber: number
  builderOutput: string
  criticVerdict: 'bar' | 'artifact' | 'tie'
  biggestGap?: string
  improvementNoted: boolean
}

// ============================================================================
// Production Sweep Types (from TRANSCRIPT Section 11)
// ============================================================================

export interface ProductionSweepConfig {
  enabled: boolean
  agents: ProductionAgentConfig[]
  severityThreshold: 'blocking' | 'critical' | 'all'
  autoRemediate: boolean
  maxSweeps: number
}

export interface ProductionAgentConfig {
  id: string
  role: 'quality_qa' | 'code_linter' | 'adversarial' | 'ux_review'
  focusAreas: string[]
}

export interface ProductionFinding {
  findingId: string
  agentId: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  description: string
  location?: string
  suggestedFix?: string
  dependencies?: string[]
}

export interface ProductionGateResult {
  status: 'READY' | 'READY_WITH_RISKS' | 'NOT_READY'
  criticalBlockers: number
  highBlockers: number
  testStatus: 'PASS' | 'FAIL'
  securityStatus: 'PASS' | 'FAIL'
  performanceStatus: 'PASS' | 'FAIL' | 'PENDING'
  buildStatus: 'PASS' | 'FAIL'
  observabilityStatus: 'PASS' | 'FAIL' | 'PENDING'
  knownRisksReviewed: boolean
  importantClaimsVerified: boolean
  findings: ProductionFinding[]
  remediationTasks: RemediationTask[]
}

export interface RemediationTask {
  taskId: string
  description: string
  priority: number
  assignedTo?: string
  dependencies: string[]
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
}

// ============================================================================
// GOD Runtime Types (from TRANSCRIPT Section 2)
// ============================================================================

export interface GODRuntimeConfig {
  mode: MADMode
  providers: ProviderCredential[]
  discussionPolicy: DiscussionPolicy
  verificationPolicy: VerificationConfig
  budgetPolicy: BudgetPolicy
  spawnPolicy: SpawnPolicy
  skillPolicy: SkillPolicy
  toolPolicy: ToolSecurityPolicy
}

export type MADMode = 'PLAN' | 'BUILD' | 'DEBUG'

export interface DiscussionPolicy {
  timeLimit?: number
  turnLimit?: number
  untilContextClear?: boolean
  untilDecisionReady?: boolean
  manualStopAllowed: boolean
}

export interface BudgetPolicy {
  tokenBudget?: number
  timeBudget?: number // ms
  costBudget?: number
  concurrencyBudget?: number
}

export interface SpawnPolicy {
  maxAgents: number
  maxTreeDepth: number
  maxChildrenPerAgent: number
  maxParallel: number
  cancellationEnabled: boolean
}

export interface SkillPolicy {
  globalRegistry: boolean
  githubDiscovery: boolean
  lazyLoading: boolean
  maxActiveSkills: number
  trustRemoteSkills: boolean
}

export interface ToolSecurityPolicy {
  filesystemAccess: boolean
  terminalAccess: boolean
  networkAccess: boolean
  dangerousSystemCalls: boolean
  sandboxEnabled: boolean
}

// ============================================================================
// Result Types
// ============================================================================

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
    edges: KnowledgeEdge[]
  }
  telemetry: MADTelemetry
}

export interface MADTelemetry {
  startTime: number
  endTime: number
  totalTokensUsed: number
  totalCost: number
  agentPerformance: Map<string, AgentPerformance>
  routingDecisions: RoutingDecision[]
}

export interface AgentPerformance {
  agentId: string
  messagesSent: number
  averageResponseTime: number
  qualityScore: number
  contributionValue: number
}

export interface RoutingDecision {
  taskId: string
  selectedAgent: string
  selectionReason: string
  score: number
  alternatives: string[]
}

// ============================================================================
// API Interface Types (from TRANSCRIPT Section 15)
// ============================================================================

export interface GodRuntime {
  initializeTask(taskSpec: TaskSpecification): Promise<void>
  decomposeTask(): Promise<TaskGraph>
  routeTask(taskId: string): Promise<ModelAssignment[]>
  recordClaim(claim: ClaimNode): void
  checkProgress(): VerificationStatus
  cancelRun(reason: string): void
  finalize(): FinalReport
}

export interface TaskSpecification {
  id: string
  description: string
  mode: MADMode
  requirements: string[]
  constraints: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  budget?: BudgetPolicy
  barSource?: BarSource
}

export interface TaskGraph {
  nodes: TaskNode[]
  edges: TaskEdge[]
}

export interface TaskNode {
  taskId: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'failed'
  dependencies: string[]
  assignedAgent?: string
}

export interface TaskEdge {
  from: string
  to: string
  type: 'depends_on' | 'blocks' | 'enables'
}

export interface ModelAssignment {
  modelInstance: ActiveAgent
  role: string
  taskId: string
}

export type VerificationStatus = 
  | 'IN_PROGRESS'
  | 'EVIDENCE_GATHERING'
  | 'DISCUSSION_ACTIVE'
  | 'VERIFICATION_COMPLETE'
  | 'READY_FOR_EXECUTION'
  | 'CANCELLED'
  | 'FAILED'

export interface FinalReport {
  runId: string
  task: TaskSpecification
  result: MADResult
  recommendations: string[]
  lessonsLearned: string[]
  nextSteps: string[]
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  XHEIdentity,
  ProviderCredential,
  ModelConfig,
  RateLimit,
  CostStructure,
  AgentConfig,
  ActiveAgent,
  AgentMessage,
  DiscussionRound,
  DiscussionBusState,
  StopPolicy,
  ConvergenceMetrics,
  ClaimNode,
  EvidenceNode,
  KnowledgeEdge,
  MemoryFabric,
  HotContext,
  WarmMemory,
  ColdArchive,
  VerificationConfig,
  VerificationResult,
  GauntletConfig,
  GauntletResult,
  ProductionSweepConfig,
  ProductionFinding,
  ProductionGateResult,
  GODRuntimeConfig,
  MADResult,
  GodRuntime,
  TaskSpecification,
  TaskGraph,
  FinalReport
}
