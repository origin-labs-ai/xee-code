/**
 * DSH Fuzzy Command Autocomplete System
 * 
 * Provides intelligent slash command completion with fuzzy matching,
 * usage statistics, category filtering, and web UI integration.
 * 
 * Features:
 * - Fuzzy string matching (tolerates typos, partial matches)
 * - Relevance scoring and ranking
 * - Category-based filtering
 * - Usage frequency tracking
 * - Keyboard navigation support
 * - Web UI autocomplete component
 * 
 * @module @deepseek-ai/dsh-fuzzy-autocomplete
 */

import { Context } from '@deepseek-ai/cordis'

export const name = 'fuzzy-autocomplete'
export const inject = ['commands']

// ============================================================================
// Types
// ============================================================================

interface CommandSuggestion {
  command: string
  name: string
  description: string
  category: CommandCategory
  score: number        // Match score (0-1)
  usageCount: number   // How often used
  lastUsed?: Date      // Last usage timestamp
  examples: string[]
  aliases: string[]    // Alternative names/abbreviations
}

type CommandCategory = 
  | 'quality' 
  | 'testing' 
  | 'git' 
  | 'docs' 
  | 'refactor' 
  | 'debug' 
  | 'security'
  | 'gauntlet'
  | 'utility'
  | 'all'

interface AutocompleteConfig {
  maxSuggestions: number       // Default: 8
  minScoreThreshold: number    // Default: 0.3
  includeUsageStats: boolean   // Default: true
  fuzzyTolerance: number       // Default: 0.7 (Levenshtein ratio)
  enableAliases: boolean       // Default: true
  enableLearning: boolean      // Default: true (learn from usage)
}

interface AutocompleteResult {
  query: string
  suggestions: CommandSuggestion[]
  hasExactMatch: boolean
  totalMatches: number
  queryTimeMs: number
}

// ============================================================================
// Command Database (Extended)
// ============================================================================

