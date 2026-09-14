#!/usr/bin/env node
// Scope rename: @origin-ai/cf -> @origin-ai/cf (+ related renames).
// Usage: node scripts/rename-scope.mjs --apply | --preview
// Two-phase: preview lists every change, apply writes files.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const APPLY = process.argv.includes('--apply')

const SKIP_DIRS = new Set(['.git', 'node_modules', '.dsh-build', 'dist', 'dist-exe', '.artifacts', '__pycache__', '.pytest_cache', '.agents'])
const SKIP_FILES = new Set(['pnpm-lock.yaml'])
const TEXT_EXTS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.yml', '.yaml', '.md', '.mts', '.cts', '.css', '.html', '.toml', '.py', '.sh', '.ps1', '.txt', '.svg'])

const REPLACEMENTS = [
  // npm scope + subpath imports (longest first)
  ['@origin-ai/cf-', '@origin-ai/cf-'],
  ['@origin-ai/cf/', '@origin-ai/cf/'],
  // bare root package name (exact, not followed by - or / handled above)
  ['"@origin-ai/cf"', '"@origin-ai/cf"'],
  ["'@origin-ai/cf'", "'@origin-ai/cf'"],
  ['(@origin-ai/cf)', '(@origin-ai/cf)'],
  ['`@origin-ai/cf`', '`@origin-ai/cf`'],
  [' @origin-ai/cf ', ' @origin-ai/cf '],
  ['@origin-ai/cf', '@origin-ai/cf'],
  // node_modules install paths
  ['node_modules/@origin-ai/cf/', 'node_modules/@origin-ai/cf/'],
  ['node_modules/@origin-ai/cf"', 'node_modules/@origin-ai/cf"'],
  // tsconfig path keys are covered by the - rule; wildcard:
  ['"@origin-ai/cf/*"', '"@origin-ai/cf/*"'],
  ["'@origin-ai/cf/*'", "'@origin-ai/cf/*'"],
]

let filesChanged = 0
let totalReplacements = 0
const changedFiles = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full, { throwIfNoEntry: false })
    if (!stat) continue
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue
      walk(full)
    } else {
      if (SKIP_FILES.has(entry)) continue
      const dot = entry.lastIndexOf('.')
      const ext = dot >= 0 ? entry.slice(dot) : ''
      if (!TEXT_EXTS.has(ext) && ext !== '') continue
      if (ext === '' && !['Dockerfile', 'Makefile', 'lefthook.yml'].includes(entry)) {
        // extensionless: only process known filenames
        if (!['pnpm-workspace.yaml', '.npmrc', '.env.example'].includes(entry)) continue
      }
      processFile(full)
    }
  }
}

function processFile(full) {
  let content
  try {
    content = readFileSync(full, 'utf8')
  } catch {
    return
  }
  // skip binary
  if (content.includes('\0')) return
  let next = content
  let count = 0
  for (const [from, to] of REPLACEMENTS) {
    if (next.includes(from)) {
      const parts = next.split(from)
      count += parts.length - 1
      next = parts.join(to)
    }
  }
  if (count > 0) {
    totalReplacements += count
    filesChanged++
    changedFiles.push(`${relative(ROOT, full)} (${count})`)
    if (APPLY) writeFileSync(full, next)
  }
}

walk(ROOT)

console.log(APPLY ? 'APPLIED' : 'PREVIEW')
console.log(`files: ${filesChanged}, replacements: ${totalReplacements}`)
for (const f of changedFiles.slice(0, 100)) console.log('  ' + f)
if (changedFiles.length > 100) console.log(`  ... +${changedFiles.length - 100} more`)
