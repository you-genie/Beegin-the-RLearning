import type { EngineResult } from './types'

export function isCleared(result: EngineResult, threshold: number): boolean {
  return result.ok && result.successRate >= threshold
}