const COMMAND_DB: Omit<CommandSuggestion, 'score'>[] = [
  // Quality & Review
  {
    command: '/review',
    name: 'Code Review',
    description: 'Comprehensive PR-style code review with security analysis',
    category: 'quality',
    usageCount: 0,
    examples: ['/review', '/review --strict', '/review src/core/'],
    aliases: ['rev', 'code-review', 'pr-review']
  },
  {
    command: '/verify',
    name: 'Verify Quality',
    description: 'Verify code quality and DSH conventions compliance',
    category: 'quality',
    usageCount: 0,
    examples: ['/verify', '/verify src/'],
    aliases: ['ver', 'check', 'lint-check']
  },
  {
    command: '/audit',
    name: 'Full Audit',
    description: 'Complete codebase audit for issues and improvements',
    category: 'quality',
    usageCount: 0,
    examples: ['/audit', '/audit --scope all'],
    aliases: ['aud', 'full-audit', 'inspect']
  },
  
  // Testing
  {
    command: '/test',
    name: 'Generate Tests',
    description: 'Generate unit/integration/e2e tests for code',
    category: 'testing',
    usageCount: 0,
    examples: ['/test src/', '/test --coverage', '/test --type e2e'],
    aliases: ['t', 'gen-test', 'test-gen', 'spec']
  },
  {
    command: '/test-integration',
    name: 'Integration Tests',
    description: 'Generate integration test suites with real dependencies mocked',
    category: 'testing',
    usageCount: 0,
    examples: ['/test-integration packages/api/'],
    aliases: ['ti', 'integ', 'integration-test']
  },
  {
    command: '/test-e2e',
    name: 'E2E Tests',
    description: 'End-to-end test scenarios for full system flows',
    category: 'testing',
    usageCount: 0,
    examples: ['/test-e2e examples/'],
    aliases: ['e2e', 'end-to-end', 'system-test']
  },
  {
    command: '/test-coverage',
    name: 'Coverage Analysis',
    description: 'Analyze and improve test coverage to target threshold',
    category: 'testing',
    usageCount: 0,
    examples: ['/test-coverage --threshold 80'],
    aliases: ['cov', 'coverage', 'test-cov']
  },
  
  // Git Workflow
  {
    command: '/commit',
    name: 'Smart Commit',
    description: 'Auto-generate conventional commit message from changes',
    category: 'git',
    usageCount: 0,
    examples: ['/commit', '/commit --all'],
    aliases: ['c', 'cm', 'git-commit', 'save']
  },
  {
    command: '/pr',
    name: 'PR Generator',
    description: 'Generate pull request description from branch changes',
    category: 'git',
    usageCount: 0,
    examples: ['/pr', '/pr --with-demo'],
    aliases: ['pull-request', 'pr-desc', 'merge-request']
  },
  {
    command: '/changelog',
    name: 'Changelog Gen',
    description: 'Generate changelog from git history',
    category: 'git',
    usageCount: 0,
    examples: ['/changelog', '/changelog --since-tag v0.1.0'],
    aliases: ['changelog-gen', 'changes', 'release-notes']
  },
  
  // Documentation
  {
    command: '/docs',
    name: 'Docs Generator',
    description: 'Generate documentation from source code',
    category: 'docs',
    usageCount: 0,
    examples: ['/docs src/', '/docs --format jSDoc'],
    aliases: ['doc', 'generate-docs', 'document']
  },
  {
    command: '/api-docs',
    name: 'API Docs',
    description: 'Generate API documentation from type definitions',
    category: 'docs',
    usageCount: 0,
    examples: ['/api-docs packages/core/'],
    aliases: ['api', 'api-doc', 'type-docs']
  },
  {
    command: '/readme',
    name: 'README Update',
    description: 'Update or generate README.md for project/package',
    category: 'docs',
    usageCount: 0,
    examples: ['/readme', '/readme --section usage'],
    aliases: ['readme-gen', 'md', 'markdown']
  },
  
  // Refactoring
  {
    command: '/refactor',
    name: 'Refactor Code',
    description: 'Safe refactoring with automatic test generation',
    category: 'refactor',
    usageCount: 0,
    examples: ['/refactor src/utils.ts', '/refactor --pattern extract'],
    aliases: ['ref', 'refactor-code', 'clean-code']
  },
  {
    command: '/migrate',
    name: 'Migrate Code',
    description: 'Assist with code migration between versions/frameworks',
    category: 'refactor',
    usageCount: 0,
    examples: ['/migrate --from cjs --to esm', '/migrate --from express --to fastify'],
    aliases: ['mig', 'migration', 'upgrade', 'convert']
  },
  {
    command: '/optimize',
    name: 'Optimize Performance',
    description: 'Performance optimization analysis and suggestions',
    category: 'refactor',
    usageCount: 0,
    examples: ['/optimize src/core/', '/optimize --memory'],
    aliases: ['opt', 'perf', 'performance', 'speed-up']
  },
  
  // Debugging
  {
    command: '/debug',
    name: 'Debug Session',
    description: 'Start intelligent debugging session with root cause analysis',
    category: 'debug',
    usageCount: 0,
    examples: ['/debug', '/debug --error "TypeError..."'],
    aliases: ['dbg', 'debug-session', 'bug-hunt']
  },
  {
    command: '/error-analyze',
    name: 'Error Analyzer',
    description: 'Deep analysis of error messages or log files',
    category: 'debug',
    usageCount: 0,
    examples: ['/error-analyze "EACCES"', '/error-analyze --file error.log'],
    aliases: ['err', 'error', 'error-analysis', 'analyze-error']
  },
  {
    command: '/fix',
    name: 'Auto Fix',
    description: 'Auto-fix identified issues safely with verification',
    category: 'debug',
    usageCount: 0,
    examples: ['/fix', '/fix --dry-run', '/fix --commit'],
    aliases: ['fix-issue', 'auto-fix', 'repair', 'resolve']
  },
  
  // Security
  {
    command: '/security',
    name: 'Security Scan',
    description: 'Security vulnerability scan (OWASP Top 10 + CVEs)',
    category: 'security',
    usageCount: 0,
    examples: ['/security', '/security --severity critical'],
    aliases: ['sec', 'sec-scan', 'vuln', 'security-audit', 'owasp']
  },
  
  // Gauntlet Loop
  {
    command: '/gauntlet',
    name: '🏆 GAUNTLET LOOP',
    description: 'ULTIMATE Builder-Critic quality loop - NEVER SURRENDERS until perfection!',
    category: 'gauntlet',
    usageCount: 0,
    examples: [
      '/gauntlet "Build amazing feature"',
      '/gauntlet --quality never_surrender',
      '/gauntlet --mode tournament'
    ],
    aliases: ['g', 'gaunt', 'loop', 'never-give-up', 'ultimate', 'quality-loop', 'builder-critic']
  },
  
  // Utility
  {
    command: '/help',
    name: 'Help',
    description: 'Show available commands and skills',
    category: 'utility',
    usageCount: 0,
    examples: ['/help', '/help testing'],
    aliases: ['h', '?', 'commands', 'list', 'ls']
  },
  {
    command: '/clear',
    name: 'Clear Context',
    description: 'Clear conversation context hint',
    category: 'utility',
    usageCount: 0,
    examples: ['/clear'],
    aliases: ['cls', 'reset', 'new-chat']
  },
  {
    command: '/compact',
    name: 'Compact Context',
    description: 'Compress context to save tokens while preserving key info',
    category: 'utility',
    usageCount: 0,
    examples: ['/compact', '/compact --keep 5'],
    aliases: ['cmp', 'compress', 'save-tokens', 'token-save']
  },
  {
    command: '/cost',
    name: 'Show Cost',
    description: 'Show token usage and estimated cost for session',
    category: 'utility',
    usageCount: 0,
    examples: ['/cost'],
    aliases: ['$', 'price', 'tokens', 'usage', 'stats']
  },
  {
    command: '/status',
    name: 'Status',
    description: 'Show current session status and agent state',
    category: 'utility',
    usageCount: 0,
    examples: ['/status'],
    aliases: ['st', 'info', 'session-info', 'state']
  }
]

