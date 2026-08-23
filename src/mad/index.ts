/**
 * Xee Harness Enhanced (XHE) - M.A.D (Multi-Agent Deployment) System
 * 
 * Main entry point for the Multi-Agent Deployment architecture.
 * Implements the complete GOD Runtime specification from TRANSCRIPT.md.
 * 
 * @origin-ai/xhe/mad
 * @version 1.0.0
 * 
 * Also known as:
 * - XeeCode / XCode
 * - Xee Harness Enhanced
 * 
 * Fork of: DSH/SeepSeek Harness
 */

// Core exports
export { GODRuntime, default as GodRuntime } from './core/god-runtime'
export type { GodRuntime } from './types'

// Type exports
export type {
  // Core Identity
  XHEIdentity,
  
  // Provider & Model Types
  ProviderCredential,
  ModelConfig,
  RateLimit,
  CostStructure,
  
  // Agent Types
  AgentConfig,
  ActiveAgent,
  AgentRole,
  
  // Discussion System
  AgentMessage,
  MessageType,
  DiscussionRound,
  DiscussionBusState,
  StopPolicy,
  ConvergenceMetrics,
  
  // Knowledge Graph
  ClaimNode,
  ClaimStatus,
  EvidenceNode,
  EvidenceType,
  KnowledgeEdge,
  EdgeRelation,
  
  // Memory System
  MemoryFabric,
  HotContext,
  WarmMemory,
  ColdArchive,
  
  // Verification System
  VerificationConfig,
  VerificationLevel,
  VerificationResult,
  VerificationCheck,
  VerificationCheckType,
  VerificationFailure,
  
  // Gauntlet Quality System
  GauntletConfig,
  BarSource,
  GauntletBudget,
  GauntletStopConditions,
  GauntletResult,
  GauntletRound,
  
  // Production Readiness
  ProductionSweepConfig,
  ProductionAgentConfig,
  ProductionFinding,
  ProductionGateResult,
  RemediationTask,
  
  // GOD Runtime
  GODRuntimeConfig,
  MADMode,
  DiscussionPolicy,
  BudgetPolicy,
  SpawnPolicy,
  SkillPolicy,
  ToolSecurityPolicy,
  
  // Results & API
  MADResult,
  MADTelemetry,
  AgentPerformance,
  RoutingDecision,
  TaskSpecification,
  TaskGraph,
  TaskNode,
  TaskEdge,
  ModelAssignment,
  VerificationStatus,
  FinalReport
} from './types'

// Constants
export { XHE_IDENTITY } from './types'

// Factory functions
export function createXHE(config?: Partial<GODRuntimeConfig>): GODRuntime {
  const { GODRuntime } = require('./core/god-runtime')
  return new GODRuntime(config || {})
}

// Quick execute helper
export async function xheExecute(
  task: string,
  mode: MADMode = 'PLAN',
  options?: Partial<GODRuntimeConfig>
): Promise<FinalReport> {
  const runtime = createXHE({ mode, ...options })
  
  await runtime.initializeTask({
    id: `task-${Date.now()}`,
    description: task,
    mode,
    requirements: [],
    constraints: [],
    priority: 'medium'
  })
  
  await runtime.decomposeTask()
  await runtime.conductDiscussion(task)
  
  return runtime.finalize()
}
