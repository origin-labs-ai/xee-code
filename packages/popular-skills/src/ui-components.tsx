/**
 * DSH Web UI Integration for Popular Skills
 * 
 * Provides React components, hooks, and utilities for integrating
 * the popular skills system into DSH's Web UI.
 * 
 * Features:
 * - Command palette with fuzzy search
 * - Skill browser with categories
 * - Usage statistics dashboard
 * - Gauntlet loop progress viewer
 * - Token optimization status
 * 
 * @module @deepseek-ai/dsh-popular-skills-ui
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { getAutocompleteEngine, type CommandSuggestion } from './fuzzy-autocomplete'
import { getTokenOptimizer, type SkillMetadata } from './token-optimizer'

// ============================================================================
// Types
// ============================================================================

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onSelectCommand: (command: string) => void
  recentCommands?: string[]
}

interface SkillBrowserProps {
  category?: string
  onSkillSelect: (skillId: string) => void
}

interface GauntletProgressProps {
  runId?: string
  isRunning: boolean
  currentIteration?: number
  currentScore?: number
  onAbort?: () => void
}

interface TokenUsageProps {
  showDetails?: boolean
}

// ============================================================================
// Command Palette Component
// ============================================================================

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectCommand,
  recentCommands = []
}) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [categories, setCategories] = useState<string[]>(['all'])
  
  const engine = getAutocompleteEngine()
  
  // Get suggestions on query change
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSuggestions([])
      return
    }
    
    if (query === '') {
      // Show recent + popular when empty
      const recent = recentCommands
        .slice(0, 5)
        .map(cmd => engine.suggest(cmd).suggestions[0])
        .filter(Boolean)
      
      const popular = engine.getTopCommands(5)
      
      setSuggestions([...recent, ...popular].filter(Boolean) as CommandSuggestion[])
    } else {
      const result = engine.suggest(query)
      setSuggestions(result.suggestions)
      setSelectedIndex(0)
    }
  }, [query, isOpen, engine, recentCommands])
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex].command)
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }, [suggestions, selectedIndex, onClose])
  
  const handleSelect = (command: string) => {
    engine.recordUsage(command)
    onSelectCommand(command)
    onClose()
    setQuery('')
  }
  
  const getCategoryEmoji = (category: string): string => {
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
  
  if (!isOpen) return null
  
  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div 
        className="command-palette"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Command Palette"
      >
        {/* Search Input */}
        <div className="palette-search">
          <span className="search-icon">⌘</span>
          <input
            type="text"
            className="search-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            autoComplete="off"
          />
          <kbd className="escape-hint">ESC</kbd>
        </div>
        
        {/* Category Filters */}
        <div className="palette-categories">
          {['all', 'quality', 'testing', 'git', 'docs', 'refactor', 'debug', 'security', 'gauntlet'].map(cat => (
            <button
              key={cat}
              className={`category-btn ${categories.includes(cat) ? 'active' : ''}`}
              onClick={() => {
                if (cat === 'all') {
                  setCategories(['all'])
                } else {
                  setCategories(prev => 
                    prev.includes('all') ? [cat] : 
                    prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                  )
                }
              }}
            >
              {cat === 'all' ? '🌟 All' : `${getCategoryEmoji(cat)} ${cat}`}
            </button>
          ))}
        </div>
        
        {/* Suggestions List */}
        <div className="palette-suggestions">
          {suggestions.length === 0 ? (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <p>No commands found for "{query}"</p>
              <button 
                className="help-btn"
                onClick={() => onSelectCommand('/help')}
              >
                View all commands with /help
              </button>
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <div
                key={suggestion.command}
                className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(suggestion.command)}
                onMouseEnter={() => setSelectedIndex(index)}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <div className="suggestion-main">
                  <span className="command-text">{suggestion.command}</span>
                  <span className="command-name">
                    {getCategoryEmoji(suggestion.category)} {suggestion.name}
                  </span>
                </div>
                <p className="suggestion-desc">{suggestion.description}</p>
                <div className="suggestion-meta">
                  {suggestion.usageCount > 0 && (
                    <span className="usage-badge">🔥 {suggestion.usageCount}</span>
                  )}
                  <span className="match-score">{Math.round(suggestion.score * 100)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="palette-footer">
          <div className="footer-hints">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div className="footer-stats">
            <span>{suggestions.length} commands</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Skill Browser Component
// ============================================================================

export const SkillBrowser: React.FC<SkillBrowserProps> = ({
  category,
  onSkillSelect
}) => {
  const [selectedCategory, setSelectedCategory] = useState(category || 'all')
  const [searchQuery, setSearchQuery] = useState('')
  const optimizer = getTokenOptimizer()
  
  const skills = useMemo(() => {
    let skillsList = optimizer.getAllSkillsMetadata()
    
    if (selectedCategory !== 'all') {
      skillsList = skillsList.filter(s => s.category === selectedCategory)
    }
    
    if (searchQuery) {
      skillsList = optimizer.searchSkills(searchQuery)
    }
    
    return skillsList
  }, [selectedCategory, searchQuery, optimizer])
  
  const categories = [
    { id: 'all', name: 'All Skills', emoji: '🌟', count: 150 },
    { id: 'core', name: 'Core', emoji: '⚡', count: 2 },
    { id: 'frequently', name: 'Frequently Used', emoji: '🔥', count: 5 },
    { id: 'occasionally', name: 'Occasional', emoji: '📋', count: 20 },
    { id: 'rarely', name: 'Rare', emoji: '💎', count: 4 },
    { id: 'gauntlet', name: 'Gauntlet', emoji: '🏆', count: 1 }
  ]
  
  return (
    <div className="skill-browser">
      {/* Header */}
      <div className="browser-header">
        <h2>🧩 Skills Library ({skills.length} skills)</h2>
        <div className="browser-search">
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Categories */}
      <div className="browser-categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`browser-category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span className="cat-emoji">{cat.emoji}</span>
            <span className="cat-name">{cat.name}</span>
            <span className="cat-count">{cat.count}</span>
          </button>
        ))}
      </div>
      
      {/* Skills Grid */}
      <div className="skills-grid">
        {skills.map(skill => (
          <div
            key={skill.id}
            className="skill-card"
            onClick={() => onSkillSelect(skill.id)}
          >
            <div className="skill-card-header">
              <span className="skill-command">{skill.command}</span>
              <span className="skill-priority">{'★'.repeat(Math.ceil(skill.priority / 2))}</span>
            </div>
            <h3 className="skill-name">{skill.name}</h3>
            <p className="skill-description">{skill.description}</p>
            <div className="skill-tags">
              {skill.tags.slice(0, 3).map(tag => (
                <span key={tag} className="skill-tag">{tag}</span>
              ))}
            </div>
            <div className="skill-meta">
              <span className="token-cost">~{skill.estimatedTokens} tokens</span>
              {skill.useCount > 0 && (
                <span className="use-count">Used {skill.useCount}x</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Gauntlet Progress Viewer
// ============================================================================

export const GauntletProgressViewer: React.FC<GauntletProgressProps> = ({
  runId,
  isRunning,
  currentIteration = 0,
  currentScore = 0,
  onAbort
}) => {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [scoreHistory, setScoreHistory] = useState<number[]>([])
  
  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])
  
  // Track score history
  useEffect(() => {
    if (currentScore > 0) {
      setScoreHistory(prev => [...prev, currentScore])
    }
  }, [currentScore])
  
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const getScoreColor = (score: number): string => {
    if (score >= 9.5) return '#FFD700' // Gold
    if (score >= 8.5) return '#C0C0C0' // Silver
    if (score >= 7.5) return '#CD7F32' // Bronze
    if (score >= 6) return '#4CAF50' // Green
    if (score >= 4) return '#FF9800' // Orange
    return '#F44336' // Red
  }
  
  return (
    <div className="gauntlet-progress">
      <div className="gauntlet-header">
        <div className="gauntlet-title">
          <span className="gauntlet-icon">🏆</span>
          <h3>Gauntlet Loop</h3>
          {isRunning && <span className="running-badge">RUNNING</span>}
        </div>
        {onAbort && (
          <button className="abort-btn" onClick={onAbort}>
            ⏹ Stop
          </button>
        )}
      </div>
      
      {/* Stats Grid */}
      <div className="gauntlet-stats">
        <div className="stat-item">
          <span className="stat-label">Iteration</span>
          <span className="stat-value">#{currentIteration}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Current Score</span>
          <span className="stat-value" style={{ color: getScoreColor(currentScore) }}>
            {currentScore.toFixed(2)}/10
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Elapsed</span>
          <span className="stat-value">{formatTime(elapsedTime)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Best Score</span>
          <span className="stat-value">
            {scoreHistory.length > 0 ? Math.max(...scoreHistory).toFixed(2) : '-'}
          </span>
        </div>
      </div>
      
      {/* Score Progress Bar */}
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill"
          style={{ 
            width: `${currentScore * 10}%`,
            backgroundColor: getScoreColor(currentScore)
          }}
        />
        <div className="progress-bar-labels">
          <span>0</span>
          <span>PASS (7.5)</span>
          <span>GOOD (8.5)</span>
          <span>GREAT (9.5)</span>
          <span>PERFECT (10)</span>
        </div>
      </div>
      
      {/* Score History Graph (Mini) */}
      {scoreHistory.length > 1 && (
        <div className="score-history">
          <h4>Score Trend</h4>
          <div className="mini-chart">
            {scoreHistory.map((score, i) => (
              <div
                key={i}
                className="chart-point"
                style={{
                  bottom: `${score * 10}%`,
                  left: `${(i / (scoreHistory.length - 1)) * 100}%`,
                  backgroundColor: getScoreColor(score)
                }}
                title={`#${i + 1}: ${score.toFixed(2)}`}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Messages */}
      <div className="gauntlet-messages">
        {isRunning && currentIteration === 0 && (
          <p className="message info">Initializing gauntlet loop...</p>
        )}
        {!isRunning && currentIteration > 0 && currentScore >= 9.5 && (
          <p className="message victory">🎉 VICTORY! Quality bar achieved!</p>
        )}
        {!isRunning && currentIteration > 0 && currentScore < 9.5 && (
          <p className="message stopped">⏸ Loop stopped. Best score: {Math.max(...scoreHistory).toFixed(2)}</p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Token Usage Dashboard
// ============================================================================

export const TokenUsageDashboard: React.FC<TokenUsageProps> = ({ 
  showDetails = false 
}) => {
  const optimizer = getTokenOptimizer()
  const [stats, setStats] = useState<any>(null)
  
  useEffect(() => {
    const budgetStatus = optimizer.getBudgetStatus()
    const usageStats = optimizer.getUsageStats()
    setStats({ budget: budgetStatus, usage: usageStats })
  }, [optimizer])
  
  if (!stats) return <div>Loading token stats...</div>
  
  const { budget, usage } = stats
  
  const usagePercent = ((budget.used / budget.totalBudget) * 100).toFixed(1)
  
  return (
    <div className="token-dashboard">
      <div className="dashboard-header">
        <h3>💰 Token Usage</h3>
        <span className={`usage-indicator ${
          parseFloat(usagePercent) > 80 ? 'warning' : 
          parseFloat(usagePercent) > 95 ? 'critical' : 'ok'
        }`}>
          {usagePercent}%
        </span>
      </div>
      
      {/* Main Progress */}
      <div className="token-progress">
        <div 
          className="token-progress-fill"
          style={{ width: `${usagePercent}%` }}
        />
      </div>
      
      <div className="token-breakdown">
        <div className="breakdown-row">
          <span className="breakdown-label">Used</span>
          <span className="breakdown-value">{budget.used.toLocaleString()}</span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Available</span>
          <span className="breakdown-value">{budget.available.toLocaleString()}</span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Reserved (Core)</span>
          <span className="breakdown-value">{budget.reserved.toLocaleString()}</span>
        </div>
        <div className="breakdown-row total">
          <span className="breakdown-label">Total Budget</span>
          <span className="breakdown-value">{budget.totalBudget.toLocaleString()}</span>
        </div>
      </div>
      
      {/* Category Breakdown */}
      <div className="category-breakdown">
        <h4>Loaded by Category</h4>
        <div className="category-items">
          <div className="category-item">
            <span className="cat-dot core"></span>
            <span>Core</span>
            <span className="count">{budget.coreLoaded}</span>
          </div>
          <div className="category-item">
            <span className="cat-dot frequently"></span>
            <span>Frequently</span>
            <span className="count">{budget.frequentlyLoaded}</span>
          </div>
          <div className="category-item">
            <span className="cat-dot occasionally"></span>
            <span>Occasional</span>
            <span className="count">{budget.occasionallyLoaded}</span>
          </div>
          <div className="category-item">
            <span className="cat-dot rarely"></span>
            <span>Rarely</span>
            <span className="count">{budget.rarelyLoaded}</span>
          </div>
          <div className="category-item">
            <span className="cat-dot gauntlet"></span>
            <span>Gauntlet</span>
            <span className="count">{budget.gauntletLoaded}</span>
          </div>
        </div>
      </div>
      
      {/* Top Skills (if details requested) */}
      {showDetails && (
        <div className="top-skills">
          <h4>Most Used Skills</h4>
          {usage.topSkills?.map((skill: any, i: number) => (
            <div key={skill.id} className="top-skill-item">
              <span className="rank">#{i + 1}</span>
              <span className="skill-name">{skill.name}</span>
              <span className="skill-uses">{skill.count} uses</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// CSS Styles (Inline for easy integration)
// ============================================================================

export const POPULAR_SKILLS_CSS = `
/* Command Palette */
.command-palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 10000;
}

.command-palette {
  width: 640px;
  max-height: 70vh;
  background: var(--color-bg-primary, #1a1a1a);
  border: 1px solid var(--color-border, #333);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.palette-search {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--color-border, #333);
  gap: 12px;
}

.search-icon {
  font-size: 18px;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text-primary, #fff);
  font-size: 16px;
  font-family: inherit;
}

.escape-hint {
  padding: 4px 8px;
  background: var(--color-bg-secondary, #252525);
  border-radius: 4px;
  font-size: 11px;
  color: var(--color-text-muted, #666);
}

.palette-categories {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-border, #333);
  overflow-x: auto;
}

.category-btn {
  padding: 4px 10px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary, #888);
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition: all 0.15s;
}

.category-btn.active {
  background: var(--color-accent, #007acc);
  color: white;
}

.category-btn:hover:not(.active) {
  background: var(--color-bg-hover, #2a2a2a);
}

.palette-suggestions {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.suggestion-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  border-left: 3px solid transparent;
}

.suggestion-item:hover,
.suggestion-item.selected {
  background: var(--color-bg-hover, #2a2a2a);
  border-left-color: var(--color-accent, #007acc);
}

.suggestion-main {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.command-text {
  color: var(--color-accent, #007acc);
  font-family: 'SF Mono', Monaco, monospace;
  font-weight: 600;
  font-size: 14px;
}

.command-name {
  color: var(--color-text-primary, #fff);
  font-weight: 500;
  font-size: 14px;
}

.suggestion-desc {
  color: var(--color-text-secondary, #888);
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
}

.suggestion-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
}

.usage-badge {
  font-size: 11px;
  color: var(--color-text-muted, #666);
}

.match-score {
  font-size: 11px;
  color: var(--color-accent, #007acc);
  font-weight: 500;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
}

.no-results-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.help-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: var(--color-accent, #007acc);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.palette-footer {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--color-bg-secondary, #252525);
  border-top: 1px solid var(--color-border, #333);
  font-size: 11px;
  color: var(--color-text-muted, #666);
}

.footer-hints {
  display: flex;
  gap: 16px;
}

/* Skill Browser */
.skill-browser {
  padding: 20px;
}

.browser-header {
  margin-bottom: 20px;
}

.browser-header h2 {
  margin: 0 0 12px 0;
  color: var(--color-text-primary, #fff);
}

.browser-search input {
  width: 100%;
  padding: 10px 14px;
  background: var(--color-bg-secondary, #252525);
  border: 1px solid var(--color-border, #333);
  border-radius: 8px;
  color: var(--color-text-primary, #fff);
  font-size: 14px;
  outline: none;
}

.browser-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.browser-category-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid var(--color-border, #333);
  background: transparent;
  color: var(--color-text-secondary, #888);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}

.browser-category-btn.active {
  background: var(--color-accent, #007acc);
  border-color: var(--color-accent, #007acc);
  color: white;
}

.cat-count {
  opacity: 0.6;
  font-size: 11px;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.skill-card {
  padding: 16px;
  background: var(--color-bg-secondary, #252525);
  border: 1px solid var(--color-border, #333);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.skill-card:hover {
  border-color: var(--color-accent, #007acc);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.skill-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.skill-command {
  color: var(--color-accent, #007acc);
  font-family: monospace;
  font-weight: 600;
  font-size: 13px;
}

.skill-priority {
  color: #FFD700;
  font-size: 12px;
}

.skill-name {
  margin: 0 0 6px 0;
  color: var(--color-text-primary, #fff);
  font-size: 15px;
  font-weight: 600;
}

.skill-description {
  margin: 0 0 10px 0;
  color: var(--color-text-secondary, #888);
  font-size: 12px;
  line-height: 1.4;
}

.skill-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.skill-tag {
  padding: 2px 8px;
  background: var(--color-bg-primary, #1a1a1a);
  border-radius: 10px;
  font-size: 10px;
  color: var(--color-text-muted, #666);
}

.skill-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--color-text-muted, #666);
}

/* Gauntlet Progress */
.gauntlet-progress {
  padding: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #333;
  border-radius: 12px;
}

.gauntlet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.gauntlet-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #fff;
  font-size: 18px;
}

.gauntlet-icon {
  font-size: 24px;
}

.running-badge {
  padding: 4px 10px;
  background: #4CAF50;
  color: white;
  border-radius: 12px;
  font-size: 11px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.abort-btn {
  padding: 6px 14px;
  background: #F44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.abort-btn:hover {
  background: #D32F2F;
}

.gauntlet-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.progress-bar-container {
  position: relative;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 12px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.progress-bar-labels {
  position: relative;
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #888;
  padding: 0 4px;
}

.score-history {
  margin-top: 16px;
}

.score-history h4 {
  margin: 0 0 8px 0;
  color: #ccc;
  font-size: 12px;
}

.mini-chart {
  position: relative;
  height: 60px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}

.chart-point {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translate(-50%, 50%);
  transition: all 0.2s;
}

.gauntlet-messages {
  margin-top: 16px;
}

.message {
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  margin: 0;
}

.message.info {
  background: rgba(33, 150, 243, 0.2);
  color: #64B5F6;
}

.message.victory {
  background: rgba(76, 175, 80, 0.2);
  color: #81C784;
  font-weight: 600;
}

.message.stopped {
  background: rgba(255, 152, 0, 0.2);
  color: #FFB74D;
}

/* Token Dashboard */
.token-dashboard {
  padding: 16px;
  background: var(--color-bg-secondary, #252525);
  border: 1px solid var(--color-border, #333);
  border-radius: 10px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.dashboard-header h3 {
  margin: 0;
  color: var(--color-text-primary, #fff);
  font-size: 16px;
}

.usage-indicator {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.usage-indicator.ok {
  background: #4CAF50;
  color: white;
}

.usage-indicator.warning {
  background: #FF9800;
  color: white;
}

.usage-indicator.critical {
  background: #F44336;
  color: white;
}

.token-progress {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.token-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #FF9800, #F44336);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.token-breakdown {
  margin-bottom: 16px;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  color: var(--color-text-secondary, #888);
}

.breakdown-row.total {
  border-top: 1px solid var(--color-border, #333);
  margin-top: 6px;
  padding-top: 12px;
  font-weight: 600;
  color: var(--color-text-primary, #fff);
}

.breakdown-value {
  font-family: monospace;
}

.category-breakdown h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary, #fff);
  font-size: 13px;
}

.category-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-secondary, #888);
}

.cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.cat-dot.core { background: #4CAF50; }
.cat-dot.frequently { background: #2196F3; }
.cat-dot.occasionally { background: #FF9800; }
.cat-dot.rarely { background: #9C27B0; }
.cat-dot.gauntlet { background: #FFD700; }

.count {
  margin-left: auto;
  font-weight: 600;
  color: var(--color-text-primary, #fff);
}

.top-skills {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border, #333);
}

.top-skills h4 {
  margin: 0 0 10px 0;
  color: var(--color-text-primary, #fff);
  font-size: 13px;
}

.top-skill-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  font-size: 12px;
}

.rank {
  font-weight: 700;
  color: var(--color-accent, #007acc);
  min-width: 24px;
}

.top-skill-item .skill-name {
  flex: 1;
  color: var(--color-text-primary, #fff);
}

.skill-uses {
  color: var(--color-text-muted, #666);
}
`

// ============================================================================
// Exports
// ============================================================================

export default {
  CommandPalette,
  SkillBrowser,
  GauntletProgressViewer,
  TokenUsageDashboard,
  POPULAR_SKILLS_CSS
}
