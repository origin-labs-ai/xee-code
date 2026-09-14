/**
 * Xee Harness Enhanced (XHE) - Main Entry Point
 *
 * Complete integration of:
 * - I-WIN (Infinity Win Loop) - Never give up system
 * - M.A.D (Multi-Agent Deployment) - GOD Runtime with advanced orchestration
 *   - 12 Core Components (State Manager, Model Router, Scheduler, etc.)
 *   - Discussion Bus with adversarial debate
 *   - Memory Fabric (HOT/WARM/COLD)
 *   - Verification Engine (3 layers: Micro/General/Adversarial)
 *   - Gauntlet Loop (Quality enforcement)
 *   - Production Readiness Sweep
 *   - 15 Core Rules enforcement
 *   - Cost Intelligence system
 *   - Adaptive Routing formula
 * - BYOK (Bring Your Own Key) - Multi-provider key manager with multi-key support
 * - 25+ Slash Commands (Claude Code style)
 * - Fuzzy Autocomplete System
 * - Token Optimization (Lazy Loading)
 * - Model Behavior Invariants (No excuses, balanced aggression)
 * - Web UI Components
 *
 * @origin-ai/cf
 * @version 2.0.0
 *
 * Also known as:
 * - XeeCode / XCode
 * - Xee Harness Enhanced
 *
 * Fork of: DSH/SeepSeek Harness
 */

// Import core subsystems
import { invariant, assertModelAccountability, assertBalancedAggression } from './invariant'
import { startup, DEFAULT_BEHAVIOR } from './startup'

// Import major feature systems
export { IWINEngine, createIWIN, iwinExecute } from './iwin'
export type { IWINTask, IWINTaskContext, IWINResult, IWINStats, Approach } from './iwin'

// ============================================================================
// M.A.D System - Complete Integration (Basic + Advanced)
// ============================================================================

// Basic M.A.D Engine (Quick start, simpler API)
export { MADEngine, createMAD, createAdvancedMAD, madDiscuss, madDiscussAdvanced } from './mad'
export type {
  MADConfig,
  MAgentConfig,
  AgentRole,
  AgentMessage,
  DiscussionRound,
  MADResult,
  MessageMetadata,
} from './mad'

// Advanced GOD Runtime (Full TRANSCRIPT.md implementation)
export { GODRuntime, createGODRuntime, xheExecute } from './mad/core/god-runtime'
export type {
  GodRuntime,
  GODRuntimeConfig,
  TaskSpecification,
  FinalReport,
  VerificationResult,
  GauntletResult,
  ProductionGateResult,
  ClaimNode,
  EvidenceNode,
  KnowledgeEdge,
  MemoryFabric,
  HotContext,
  WarmMemory,
  ColdArchive,
  VerificationConfig,
  GauntletConfig,
  ProductionSweepConfig,
  CostSummary,
  CoreRuleViolation,
  RoutingDecision,
  AgentPerformance as AdvancedAgentPerformance,
  MADMode,
  ProviderCredential,
  StopPolicy,
  ConvergenceMetrics,
  CoreRule,
  XHEIdentity,
  ActiveAgent as AdvancedActiveAgent,
  AgentConfig as AdvancedAgentConfig,
  GODState,
  MADPhase,
  Artifact,
  SignOff,
} from './mad/core/god-runtime'

// Re-export types from mad/types for convenience
export { XHE_IDENTITY, MAD_CORE_RULES } from './mad/types'
export type {
  ModelCapability,
  MessageType,
  ClaimStatus,
  EvidenceType,
  EdgeRelation,
  VerificationLevel,
  VerificationCheckType,
  BarSource,
  RuleCategory,
  TelemetryRun,
  TelemetryAgent,
  TelemetryTask,
  // ... add more as needed
} from './mad/types'

export { BYOKEngine, createBYOK } from './byok'
export type { KeyInfo, KeyHealthResult, BudgetStatus, UsageAnalytics, ExportedBYOKConfig } from './byok'

