import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_CF_HOME_DISPLAY,
  LEGACY_DSH_HOME_DIR_NAME,
  LEGACY_DSH_HOME_DISPLAY,
  CF_HOME_DIR_NAME,
  canonicalizeWatchPath,
  defaultCfHome,
  cfHomeDisplay,
  cfHomePath,
  expandHomePath,
  legacyCfHome,
  migrateLegacyCfHome,
  resolveCfHome,
} from '@origin-ai/cf-home-paths'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('dsh path helpers', () => {
  it('owns the shared default CodeFusion home directory name', () => {
    expect(CF_HOME_DIR_NAME).toBe('.cf')
    expect(DEFAULT_CF_HOME_DISPLAY).toBe('~/.cf')
    expect(defaultCfHome()).toBe(join(homedir(), '.cf'))
    expect(LEGACY_DSH_HOME_DIR_NAME).toBe('.dsh')
    expect(LEGACY_DSH_HOME_DISPLAY).toBe('~/.dsh')
    expect(legacyCfHome()).toBe(join(homedir(), '.dsh'))
  })

  it('migrates a legacy .dsh home into .cf without overwriting existing data', async () => {
    const fakeHome = await mkdtemp(join(tmpdir(), 'xhe-home-migrate-'))
    try {
      const legacy = join(fakeHome, '.dsh')
      const fresh = join(fakeHome, '.cf')
      await mkdir(legacy, { recursive: true })
      await writeFile(join(legacy, 'settings.yaml'), 'migrated: true\n')
      expect(migrateLegacyCfHome(fresh, fakeHome)).toBe('migrated')
      expect(await readFile(join(fresh, 'settings.yaml'), 'utf8')).toBe('migrated: true\n')
      // Second run never overwrites existing CodeFusion data.
      await writeFile(join(fresh, 'settings.yaml'), 'user: true\n')
      expect(migrateLegacyCfHome(fresh, fakeHome)).toBe('fresh')
      expect(await readFile(join(fresh, 'settings.yaml'), 'utf8')).toBe('user: true\n')
    } finally {
      await rm(fakeHome, { recursive: true, force: true })
    }
  })

  it('reports fresh when neither home exists', async () => {
    const fakeHome = await mkdtemp(join(tmpdir(), 'xhe-home-fresh-'))
    try {
      expect(migrateLegacyCfHome(join(fakeHome, '.cf'), fakeHome)).toBe('fresh')
    } finally {
      await rm(fakeHome, { recursive: true, force: true })
    }
  })

  it('expands tilde paths without changing non-tilde paths', () => {
    expect(expandHomePath('~')).toBe(homedir())
    expect(expandHomePath('~/.dsh')).toBe(join(homedir(), '.dsh'))
    expect(expandHomePath('~\\.dsh')).toBe(join(homedir(), '.dsh'))
    expect(expandHomePath('/tmp/.dsh')).toBe('/tmp/.dsh')
    expect(expandHomePath('~other/.dsh')).toBe('~other/.dsh')
  })

  it('resolves explicit path before CF_HOME and the default', () => {
    const envHome = join(homedir(), 'env-dsh')

    expect(resolveCfHome('/tmp/explicit-dsh', { CF_HOME: '~/env-dsh' })).toBe(resolve('/tmp/explicit-dsh'))
    expect(resolveCfHome(undefined, { CF_HOME: '~/env-dsh' })).toBe(envHome)
    expect(resolveCfHome(undefined, {})).toBe(defaultCfHome())
  })

  it('treats an empty or whitespace-only CF_HOME as unset', () => {
    expect(resolveCfHome(undefined, { CF_HOME: '' })).toBe(defaultCfHome())
    expect(resolveCfHome(undefined, { CF_HOME: '   ' })).toBe(defaultCfHome())
  })

  it('joins child segments onto the resolved CF_HOME', () => {
    vi.stubEnv('CF_HOME', '~/env-dsh')
    expect(cfHomePath()).toBe(join(homedir(), 'env-dsh'))
    expect(cfHomePath('storages', 'cache')).toBe(join(homedir(), 'env-dsh', 'storages', 'cache'))
  })

  it('labels a resolved home by whether it is the default root', () => {
    expect(cfHomeDisplay(resolve(defaultCfHome()))).toBe('~/.cf')
    expect(cfHomeDisplay('/some/other/root')).toBe('$CF_HOME')
  })

  it('canonicalizes a watcher ancestor while preserving a missing suffix', async () => {
    const root = await mkdtemp(join(tmpdir(), 'xhe-watch-path-'))
    const target = join(root, 'target')
    const alias = join(root, 'alias')
    try {
      await mkdir(target)
      await symlink(target, alias, process.platform === 'win32' ? 'junction' : 'dir')
      await expect(canonicalizeWatchPath(join(alias, 'later', 'config.yml'))).resolves.toBe(
        join(await realpath(target), 'later', 'config.yml'),
      )
      const file = join(root, 'file')
      await writeFile(file, 'not a directory')
      await expect(canonicalizeWatchPath(join(file, 'child'))).rejects.toMatchObject({ code: 'ENOTDIR' })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
