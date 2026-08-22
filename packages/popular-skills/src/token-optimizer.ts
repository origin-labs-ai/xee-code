/**
 * DSH Token Optimization System
 * 
 * Implements lazy loading, token budgeting, and context optimization
 * for skills to minimize system prompt overhead.
 * 
 * Key Features:
 * - Lazy Loading: Skills load ONLY when invoked via slash command
 * - Token Budget: Configurable token limits per skill category
 * - Context Compression: Summarize/unload unused skills
 * - Priority Loading: Frequently used skills stay in context
 * - Memory Management: Auto-unload after inactivity
 * 
 * @module @deepseek-ai/dsh-token-optimizer
 */

import { Context } from '@deepseek-ai/cordis'

export const name = 'token-optimizer'
export const inject = ['skills', 'session']

// ============================================================================
// Types
// ============================================================================

interface SkillMetadata {
  id: string
  name: string
  description: string          // Short description (always loaded)
  command: string              // Slash command to trigger
  category: SkillCategory
  estimatedTokens: number       // Full skill size when loaded
  compressedTokens: number      // Metadata-only size
  lastUsed?: Date
  useCount: number
  priority: number             // 1-10, higher = more important
  dependencies: string[]       // Other skill IDs this depends on
  tags: string[]               // For discovery without loading
}

type SkillCategory = 
  | 'core'        // Always loaded (help, status)
  | 'frequently'   // Keep in cache (review, test, commit)
  | 'occasionally' // Load on demand, keep briefly
  | 'rarely'       // Load only when explicitly requested
  | 'gauntlet'     // Special handling (heavy but powerful)

type SkillLoadState = 'unloaded' | 'metadata' | 'loading' | 'loaded' | 'compressed' | 'error'

interface LoadedSkill {
  metadata: SkillMetadata
  state: SkillLoadState
  content?: string           // Full skill content (when loaded)
  compressedContent?: string // Compressed version (when compressed)
  loadedAt?: Date
  lastAccessed?: Date
  tokensUsed: number         // Actual tokens consumed
  unloadTimer?: NodeJS.Timeout
}

interface TokenBudget {
  totalBudget: number          // Max tokens for all skills
  used: number                // Currently used
  reserved: number            // Reserved for core skills
  available: number           // totalBudget - used - reserved
}

interface OptimizerConfig {
  maxTotalTokens: number          // Default: 50000 (50K tokens)
  coreSkillReserve: number        // Default: 5000 (5K for core)
  autoCompressAfter: number       // Default: 300000 (5 min inactivity)
  autoUnloadAfter: number         // Default: 900000 (15 min inactivity)
  maxSkillsLoaded: number         // Default: 10 simultaneously
  enableLearning: boolean         // Track usage patterns
  aggressiveCompression: boolean  // More aggressive summarization
  logTokenUsage: boolean          // Log usage stats
}

// ============================================================================
// Skill Registry (Lightweight Metadata Only)
// ============================================================================