// ============================================================================
// Fuzzy Matching Algorithms
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

/**
 * Calculate similarity ratio (0 to 1)
 */
function similarityRatio(a: string, b: string): number {
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshtein(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Check if query is substring of target (case insensitive)
 */
function hasSubstring(target: string, query: string): boolean {
  return target.toLowerCase().includes(query.toLowerCase())
}

/**
 * Check if query matches start of target
 */
function startsWith(target: string, query: string): boolean {
  return target.toLowerCase().startsWith(query.toLowerCase())
}

/**
 * Calculate acronym match (e.g., "tr" matches "Test Review")
 */
function acronymMatch(target: string, query: string): boolean {
  const words = target.replace(/[^a-zA-Z\s]/g, '').split(/\s+/)
  const acronym = words.map(w => w[0]).join('').toLowerCase()
  return acronym.includes(query.toLowerCase())
}

/**
 * Calculate word-level match (any word in target contains query)
 */
function wordMatch(target: string, query: string): boolean {
  const queryWords = query.toLowerCase().split(/[\s-_]+/)
  const targetLower = target.toLowerCase()
  
  return queryWords.some(qw => 
    targetLower.split(/[\s-_]+/).some(tw => tw.startsWith(qw))
  )
}

// ============================================================================
// Scoring System
// ============================================================================

interface ScoreBreakdown {
  exactMatch: number
  startMatch: number
  substringMatch: number
  aliasMatch: number
  acronymMatch: number
  wordMatch: number
  fuzzyMatch: number
  popularityBonus: number
  recentUsageBonus: number
}

/**
 * Calculate comprehensive match score
 */
function calculateScore(
  query: string, 
  command: Omit<CommandSuggestion, 'score'>,
  config: AutocompleteConfig
): { score: number, breakdown: ScoreBreakdown } {
  const q = query.toLowerCase().trim().replace(/^\//, '')
  const cmdName = command.command.replace(/^\//, '').toLowerCase()
  const cmdDesc = command.description.toLowerCase()
  const cmdAliases = command.aliases.map(a => a.toLowerCase())
  
  const breakdown: ScoreBreakdown = {
    exactMatch: 0,
    startMatch: 0,
    substringMatch: 0,
    aliasMatch: 0,
    acronymMatch: 0,
    wordMatch: 0,
    fuzzyMatch: 0,
    popularityBonus: 0,
    recentUsageBonus: 0
  }
  
  let totalScore = 0
  
  // Exact match (highest weight)
  if (q === cmdName) {
    breakdown.exactMatch = 1.0
    totalScore += 1.0
  }
  
  // Start match (command starts with query)
  if (startsWith(cmdName, q) && q.length > 0) {
    breakdown.startMatch = 0.9 + (q.length / cmdName.length) * 0.1
    totalScore += breakdown.startMatch
  }
  
  // Substring match in command name
  if (hasSubstring(cmdName, q)) {
    breakdown.substringMatch = 0.7
    totalScore += 0.7
  }
  
  // Alias match
  if (config.enableAliases && cmdAliases.some(alias => 
    hasSubstring(alias, q) || startsWith(alias, q)
  )) {
    breakdown.aliasMatch = 0.85
    totalScore += 0.85
  }
  
  // Acronym match
  if (acronymMatch(command.name, q) || acronymMatch(command.command, q)) {
    breakdown.acronymMatch = 0.75
    totalScore += 0.75
  }
  
  // Word match in description or name
  if (wordMatch(`${command.name} ${command.description}`, q)) {
    breakdown.wordMatch = 0.6
    totalScore += 0.6
  }
  
  // Fuzzy match (Levenshtein)
  if (q.length >= 2) {
    const ratio = similarityRatio(cmdName, q)
    if (ratio >= config.fuzzyTolerance) {
      breakdown.fuzzyMatch = ratio * 0.8
      totalScore += breakdown.fuzzyMatch
    }
    
    // Also check against first word of name
    const firstName = command.name.split(' ')[0].toLowerCase()
    const nameRatio = similarityRatio(firstName, q)
    if (nameRatio >= config.fuzzyTolerance && nameRatio > (breakdown.fuzzyMatch / 0.8)) {
      breakdown.fuzzyMatch = Math.max(breakdown.fuzzyMatch, nameRatio * 0.7)
      totalScore += nameRatio * 0.7
    }
  }
  
  // Popularity bonus (frequently used commands rank higher)
  if (config.includeUsageStats && command.usageCount > 0) {
    breakdown.popularityBonus = Math.min(command.usageCount * 0.02, 0.15)
    totalScore += breakdown.popularityBonus
  }
  
  // Recent usage bonus (recently used commands rank higher)
  if (config.includeUsageStats && command.lastUsed) {
    const daysSinceUse = (Date.now() - command.lastUsed.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUse < 7) {
      breakdown.recentUsageBonus = Math.max(0, 0.1 - daysSinceUse * 0.014)
      totalScore += breakdown.recentUsageBonus
    }
  }
  
  // Normalize score to 0-1 range
  totalScore = Math.min(totalScore / 2.5, 1.0)
  
  return { score: totalScore, breakdown }
}

// ============================================================================
// Autocomplete Engine
// ============================================================================

class FuzzyAutocompleteEngine {
  private config: AutocompleteConfig
  private usageDB: Map<string, { count: number, lastUsed: Date }>
  
  constructor(config?: Partial<AutocompleteConfig>) {
    this.config = {
      maxSuggestions: config?.maxSuggestions ?? 8,
      minScoreThreshold: config?.minScoreThreshold ?? 0.3,
      includeUsageStats: config?.includeUsageStats ?? true,
      fuzzyTolerance: config?.fuzzyTolerance ?? 0.7,
      enableAliases: config?.enableAliases ?? true,
      enableLearning: config?.enableLearning ?? true
    }
    this.usageDB = new Map()
    
    // Load usage data from storage (if available)
    this.loadUsageData()
  }
  
  /**
   * Get autocomplete suggestions for query
   */
  suggest(query: string, options?: { category?: CommandCategory }): AutocompleteResult {
    const startTime = performance.now()
    
    const normalizedQuery = query.trim()
    
    // Handle empty query - show popular/recent commands
    if (!normalizedQuery || normalizedQuery === '/') {
      return this.getEmptyQuerySuggestions(startTime)
    }
    
    // Score all commands
    const scored: CommandSuggestion[] = []
    
    for (const cmd of COMMAND_DB) {
      // Filter by category if specified
      if (options?.category && options.category !== 'all' && cmd.category !== options.category) {
        continue
      }
      
      const { score, breakdown } = calculateScore(normalizedQuery, cmd, this.config)
      
      // Apply minimum threshold
      if (score >= this.config.minScoreThreshold) {
        scored.push({
          ...cmd,
          score,
          usageCount: this.usageDB.get(cmd.command)?.count ?? cmd.usageCount,
          lastUsed: this.usageDB.get(cmd.command)?.lastUsed ?? cmd.lastUsed
        })
      }
    }
    
    // Sort by score (descending), then by usage (descending)
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.usageCount - a.usageCount
    })
    
    // Take top N suggestions
    const suggestions = scored.slice(0, this.config.maxSuggestions)
    
    // Check for exact match
    const hasExactMatch = suggestions.some(s => s.score >= 0.99)
    
    const queryTimeMs = performance.now() - startTime
    
    return {
      query: normalizedQuery,
      suggestions,
      hasExactMatch,
      totalMatches: scored.length,
      queryTimeMs
    }
  }
  
  /**
   * Get suggestions for empty query (popular/recent commands)
   */
  private getEmptyQuerySuggestions(startTime: number): AutocompleteResult {
    const sorted = [...COMMAND_DB]
      .sort((a, b) => {
        const aUsage = this.usageDB.get(a.command)?.count ?? 0
        const bUsage = this.usageDB.get(b.command)?.count ?? 0
        return bUsage - aUsage
      })
      .slice(0, this.config.maxSuggestions)
      .map(cmd => ({
        ...cmd,
        score: 1.0, // Full score for empty query suggestions
        usageCount: this.usageDB.get(cmd.command)?.count ?? 0,
        lastUsed: this.usageDB.get(cmd.command)?.lastUsed
      }))
    
    return {
      query: '',
      suggestions: sorted,
      hasExactMatch: false,
      totalMatches: sorted.length,
      queryTimeMs: performance.now() - startTime
    }
  }
  
  /**
   * Record that a command was used (for learning)
   */
  recordUsage(command: string): void {
    if (!this.config.enableLearning) return
    
    const normalizedCmd = command.startsWith('/') ? command : `/${command}`
    const existing = this.usageDB.get(normalizedCmd)
    
    if (existing) {
      existing.count++
      existing.lastUsed = new Date()
    } else {
      this.usageDB.set(normalizedCmd, {
        count: 1,
        lastUsed: new Date()
      })
    }
    
    // Persist usage data
    this.saveUsageData()
  }
  
  /**
   * Get all available commands (for help display)
   */
  getAllCommands(): Omit<CommandSuggestion, 'score'>[] {
    return COMMAND_DB.map(cmd => ({
      ...cmd,
      usageCount: this.usageDB.get(cmd.command)?.count ?? 0,
      lastUsed: this.usageDB.get(cmd.command)?.lastUsed
    }))
  }
  
  /**
   * Get commands by category
   */
  getCommandsByCategory(category: CommandCategory): Omit<CommandSuggestion, 'score'>[] {
    return this.getAllCommands().filter(cmd => cmd.category === category)
  }
  
  /**
   * Get top N most used commands
   */
  getTopCommands(n: number = 5): Omit<CommandSuggestion, 'score'>[] {
    return this.getAllCommands()
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, n)
  }
  
  /**
   * Get recently used commands
   */
  getRecentCommands(n: number = 5): Omit<CommandSuggestion, 'score'>[] {
    return this.getAllCommands()
      .filter(cmd => cmd.lastUsed)
      .sort((a, b) => (b.lastUsed?.getTime() ?? 0) - (a.lastUsed?.getTime() ?? 0))
      .slice(0, n)
  }
  
  /**
   * Load usage data from localStorage/storage
   */
  private loadUsageData(): void {
    try {
      // In browser environment
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem('dsh-autocomplete-usage')
        if (data) {
          const parsed = JSON.parse(data)
          for (const [cmd, stats] of Object.entries(parsed)) {
            this.usageDB.set(cmd, {
              count: (stats as any).count,
              lastUsed: new Date((stats as any).lastUsed)
            })
          }
        }
      }
    } catch {
      // Storage not available, start fresh
    }
  }
  
  /**
   * Save usage data to localStorage/storage
   */
  private saveUsageData(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const data: Record<string, { count: number, lastUsed: string }> = {}
        for (const [cmd, stats] of this.usageDB.entries()) {
          data[cmd] = {
            count: stats.count,
            lastUsed: stats.lastUsed.toISOString()
          }
        }
        localStorage.setItem('dsh-autocomplete-usage', JSON.stringify(data))
      }
    } catch {
      // Storage not available
    }
  }
  
  /**
   * Reset usage statistics
   */
  resetUsageStats(): void {
    this.usageDB.clear()
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('dsh-autocomplete-usage')
    }
  }
  
  /**
   * Export usage data (for backup/sync)
   */
  exportUsageData(): string {
    const data: Record<string, { count: number, lastUsed: string }> = {}
    for (const [cmd, stats] of this.usageDB.entries()) {
      data[cmd] = {
        count: stats.count,
        lastUsed: stats.lastUsed.toISOString()
      }
    }
    return JSON.stringify(data, null, 2)
  }
  
  /**
   * Import usage data (from backup/sync)
   */
  importUsageData(json: string): void {
    try {
      const data = JSON.parse(json)
      for (const [cmd, stats] of Object.entries(data)) {
        this.usageDB.set(cmd, {
          count: (stats as any).count,
          lastUsed: new Date((stats as any).lastUsed)
        })
      }
      this.saveUsageData()
    } catch (e) {
      throw new Error('Invalid usage data format')
    }
  }
}

