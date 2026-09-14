import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  '@origin-ai/xhe-api-remotes',
  ['lib/types/index.js', 'lib/types/invariant.js'],
  { hostPhase: true },
)