const SKILL_REGISTRY: SkillMetadata[] = [
  // === CORE SKILLS (Always Loaded) ===
  {
    id: 'help',
    name: 'Command Help',
    description: 'Show available commands and get help',
    command: '/help',
    category: 'core',
    estimatedTokens: 200,
    compressedTokens: 50,
    priority: 10,
    dependencies: [],
    tags: ['commands', 'list', 'documentation']
  },
  {
    id: 'status',
    name: 'Session Status',
    description: 'Show current session and agent state',
    command: '/status',
    category: 'core',
    estimatedTokens: 150,
    compressedTokens: 40,
    priority: 10,
    dependencies: [],
    tags: ['info', 'state', 'session']
  },
  
  // === FREQUENTLY USED (Keep Cached) ===
  {
    id: 'review',
    name: 'Code Review',
    description: 'Comprehensive PR-style code review with quality checks',
    command: '/review',
    category: 'frequently',
    estimatedTokens: 8000,
    compressedTokens: 1200,
    priority: 8,
    dependencies: [],
    tags: ['quality', 'code-review', 'pr', 'analysis']
  },
  {
    id: 'test',
    name: 'Test Generation',
    description: 'Generate unit/integration/e2e tests with coverage focus',
    command: '/test',
    category: 'frequently',
    estimatedTokens: 6000,
    compressedTokens: 900,
    priority: 8,
    dependencies: [],
    tags: ['testing', 'unit-test', 'vitest', 'coverage']
  },
  {
    id: 'commit',
    name: 'Smart Commit',
    description: 'Auto-generate conventional commit messages from changes',
    command: '/commit',
    category: 'frequently',
    estimatedTokens: 4000,
    compressedTokens: 600,
    priority: 7,
    dependencies: [],
    tags: ['git', 'commit-message', 'conventional-commits']
  },
  {
    id: 'debug',
    name: 'Debug Session',
    description: 'Intelligent debugging with root cause analysis',
    command: '/debug',
    category: 'frequently',
    estimatedTokens: 7000,
    compressedTokens: 1000,
    priority: 7,
    dependencies: [],
    tags: ['debugging', 'error', 'bug-fix', 'troubleshoot']
  },
  
  // === OCCASIONALLY USED (Load on Demand) ===
  {
    id: 'verify',
    name: 'Quality Verification',
    description: 'Verify code quality and DSH conventions compliance',
    command: '/verify',
    category: 'occasionally',
    estimatedTokens: 5000,
    compressedTokens: 700,
    priority: 6,
    dependencies: [],
    tags: ['quality', 'lint', 'conventions', 'check']
  },
  {
    id: 'audit',
    name: 'Full Audit',
    description: 'Complete codebase audit for issues and improvements',
    command: '/audit',
    category: 'occasionally',
    estimatedTokens: 10000,
    compressedTokens: 1500,
    priority: 6,
    dependencies: ['verify'],
    tags: ['audit', 'code-quality', 'analysis', 'comprehensive']
  },
  {
    id: 'test-integration',
    name: 'Integration Tests',
    description: 'Generate integration test suites with mocked dependencies',
    command: '/test-integration',
    category: 'occasionally',
    estimatedTokens: 5500,
    compressedTokens: 800,
    priority: 5,
    dependencies: ['test'],
    tags: ['testing', 'integration', 'mocks', 'api-testing']
  },
  {
    id: 'test-e2e',
    name: 'E2E Tests',
    description: 'End-to-end test scenarios for complete flows',
    command: '/test-e2e',
    category: 'occasionally',
    estimatedTokens: 6000,
    compressedTokens: 900,
    priority: 5,
    dependencies: ['test'],
    tags: ['testing', 'e2e', 'user-flows', 'scenarios']
  },
  {
    id: 'test-coverage',
    name: 'Coverage Analysis',
    description: 'Analyze and improve test coverage to target threshold',
    command: '/test-coverage',
    category: 'occasionally',
    estimatedTokens: 4500,
    compressedTokens: 650,
    priority: 5,
    dependencies: ['test'],
    tags: ['testing', 'coverage', 'metrics', 'improvement']
  },
  {
    id: 'pr',
    name: 'PR Generator',
    description: 'Generate pull request descriptions from branch changes',
    command: '/pr',
    category: 'occasionally',
    estimatedTokens: 5000,
    compressedTokens: 750,
    priority: 6,
    dependencies: ['commit'],
    tags: ['git', 'pull-request', 'github', 'description']
  },
  {
    id: 'changelog',
    name: 'Changelog Generator',
    description: 'Generate changelogs from git history',
    command: '/changelog',
    category: 'occasionally',
    estimatedTokens: 3500,
    compressedTokens: 500,
    priority: 4,
    dependencies: [],
    tags: ['git', 'changelog', 'release-notes', 'history']
  },
  {
    id: 'docs',
    name: 'Documentation Generator',
    description: 'Generate documentation from source code',
    command: '/docs',
    category: 'occasionally',
    estimatedTokens: 5500,
    compressedTokens: 800,
    priority: 5,
    dependencies: [],
    tags: ['docs', 'documentation', 'jSDoc', 'generate']
  },
  {
    id: 'api-docs',
    name: 'API Documentation',
    description: 'Generate API docs from type definitions',
    command: '/api-docs',
    category: 'occasionally',
    estimatedTokens: 5000,
    compressedTokens: 700,
    priority: 4,
    dependencies: ['docs'],
    tags: ['api', 'docs', 'types', 'endpoints']
  },
  {
    id: 'readme',
    name: 'README Generator',
    description: 'Update or generate README.md files',
    command: '/readme',
    category: 'occasionally',
    estimatedTokens: 3500,
    compressedTokens: 500,
    priority: 4,
    dependencies: ['docs'],
    tags: ['readme', 'markdown', 'documentation', 'project']
  },
  {
    id: 'refactor',
    name: 'Refactoring Assistant',
    description: 'Safe refactoring with automatic test generation',
    command: '/refactor',
    category: 'occasionally',
    estimatedTokens: 7500,
    compressedTokens: 1100,
    priority: 6,
    dependencies: ['test'],
    tags: ['refactor', 'clean-code', 'patterns', 'safe-refactor']
  },
  {
    id: 'migrate',
    name: 'Code Migration',
    description: 'Assist with code migration between versions/frameworks',
    command: '/migrate',
    category: 'occasionally',
    estimatedTokens: 6000,
    compressedTokens: 900,
    priority: 5,
    dependencies: [],
    tags: ['migration', 'upgrade', 'convert', 'framework']
  },
  {
    id: 'optimize',
    name: 'Performance Optimizer',
    description: 'Performance optimization analysis and suggestions',
    command: '/optimize',
    category: 'occasionally',
    estimatedTokens: 5500,
    compressedTokens: 800,
    priority: 5,
    dependencies: [],
    tags: ['performance', 'optimization', 'speed', 'memory']
  },
  {
    id: 'error-analyze',
    name: 'Error Analyzer',
    description: 'Deep analysis of error messages or logs',
    command: '/error-analyze',
    category: 'occasionally',
    estimatedTokens: 5000,
    compressedTokens: 750,
    priority: 5,
    dependencies: ['debug'],
    tags: ['error', 'analysis', 'logs', 'debug']
  },
  {
    id: 'fix',
    name: 'Auto Fixer',
    description: 'Auto-fix identified issues safely',
    command: '/fix',
    category: 'occasionally',
    estimatedTokens: 4500,
    compressedTokens: 650,
    priority: 6,
    dependencies: ['debug'],
    tags: ['fix', 'auto-fix', 'repair', 'resolve']
  },
  {
    id: 'security',
    name: 'Security Scanner',
    description: 'Security vulnerability scan (OWASP + CVEs)',
    command: '/security',
    category: 'occasionally',
    estimatedTokens: 9000,
    compressedTokens: 1300,
    priority: 7,
    dependencies: [],
    tags: ['security', 'owasp', 'vulnerability', 'scan', 'cve']
  },
  
  // === RARELY USED (Explicit Request) ===
  {
    id: 'clear',
    name: 'Clear Context',
    description: 'Clear conversation context hint',
    command: '/clear',
    category: 'rarely',
    estimatedTokens: 100,
    compressedTokens: 30,
    priority: 3,
    dependencies: [],
    tags: ['clear', 'reset', 'context']
  },
  {
    id: 'compact',
    name: 'Context Compaction',
    description: 'Compress context to save tokens',
    command: '/compact',
    category: 'rarely',
    estimatedTokens: 300,
    compressedTokens: 80,
    priority: 3,
    dependencies: [],
    tags: ['compact', 'compress', 'tokens', 'save-space']
  },
  {
    id: 'cost',
    name: 'Cost Display',
    description: 'Show token usage and cost estimate',
    command: '/cost',
    category: 'rarely',
    estimatedTokens: 200,
    compressedTokens: 50,
    priority: 2,
    dependencies: [],
    tags: ['cost', 'tokens', 'usage', 'price']
  },
  
  // === GAUNTLET LOOP (Special Handling) ===
  {
    id: 'gauntlet',
    name: '🏆 ULTIMATE GAUNTLET LOOP',
    description: 'NEVER-SURRENDER Builder-Critic quality loop. Runs until VICTORY!',
    command: '/gauntlet',
    category: 'gauntlet',
    estimatedTokens: 25000,  // Heavy but worth it!
    compressedTokens: 3000,
    priority: 9,
    dependencies: ['review', 'test', 'debug'], // Can use these
    tags: ['gauntlet', 'quality-loop', 'builder-critic', 'never-surrender', 'ultimate']
  }
]