// ============================================================================
// Web UI Component Integration
// ============================================================================

/**
 * Generate HTML/CSS for autocomplete dropdown (for Web UI integration)
 */
export function generateAutocompleteUI(result: AutocompleteResult): string {
  if (result.suggestions.length === 0) {
    return `
      <div class="autocomplete-dropdown autocomplete-empty">
        <div class="autocomplete-empty-message">
          No commands found for "${result.query}"
        </div>
        <div class="autocomplete-help">
          Type /help for all available commands
        </div>
      </div>
    `
  }
  
  const items = result.suggestions.map((s, index) => {
    const isActive = index === 0 // First item is active by default
    const categoryEmoji = getCategoryEmoji(s.category)
    const scorePercent = Math.round(s.score * 100)
    
    return `
      <div class="autocomplete-item ${isActive ? 'active' : ''}" 
           data-command="${s.command}"
           data-index="${index}"
           role="option"
           aria-selected="${isActive}">
        <div class="autocomplete-item-main">
          <span class="autocomplete-command">${s.command}</span>
          <span class="autocomplete-name">${categoryEmoji} ${s.name}</span>
        </div>
        <div class="autocomplete-description">${s.description}</div>
        <div class="autocomplete-meta">
          ${s.usageCount > 0 ? `<span class="usage-count">🔥 ${s.usageCount} uses</span>` : ''}
          <span class="match-score">${scorePercent}% match</span>
        </div>
      </div>
    `
  }).join('')
  
  return `
    <div class="autocomplete-dropdown" role="listbox">
      ${result.query ? `<div class="autocomplete-query">Results for "${result.query}" (${result.totalMatches} found)</div>` : ''}
      <div class="autocomplete-items">
        ${items}
      </div>
      <div class="autocomplete-footer">
        <span>↑↓ Navigate</span>
        <span>Enter Select</span>
        <span>Esc Close</span>
      </div>
    </div>
  `
}

