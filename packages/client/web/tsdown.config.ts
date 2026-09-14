import { staticLinked } from '../tsdown.client.ts'

export default staticLinked(
  '@origin-ai/xhe-client-web',
  ['lib/types/index.js', 'lib/types/invariant.js'],
)