// ============================================================================
// Token Optimizer Engine
// ============================================================================

class TokenOptimizerEngine {
  private config: OptimizerConfig
  private loadedSkills: Map<string, LoadedSkill>
  private usageHistory: Array<{skillId: string, timestamp: Date, duration: number}>
  private budget: TokenBudget
  
  constructor(config?: Partial<OptimizerConfig>) {
    this.config = {
      maxTotalTokens: config?.maxTotalTokens ?? 50000,
      coreSkillReserve: config?.coreSkillReserve ?? 5000,
      autoCompressAfter: config?.autoCompressAfter ?? 300000,
      autoUnloadAfter: config?.autoUnloadAfter ?? 900000,
      maxSkillsLoaded: config?.maxSkillsLoaded ?? 10,
      enableLearning: config?.enableLearning ?? true,
      aggressiveCompression: config?.aggressiveCompression ?? false,
      logTokenUsage: config?.logTokenUsage ?? true
    }
    
    this.loadedSkills = new Map()
    this.usageHistory = []
    this.budget = {
      totalBudget: this.config.maxTotalTokens,
      used: 0,
      reserved: this.config.coreSkillReserve,
      available: this.config.maxTotalTokens - this.config.coreSkillReserve
    }
    
    // Pre-load core skills
    this.preloadCoreSkills()
  }
  
