import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_XHE_HOME_DISPLAY,
  LEGACY_DSH_HOME_DIR_NAME,
  LEGACY_DSH_HOME_DISPLAY,
  XHE_HOME_DIR_NAME,
  canonicalizeWatchPath,
  defaultDshHome,
  dshHomeDisplay,
  dshHomePath,
  expandHomePath,
  legacyDshHome,
  migrateLegacyDshHome,
  resolveDshHome,
} from '@origin-ai/cf-home-paths'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('dsh path helpers', () => {
  it('owns the shared default CodeFusion home directory name', () => {
    expect(XHE_HOME_DIR_NAME).toBe('.cf')
    expect(DEFAULT_XHE_HOME_DISPLAY).toBe('~/.cf')
    expect(defaultDshHome()).toBe(join(homedir(), '.cf'))
    expect(LEGACY_DSH_HOME_DIR_NAME).toBe('.dsh')
    expect(LEGACY_DSH_HOME_DISPLAY).toBe('~/.dsh')
    expect(legacyDshHome()).toBe(join(homedir(), '.dsh'))
  })

  it('migrates a legacy .dsh home into .cf without overwriting existing data', async () => {
    const fakeHome = await mkdtemp(join(tmpdir(), 'xhe-home-migrate-'))
    try {
      const legacy = join(fakeHome, '.dsh')
      const fresh = join(fakeHome, '.cf')
      await mkdir(legacy, { recursive: true })
      await writeFile(join(legacy, 'settings.yaml'), 'migrated: true\n')
      expect(migrateLegacyDshHome(fresh, fakeHome)).toBe('migrated')
      expect(await readFile(join(fresh, 'settings.yaml'), 'utf8')).toBe('migrated: true\n')
      // Second run never overwrites existing CodeFusion data.
      await writeFile(join(fresh, 'settings.yaml'), 'user: true\n')
      expect(migrateLegacyDshHome(fresh, fakeHome)).toBe('fresh')
      expect(await readFile(join(fresh, 'settings.yaml'), 'utf8')).toBe('user: true\n')
    } finally {
      await rm(fakeHome, { recursive: true, force: true })
    }
  })

  it('reports fresh when neither home exists', async () => {
    const fakeHome = await mkdtemp(join(tmpdir(), 'xhe-home-fresh-'))
    try {
      expect(migrateLegacyDshHome(join(fakeHome, '.cf'), fakeHome)).toBe('fresh')
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

  it('resolves explicit path before XHE_HOME and the default', () => {
    const envHome = join(homedir(), 'env-dsh')

    expect(resolveDshHome('/tmp/explicit-dsh', { XHE_HOME: '~/env-dsh' })).toBe(resolve('/tmp/explicit-dsh'))
    expect(resolveDshHome(undefined, { XHE_HOME: '~/env-dsh' })).toBe(envHome)
    expect(resolveDshHome(undefined, {})).toBe(defaultDshHome())
  })

  it('treats an empty or whitespace-only XHE_HOME as unset', () => {
    expect(resolveDshHome(undefined, { XHE_HOME: '' })).toBe(defaultDshHome())
    expect(resolveDshHome(undefined, { XHE_HOME: '   ' })).toBe(defaultDshHome())
  })

  it('joins child segments onto the resolved XHE_HOME', () => {
    vi.stubEnv('XHE_HOME', '~/env-dsh')
    expect(dshHomePath()).toBe(join(homedir(), 'env-dsh'))
    expect(dshHomePath('storages', 'cache')).toBe(join(homedir(), 'env-dsh', 'storages', 'cache'))
  })

  it('labels a resolved home by whether it is the default root', () => {
    expect(dshHomeDisplay(resolve(defaultDshHome()))).toBe('~/.cf')
    expect(dshHomeDisplay('/some/other/root')).toBe('$XHE_HOME')
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
