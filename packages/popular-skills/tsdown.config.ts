import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/invariant.ts', 
    'src/startup.ts',
    'src/iwin.ts',
    'src/mad.ts',
    'src/byok.ts'
  ],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  dts: true,
  clean: true,
  // Ensure all dependencies are properly resolved
  resolve: {
    conditions: ['node', 'import']
  }
})