// Import utilities
import { initFuzzyAutocomplete, findMatches } from './fuzzy-autocomplete'
import { initTokenOptimizer, loadSkill, getTokenStats } from './token-optimizer'
import { registerCommands } from './commands'

// Re-export types
export type {
  SkillCommand,
  CommandContext,
  SkillCategory,
  FuzzyMatchResult,
  TokenStats,
  IWINConfig,
  IWINStrategy,
  IWINProgress,
  BYOKConfig,
  APIKeyConfig,
  BudgetConfig,
} from './types'

// Re-export invariants
export { invariant, assertModelAccountability, assertBalancedAggression }
export { startup, DEFAULT_BEHAVIOR }

// ============================================================================
// Plugin Metadata
// ============================================================================

export const name = '@origin-ai/cf'
export const inject = ['commands', 'skills']

// ============================================================================
// Version & Metadata
// ============================================================================

export const VERSION = '2.0.0'
export const DESCRIPTION = 'Xee Harness Enhanced (XHE): I-WIN, M.A.D GOD Runtime (12 components), BYOK, Gauntlet Loop, Production Sweep, 15 Core Rules — fork of DSH/SeepSeek Harness'

// ============================================================================
// Main Setup Function
// ============================================================================

export interface XHEConfig {
  // Basic features
  enableIWIN?: boolean
  enableMAD?: boolean
  enableBYOK?: boolean
  enableCommands?: boolean
  enableAutocomplete?: boolean
  enableTokenOptimization?: boolean

  // Advanced M.A.D features
  enableGODRuntime?: boolean      // Use advanced GOD Runtime instead of basic MAD
  enableDiscussionBus?: boolean   // Enable adversarial discussion bus
  enableVerificationEngine?: boolean // Enable 3-layer verification
  enableGauntletLoop?: boolean    // Enable quality gauntlet
  enableProductionSweep?: boolean // Enable production readiness checks
  enableCostIntelligence?: boolean // Enable cost optimization
  enableAdaptiveRouting?: boolean // Enable smart model routing

  // Configuration
  modelBehavior?: import('./startup').ModelBehaviorConfig
  godRuntimeConfig?: Partial<GODRuntimeConfig>
  madConfig?: Partial<MADConfig>
}

export async function setupXHE(config: XHEConfig = {}): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════╗')
  console.log('║     🚀 XEE HARNESS ENHANCED INITIALIZING         ║')
  console.log('║     I-WIN | M.A.D | GOD Runtime | BYOK          ║')
  console.log('╚═══════════════════════════════════════════════════╝')

  // Initialize model behavior rules first
  await startup({
    enableIWIN: config.enableIWIN,
    enableMAD: config.enableMAD,
    enableBYOK: config.enableBYOK,
    modelBehavior: config.modelBehavior,
  })

  // Initialize optional features
  if (config.enableCommands !== false) {
    console.log('\n📜 Registering slash commands...')
    registerCommands({} as any)
  }

  if (config.enableAutocomplete !== false) {
    console.log('🔍 Initializing fuzzy autocomplete...')
    initFuzzyAutocomplete({})
  }

  if (config.enableTokenOptimization !== false) {
    console.log('⚡ Enabling token optimization...')
    initTokenOptimizer({})
  }

  // Initialize advanced features if enabled
  const advancedFeatures = []
  if (config.enableGODRuntime || config.enableDiscussionBus || config.enableVerificationEngine ||
      config.enableGauntletLoop || config.enableProductionSweep || config.enableCostIntelligence ||
      config.enableAdaptiveRouting) {
    console.log('\n🏛️ Initializing Advanced M.A.D Systems...')

    if (config.enableGODRuntime) advancedFeatures.push('GOD Runtime')
    if (config.enableDiscussionBus) advancedFeatures.push('Discussion Bus')
    if (config.enableVerificationEngine) advancedFeatures.push('Verification Engine (3-layer)')
    if (config.enableGauntletLoop) advancedFeatures.push('Gauntlet Loop')
    if (config.enableProductionSweep) advancedFeatures.push('Production Sweep')
    if (config.enableCostIntelligence) advancedFeatures.push('Cost Intelligence')
    if (config.enableAdaptiveRouting) advancedFeatures.push('Adaptive Routing')

    console.log(`   Enabled: ${advancedFeatures.join(', ')}`)
  }

  console.log('\n✅ Xee Harness Enhanced initialized successfully!')
  console.log(`   Version: ${VERSION}`)
  console.log('   Features:')
  console.log(`     - I-WIN: ${config.enableIWIN !== false ? 'ON' : 'OFF'}`)
  console.log(`     - M.A.D: ${config.enableMAD !== false ? 'ON' : 'OFF'}`)
  console.log(`     - BYOK: ${config.enableBYOK !== false ? 'ON' : 'OFF'}`)
  console.log(`     - GOD Runtime: ${config.enableGODRuntime ? 'ON' : 'OFF'}`)
  console.log(`     - Advanced Systems: ${advancedFeatures.length > 0 ? `${advancedFeatures.length} modules` : 'NONE'}`)
}

