import type { TypertContext, TypertLookup } from '@origin-ai/xhe-typert-protocol'
import type { AgentId } from './types.ts'

/** Host-only live Agent object. */
export class Agent {
  constructor(readonly id: AgentId) {}
}

declare module '@origin-ai/xhe-typert-protocol' {
  interface TypertLookupMap {
    agent: TypertLookup<Agent, AgentId>
  }

  interface TypertContextMap {
    agent: TypertContext<AgentId>
  }
}

export type { AgentId } from './types.ts'
