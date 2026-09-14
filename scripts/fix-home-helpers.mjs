#!/usr/bin/env node
// Fix-forward: dsh home helpers -> cf helpers (clean break, no shim).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const APPLY = process.argv.includes('--apply')
const SKIP = new Set(['.git', 'node_modules', '.agents', 'archive', 'dist', 'dist-exe', '.artifacts', '__pycache__', '.pytest_cache', 'lib'])
const EXTS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.yml', '.yaml', '.md'])
const NAMES = [
  'migrateLegacyCfHome',
  'resolveCfHome',
  'defaultCfHome',
  'cfHomeDisplay',
  'cfHomePath',
  'legacyCfHome',
]
// word-boundary replace, longest first
const RES = NAMES.map(n => [n, n.replace(/DshHome/g, 'CfHome').replace(/^dshHome/, 'cfHome').replace(/legacyCfHome/, 'legacyCfHome')])
// fix the lower-first cases explicitly
const MAP = new Map([
  ['migrateLegacyCfHome', 'migrateLegacyCfHome'],
  ['resolveCfHome', 'resolveCfHome'],
  ['defaultCfHome', 'defaultCfHome'],
  ['cfHomeDisplay', 'cfHomeDisplay'],
  ['cfHomePath', 'cfHomePath'],
  ['legacyCfHome', 'legacyCfHome'],
])
let files = 0, reps = 0
const changed = []
function walk(dir) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e)
    const s = statSync(f, { throwIfNoEntry: false })
    if (!s) continue
    if (s.isDirectory()) {
      if (SKIP.has(e)) continue
      walk(f)
      continue
    }
    if (f.endsWith('pnpm-lock.yaml')) continue
    const dot = e.lastIndexOf('.')
    if (dot < 0 || !EXTS.has(e.slice(dot))) continue
    let c
    try { c = readFileSync(f, 'utf8') } catch { continue }
    if (c.includes('\0')) continue
    let n = c, cnt = 0
    for (const [from, to] of MAP) {
      if (n.includes(from)) {
        // word-boundary: only when not part of a longer identifier (all ours are camelCase-complete, so split/join is safe)
        const parts = n.split(from)
        // guard: skip if followed/preceded by alnum (would be a longer identifier)
        let safe = parts[0]
        for (let i = 1; i < parts.length; i++) {
          const prev = safe.slice(-1), next = (parts[i] ?? '').slice(0, 1)
          if (/[A-Za-z0-9_$]/.test(prev) || /[A-Za-z0-9_$]/.test(next)) { safe += from + parts[i]; continue }
          cnt++
          safe += to + parts[i]
        }
        n = safe
      }
    }
    if (cnt > 0) {
      files++; reps += cnt
      changed.push(`${f.slice(ROOT.length + 1)} (${cnt})`)
      if (APPLY) writeFileSync(f, n)
    }
  }
}
walk(ROOT)
console.log(APPLY ? 'APPLIED' : 'PREVIEW')
console.log(`files: ${files}, replacements: ${reps}`)
for (const l of changed.slice(0, 60)) console.log('  ' + l)
if (changed.length > 60) console.log(`  ... +${changed.length - 60} more`)