  /**
   * Pre-load core skills (always needed)
   */
  private preloadCoreSkills(): void {
    const coreSkills = SKILL_REGISTRY.filter(s => s.category === 'core')
    for (const skill of coreSkills) {
      this.loadSkill(skill.id, true) // Force load core skills
    }
  }
  
  /**
   * Get skill metadata only (very cheap, ~50 tokens each)
   */
  getSkillMetadata(skillId: string): SkillMetadata | undefined {
    return SKILL_REGISTRY.find(s => s.id === skillId)
  }
  
  /**
   * Get ALL skills metadata (for command discovery)
   */
  getAllSkillsMetadata(): SkillMetadata[] {
    return [...SKILL_REGISTRY]
  }
  
  /**
   * Get lightweight command list (for autocomplete/help)
   * Returns minimal info to save tokens
   */
  getLightweightCommandList(): Array<{command: string, description: string, category: string}> {
    return SKILL_REGISTRY.map(s => ({
      command: s.command,
      description: s.description,
      category: s.category
    }))
  }
  
  /**
   * Load a skill (full content)
   * This is the main entry point when user invokes a slash command
   */
  async loadSkill(skillId: string, force = false): Promise<LoadedSkill | null> {
    const metadata = SKILL_REGISTRY.find(s => s.id === skillId)
    if (!metadata) {
      console.error(`[token-optimizer] Unknown skill: ${skillId}`)
      return null
    }
    
    // Check if already loaded
    const existing = this.loadedSkills.get(skillId)
    if (existing && (existing.state === 'loaded' || existing.state === 'compressed')) {
      if (!force) {
        this.touchSkill(skillId)
        return existing
      }
    }
    
    // Check budget
    if (!this.canAffordSkill(metadata)) {
      await this.makeRoomForSkill(metadata)
    }
    
    // Load dependencies first
    for (const depId of metadata.dependencies) {
      await this.loadSkill(depId)
    }
    
    // Mark as loading
    const loadedSkill: LoadedSkill = {
      metadata,
      state: 'loading',
      tokensUsed: metadata.compressedTokens // Start with metadata cost
    }
    this.loadedSkills.set(skillId, loadedSkill)
    
    try {
      // Load actual content (in real implementation, this would fetch from file/DB)
      const content = await this.fetchSkillContent(skillId)
      
      loadedSkill.content = content
      loadedSkill.state = 'loaded'
      loadedSkill.loadedAt = new Date()
      loadedSkill.lastAccessed = new Date()
      loadedSkill.tokensUsed = this.estimateTokenCount(content)
      
      // Update budget
      this.budget.used += loadedSkill.tokensUsed
      this.budget.available = this.budget.totalBudget - this.budget.used - this.budget.reserved
      
      // Set up auto-compression timer
      this.setupAutoCompression(skillId)
      
      // Log if enabled
      if (this.config.logTokenUsage) {
        this.logUsage(skillId, 'load')
      }
      
      return loadedSkill
      
    } catch (error) {
      loadedSkill.state = 'error'
      console.error(`[token-optimizer] Failed to load skill ${skillId}:`, error)
      return null
    }
  }
  