/**
 * CSS styles for autocomplete dropdown
 */
export const AUTOCOMPLETE_STYLES = `
  .autocomplete-dropdown {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    max-height: 320px;
    overflow-y: auto;
    background: var(--color-bg-primary, #1a1a1a);
    border: 1px solid var(--color-border, #333);
    border-radius: 8px;
    margin-bottom: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
  }

  .autocomplete-query {
    padding: 8px 12px;
    background: var(--color-bg-secondary, #252525);
    color: var(--color-text-secondary, #888);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--color-border, #333);
  }

  .autocomplete-items {
    padding: 4px 0;
  }

  .autocomplete-item {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 2px;
    transition: background 0.15s ease;
    border-left: 3px solid transparent;
  }

  .autocomplete-item:hover,
  .autocomplete-item.active {
    background: var(--color-bg-hover, #2a2a2a);
    border-left-color: var(--color-accent, #007acc);
  }

  .autocomplete-item-main {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .autocomplete-command {
    color: var(--color-accent, #007acc);
    font-family: 'SF Mono', Monaco, monospace;
    font-weight: 600;
    font-size: 13px;
  }

  .autocomplete-name {
    color: var(--color-text-primary, #fff);
    font-weight: 500;
  }

  .autocomplete-description {
    color: var(--color-text-secondary, #888);
    font-size: 12px;
    line-height: 1.3;
  }

  .autocomplete-meta {
    display: flex;
    gap: 12px;
    margin-top: 2px;
  }

  .usage-count,
  .match-score {
    font-size: 10px;
    color: var(--color-text-muted, #666);
  }

  .match-score {
    margin-left: auto;
  }

  .autocomplete-footer {
    display: flex;
    gap: 16px;
    padding: 8px 12px;
    background: var(--color-bg-secondary, #252525);
    border-top: 1px solid var(--color-border, #333);
    font-size: 10px;
    color: var(--color-text-muted, #666);
  }

  .autocomplete-empty {
    padding: 24px 12px;
    text-align: center;
  }

  .autocomplete-empty-message {
    color: var(--color-text-secondary, #888);
    margin-bottom: 8px;
  }

  .autocomplete-help {
    color: var(--color-text-muted, #666);
    font-size: 11px;
  }

  /* Dark mode (default) overrides */
  @media (prefers-color-scheme: light) {
    .autocomplete-dropdown {
      background: #fff;
      border-color: #ddd;
    }
    .autocomplete-query {
      background: #f5f5f5;
      color: #666;
    }
    .autocomplete-item:hover,
    .autocomplete-item.active {
      background: #f0f0f0;
    }
    .autocomplete-command {
      color: #0066cc;
    }
    .autocomplete-name {
      color: #222;
    }
    .autocomplete-description {
      color: #555;
    }
  }
`

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    quality: '✅',
    testing: '🧪',
    git: '🔀',
    docs: '📝',
    refactor: '🔧',
    debug: '🐛',
    security: '🔒',
    gauntlet: '🏆',
    utility: '⚙️'
  }
  return emojis[category] || '📌'
}

// ============================================================================
// Plugin Entry Point
// ============================================================================

// Singleton instance
let engineInstance: FuzzyAutocompleteEngine | null = null

export function getAutocompleteEngine(config?: Partial<AutocompleteConfig>): FuzzyAutocompleteEngine {
  if (!engineInstance) {
    engineInstance = new FuzzyAutocompleteEngine(config)
  }
  return engineInstance
}

export function apply(ctx: Context) {
  const engine = getAutocompleteEngine()
  
  console.log('[dsh-fuzzy-autocomplete] ✅ Initialized')
  console.log(`[dsh-fuzzy-autocomplete] 📊 ${COMMAND_DB.length} commands indexed`)
  console.log(`[dsh-fuzzy-autocomplete] 🔍 Fuzzy matching enabled (threshold: ${engine['config'].minScoreThreshold})`)
  console.log(`[dsh-fuzzy-autocomplete] 📚 Learning mode: ${engine['config'].enableLearning ? 'ON' : 'OFF'}`)
}