// ============================================================================
// Quick Start Functions
// ============================================================================

/**
 * Quick start I-WIN for a task
 */
export async function iwinTask<T>(
  taskDescription: string,
  executeFn: () => Promise<T>,
): Promise<T> {
  const { iwinExecute } = await import('./iwin')
  const result = await iwinExecute(taskDescription, async () => executeFn())

  if (!result.success) {
    throw result.error ?? new Error('I-WIN failed')
  }

  return result.result!
}

/**
 * Quick start Basic M.A.D discussion (simple API)
 */
export async function madTask(
  task: string,
  mode: 'plan' | 'build' | 'debug' = 'plan',
  options?: Partial<MADConfig>,
): Promise<MADResult> {
  const { madDiscuss } = await import('./mad')
  return madDiscuss(task, mode, options)
}

/**
 * Quick start Advanced M.A.D (GOD Runtime) - Uses TRANSCRIPT architecture
 */
export async function xheTask(
  task: string,
  mode: 'PLAN' | 'BUILD' | 'DEBUG' = 'PLAN',
  options?: Partial<GODRuntimeConfig>,
): Promise<FinalReport> {
  const { xheExecute } = await import('./mad/core/god-runtime')
  return xheExecute(task, mode, options)
}

/**
 * Quick start BYOK with default configuration
 */
export function setupBYOK(): import('./byok').BYOKEngine {
  return import('./byok').then(({ createBYOK }) =>
    createBYOK({
      budget: { daily: 50, monthly: 500 },
      fallbackChain: ['openai', 'anthropic', 'google'],
    }),
  ) as any
}

// ============================================================================
// Utility Exports
// ============================================================================

export { findMatches, initFuzzyAutocomplete }
export { loadSkill, getTokenStats, initTokenOptimizer }
export { registerCommands }

// Command handlers for direct use
export {
  reviewHandler,
  testHandler,
  commitHandler,
  debugHandler,
  securityHandler,
  refactorHandler,
  gauntletHandler,
  iwinHandler,
  madHandler,
  byokHandler,
  helpHandler,
} from './commands'

// Default export
export default {
  name,
  VERSION,
  DESCRIPTION,
  setup: setupXHE,
  iwin: { engine: () => import('./iwin'), task: iwinTask },
  mad: {
    basic: { engine: () => import('./mad'), task: madTask },
    advanced: { engine: () => import('./mad/core/god-runtime'), task: xheTask },
  },
  byok: { engine: () => import('./byok'), setup: setupBYOK },
  // Aliases for convenience
  xeeCode: { engine: () => import('./mad/core/god-runtime'), task: xheTask },
  xCode: { engine: () => import('./mad/core/god-runtime'), task: xheTask },
}