  /**
   * Get currently loaded skill content
   */
  getLoadedSkillContent(skillId: string): string | null {
    const skill = this.loadedSkills.get(skillId)
    if (!skill || skill.state !== 'loaded') return null
    
    this.touchSkill(skillId)
    return skill.content ?? null
  }
  
  /**
   * Compress a skill (keep summary, free most tokens)
   */
  async compressSkill(skillId: string): Promise<void> {
    const skill = this.loadedSkills.get(skillId)
    if (!skill || skill.state !== 'loaded') return
    
    // Generate compressed version (summary)
    const compressed = await this.compressContent(skill.content!)
    
    const tokensFreed = skill.tokensUsed - this.estimateTokenCount(compressed)
    
    skill.compressedContent = compressed
    skill.content = undefined // Free full content
    skill.state = 'compressed'
    
    // Update budget
    this.budget.used -= tokensFreed
    this.budget.available += tokensFreed
    
    // Clear compression timer, set unload timer
    if (skill.unloadTimer) clearTimeout(skill.unloadTimer)
    this.setupAutoUnload(skillId)
    
    if (this.config.logTokenUsage) {
      console.log(`[token-optimizer] Compressed ${skillId}, freed ${tokensFreed} tokens`)
    }
  }
  
  /**
   * Fully unload a skill (free all tokens)
   */
  unloadSkill(skillId: string): void {
    const skill = this.loadedSkills.get(skillId)
    if (!skill) return
    
    // Don't unload core skills
    if (skill.metadata.category === 'core') {
      console.warn(`[token-optimizer] Cannot unload core skill: ${skillId}`)
      return
    }
    
    // Clear timers
    if (skill.unloadTimer) clearTimeout(skill.unloadTimer)
    
    // Update budget
    this.budget.used -= skill.tokensUsed
    this.budget.available += skill.tokensUsed
    
    // Remove from loaded set
    this.loadedSkills.delete(skillId)
    
    if (this.config.logTokenUsage) {
      console.log(`[token-optimizer] Unloaded ${skillId}, freed ${skill.tokensUsed} tokens`)
    }
  }
  
  /**
   * Record that a skill was used (for learning/prioritization)
   */
  recordUsage(skillId: string, durationMs: number): void {
    if (!this.config.enableLearning) return
    
    // Update metadata
    const metadata = SKILL_REGISTRY.find(s => s.id === skillId)
    if (metadata) {
      metadata.useCount++
      metadata.lastUsed = new Date()
    }
    
    // Update loaded skill access time
    const loaded = this.loadedSkills.get(skillId)
    if (loaded) {
      loaded.lastAccessed = new Date()
    }
    
    // Record in history
    this.usageHistory.push({
      skillId,
      timestamp: new Date(),
      duration: durationMs
    })
    
    // Trim old history (keep last 1000 entries)
    if (this.usageHistory.length > 1000) {
      this.usageHistory = this.usageHistory.slice(-1000)
    }
  }
  
