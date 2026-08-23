/**
 * Xee Harness Enhanced (XHE) - Main Entry Point
 * 
 * Complete integration of:
 * - I-WIN (Infinity Win Loop) - Never give up system
 * - M.A.D (Multi-Agent Deployment) - GOD Runtime with advanced orchestration
 * - BYOK (Bring Your Own Key) - Multi-provider key manager with multi-key support
 * - 25+ Slash Commands (Claude Code style)
 * - Fuzzy Autocomplete System
 * - Token Optimization (Lazy Loading)
 * - Model Behavior Invariants (No excuses, balanced aggression)
 * - Web UI Components
 * - Gauntlet Loop - Quality enforcement system
 * - Production Readiness Sweep - Pre-deployment validation
 * 
 * @origin-ai/xhe
 * Also known as: XeeCode, XCode
 * Fork of: DSH/SeepSeek Harness
 */

// Import core subsystems
import { invariant, assertModelAccountability, assertBalancedAggression } from './invariant'
import { startup, DEFAULT_BEHAVIOR } from './startup'

// Import major feature systems
export { IWINEngine, createIWIN, iwinExecute } from './iwin'
export type { IWINTask, IWINTaskContext, IWINResult, IWINStats, Approach } from './iwin'

// M.A.D System - Both Basic (MADEngine) and Advanced (GOD Runtime)
export { MADEngine, createMAD, madDiscuss } from './mad'
export type { MADResult, MADConfig, MAgentConfig, AgentRole } from './mad'

// Advanced GOD Runtime (TRANSCRIPT.md implementation)
export { GODRuntime, createXHE, xheExecute } from './mad'
export type { 
  GodRuntime, GODRuntimeConfig, TaskSpecification, FinalReport,
  VerificationResult, GauntletResult, ProductionGateResult
} from './mad'

// Re-export advanced types
export type {
  XHEIdentity, ProviderCredential, AgentConfig, ActiveAgent,
  DiscussionRound, ClaimNode, EvidenceNode, MemoryFabric,
  VerificationConfig, GauntletConfig, ProductionSweepConfig
} from './mad'

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
  MADConfig,
  MAgentConfig,
  AgentRole,
  IWINConfig,
  IWINStrategy,
  IWINProgress,
  BYOKConfig,
  APIKeyConfig,
  BudgetConfig
} from './types'

// Re-export invariants
export { invariant, assertModelAccountability, assertBalancedAggression }
export { startup, DEFAULT_BEHAVIOR }

// ============================================================================
// Plugin Metadata
// ============================================================================

export const name = '@origin-ai/xhe'
export const inject = ['commands', 'skills']

// ============================================================================
// Version & Metadata
// ============================================================================

export const VERSION = '2.0.0'
export const DESCRIPTION = 'Xee Harness Enhanced (XHE): I-WIN, M.A.D GOD Runtime, BYOK, Gauntlet Loop, Production Sweep — fork of DSH/SeepSeek Harness'

// ============================================================================
// Main Setup Function
// ============================================================================

export interface XHEConfig {
  enableIWIN?: boolean
  enableMAD?: boolean
  enableGODRuntime?: boolean  // Advanced M.A.D mode
  enableBYOK?: boolean
  enableCommands?: boolean
  enableAutocomplete?: boolean
  enableTokenOptimization?: boolean
  enableGauntletLoop?: boolean
  enableProductionSweep?: boolean
  modelBehavior?: import('./startup').ModelBehaviorConfig
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
    modelBehavior: config.modelBehavior
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
  if (config.enableGODRuntime || config.enableGauntletLoop || config.enableProductionSweep) {
    console.log('\n🏛️ Initializing Advanced M.A.D Systems...')
    console.log('   GOD Runtime | Gauntlet Loop | Production Sweep')
  }

  console.log('\n✅ Xee Harness Enhanced initialized successfully!')
  console.log(`   Version: ${VERSION}`)
  console.log(`   Features: I-WIN (${config.enableIWIN !== false ? 'ON' : 'OFF'}), ` +
              `M.A.D (${config.enableMAD !== false ? 'ON' : 'OFF'}), ` +
              `BYOK (${config.enableBYOK !== false ? 'OFF'}), ` +
              `GOD Runtime (${config.enableGODRuntime ? 'ON' : 'OFF'})`)
}

// ============================================================================
// Quick Start Functions
// ============================================================================

/**
 * Quick start I-WIN for a task
 */
export async function iwinTask<T>(
  taskDescription: string,
  executeFn: () => Promise<T>
): Promise<T> {
  const { iwinExecute } = await import('./iwin')
  const result = await iwinExecute(taskDescription, async () => executeFn())
  
  if (!result.success) {
    throw result.error ?? new Error('I-WIN failed')
  }
  
  return result.result!
}

/**
 * Quick start M.A.D discussion (Basic)
 */
export async function madTask(
  task: string,
  mode: 'plan' | 'build' | 'debug' = 'plan'
): Promise<string> {
  const { madDiscuss } = await import('./mad')
  const result = await madDiscuss(task, mode)
  return result.finalDecision
}

/**
 * Quick start Advanced M.A.D (GOD Runtime) - Uses TRANSCRIPT.md architecture
 */
export async function xheTask(
  task: string,
  mode: 'PLAN' | 'BUILD' | 'DEBUG' = 'PLAN'
): Promise<import('./mad').FinalReport> {
  const { xheExecute } = await import('./mad')
  return xheExecute(task, mode)
}

/**
 * Quick start BYOK with default configuration
 */
export function setupBYOK(): import('./byok').BYOKEngine {
  // Dynamic import to avoid circular dependency issues
  return import('./byok').then(({ createBYOK }) => 
    createBYOK({
      budget: { daily: 50, monthly: 500 },
      fallbackChain: ['openai', 'anthropic', 'google']
    })
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
  helpHandler
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
    advanced: { engine: () => import('./mad/core/god-runtime'), task: xheTask }
  },
  byok: { engine: () => import('./byok'), setup: setupBYOK },
  // Aliases for convenience
  xeeCode: { engine: () => import('./mad/core/god-runtime'), task: xheTask },
  xCode: { engine: () => import('./mad/core/god-runtime'), task: xheTask }
}