  /**
   * Get current token budget status
   */
  getBudgetStatus(): TokenBudget & {
    loadedCount: number
    coreLoaded: number
    frequentlyLoaded: number
    occasionallyLoaded: number
    rarelyLoaded: number
    gauntletLoaded: number
  } {
    let coreLoaded = 0, frequentlyLoaded = 0, occasionallyLoaded = 0, rarelyLoaded = 0, gauntletLoaded = 0
    
    for (const skill of this.loadedSkills.values()) {
      switch (skill.metadata.category) {
        case 'core': coreLoaded++; break
        case 'frequently': frequentlyLoaded++; break
        case 'occasionally': occasionallyLoaded++; break
        case 'rarely': rarelyLoaded++; break
        case 'gauntlet': gauntletLoaded++; break
      }
    }
    
    return {
      ...this.budget,
      loadedCount: this.loadedSkills.size,
      coreLoaded,
      frequentlyLoaded,
      occasionallyLoaded,
      rarelyLoaded,
      gauntletLoaded
    }
  }
  
  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalUses: number
    topSkills: Array<{id: string, name: string, count: number}>
    averageDuration: number
    categoryBreakdown: Record<string, number>
  } {
    const totalUses = this.usageHistory.length
    
    // Top skills by usage
    const skillCounts = new Map<string, number>()
    for (const use of this.usageHistory) {
      skillCounts.set(use.skillId, (skillCounts.get(use.skillId) || 0) + 1)
    }
    
    const topSkills = Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => {
        const meta = SKILL_REGISTRY.find(s => s.id === id)
        return { id, name: meta?.name ?? id, count }
      })
    
    // Average duration
    const avgDuration = totalUses > 0
      ? this.usageHistory.reduce((sum, u) => sum + u.duration, 0) / totalUses
      : 0
    
    // Category breakdown
    const categoryBreakdown: Record<string, number> = {}
    for (const use of this.usageHistory) {
      const meta = SKILL_REGISTRY.find(s => s.id === use.skillId)
      const cat = meta?.category ?? 'unknown'
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1
    }
    
    return {
      totalUses,
      topSkills,
      averageDuration: Math.round(avgDuration),
      categoryBreakdown
    }
  }
  
  /**
   * Find skills by tag (without loading them)
   */
  findSkillsByTag(tag: string): SkillMetadata[] {
    return SKILL_REGISTRY.filter(s => 
      s.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    )
  }
  
  /**
   * Search skills by query (for discovery)
   */
  searchSkills(query: string): SkillMetadata[] {
    const q = query.toLowerCase()
    return SKILL_REGISTRY.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.command.includes(q) ||
      s.tags.some(t => t.includes(q)) ||
      s.id.includes(q)
    ).sort((a, b) => {
        // Sort by relevance, then by priority
        const aScore = this.calculateRelevance(a, q)
        const bScore = this.calculateRelevance(b, q)
        return bScore - aScore
      })
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  private canAffordSkill(metadata: SkillMetadata): boolean {
    return this.budget.available >= metadata.estimatedTokens
  }
  
  private async makeRoomForSkill(metadata: SkillMetadata): Promise<void> {
    const needed = metadata.estimatedTokens
    let freed = 0
    
    // Strategy 1: Compress idle skills (not recently accessed)
    const now = Date.now()
    for (const [id, skill] of this.loadedSkills.entries()) {
      if (freed >= needed) break
      if (skill.state !== 'loaded') continue
      if (skill.metadata.category === 'core') continue
      if (!skill.lastAccessed) continue
      if (now - skill.lastAccessed.getTime() < this.config.autoCompressAfter) continue
      
      await this.compressSkill(id)
      freed += skill.tokensUsed * 0.7 // Estimate freed tokens
    }
    
    // Strategy 2: Unload compressed skills if still need room
    if (freed < needed) {
      for (const [id, skill] of this.loadedSkills.entries()) {
        if (freed >= needed) break
        if (skill.state !== 'compressed') continue
        if (skill.metadata.category === 'core') continue
        
        this.unloadSkill(id)
        freed += skill.tokensUsed
      }
    }
    
    // Strategy 3: If still not enough, unload low-priority loaded skills
    if (freed < needed) {
      const sortedByPriority = Array.from(this.loadedSkills.entries())
        .filter(([, s]) => s.state === 'loaded' && s.metadata.category !== 'core')
        .sort((a, b) => a[1].metadata.priority - b[1].metadata.priority)
      
      for (const [id] of sortedByPriority) {
        if (freed >= needed) break
        this.unloadSkill(id)
        freed += needed // Assume enough now
      }
    }
  }
  
  private touchSkill(skillId: string): void {
    const skill = this.loadedSkills.get(skillId)
    if (skill) {
      skill.lastAccessed = new Date()
      
      // Reset timers
      if (skill.unloadTimer) clearTimeout(skill.unloadTimer)
      if (skill.state === 'loaded') {
        this.setupAutoCompression(skillId)
      } else if (skill.state === 'compressed') {
        this.setupAutoUnload(skillId)
      }
    }
  }
  
  private setupAutoCompression(skillId: string): void {
    const skill = this.loadedSkills.get(skillId)
    if (!skill || skill.metadata.category === 'core') return
    
    skill.unloadTimer = setTimeout(() => {
      this.compressSkill(skillId)
    }, this.config.autoCompressAfter)
  }
  
  private setupAutoUnload(skillId: string): void {
    const skill = this.loadedSkills.get(skillId)
    if (!skill || skill.metadata.category === 'core') return
    
    skill.unloadTimer = setTimeout(() => {
      this.unloadSkill(skillId)
    }, this.config.autoUnloadAfter)
  }
  
  private async fetchSkillContent(skillId: string): Promise<string> {
    // In real implementation, this would:
    // 1. Read from .agents/skills/dsh-popular-skills/
    // 2. Or fetch from database
    // 3. Or generate dynamically
    
    // For now, return placeholder (actual content loaded separately)
    return `[SKILL CONTENT FOR: ${skillId}]`
  }
  
  private async compressContent(content: string): Promise<string> {
    // In real implementation, this would:
    // 1. Use LLM to summarize
    // 2. Extract key instructions
    // 3. Preserve critical details
    
    if (this.config.aggressiveCompression) {
      // Very aggressive: just key points
      return `[COMPRESSED: ${content.split('\n').slice(0, 5).join('; ')}...]`
    }
    
    // Moderate: preserve structure, shorten examples
    return content
      .split('\n')
      .filter(line => !line.startsWith('```') && line.trim().length > 0)
      .slice(0, 30)
      .join('\n') + '\n... [COMPRESSED]'
  }
  
  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 chars per token
    return Math.ceil(text.length / 4)
  }
  
  private calculateRelevance(metadata: SkillMetadata, query: string): number {
    let score = 0
    const q = query.toLowerCase()
    
    if (metadata.name.toLowerCase().includes(q)) score += 10
    if (metadata.command.includes(q)) score += 8
    if (metadata.description.toLowerCase().includes(q)) score += 5
    if (metadata.tags.some(t => t.includes(q))) score += 3
    if (metadata.id.includes(q)) score += 2
    
    // Boost frequently used
    score += Math.min(metadata.useCount * 0.5, 5)
    
    // Boost by priority
    score += metadata.priority * 0.3
    
    return score
  }
  
  private logUsage(action: string, detail?: string): void {
    const status = this.getBudgetStatus()
    console.log(
      `[token-optimizer] ${action}${detail ? `: ${detail}` : ''} ` +
      `(used: ${status.used}/${status.totalBudget}, ` +
      `loaded: ${status.loadedCount}, ` +
      `available: ${status.available})`
    )
  }
}

// ============================================================================
// Singleton & Plugin Entry Point
// ============================================================================

let optimizerInstance: TokenOptimizerEngine | null = null

export function getTokenOptimizer(config?: Partial<OptimizerConfig>): TokenOptimizerEngine {
  if (!optimizerInstance) {
    optimizerInstance = new TokenOptimizerEngine(config)
  }
  return optimizerInstance
}

export function apply(ctx: Context) {
  const optimizer = getTokenOptimizer()
  
  console.log('[dsh-token-optimizer] ✅ Initialized')
  console.log(`[dsh-token-optimizer] 💰 Budget: ${optimizer['config'].maxTotalTokens} tokens`)
  console.log(`[dsh-token-optimizer] 📦 Skills registered: ${SKILL_REGISTRY.length}`)
  console.log(`[dsh-token-optimizer] 🔄 Learning mode: ${optimizer['config'].enableLearning ? 'ON' : 'OFF'}`)
  console.log(`[dsh-token-optimizer] ⚡ Auto-compress: ${optimizer['config'].autoCompressAfter / 1000}s`)
  console.log(`[dsh-token-optimizer] 🗑️  Auto-unload: ${optimizer['config'].autoUnloadAfter / 1000}s`)
}
