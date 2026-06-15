import { describe, it, expect } from 'vitest'
import { isCleared } from './scoring'
import type { EngineResult } from './types'

const base: EngineResult = {
  ok: true, error: null, successRate: 0.9, bestArm: 1, history: [],
}

describe('isCleared', () => {
  it('passes when ok and at/above threshold', () => {
    expect(isCleared(base, 0.8)).toBe(true)
    expect(isCleared({ ...base, successRate: 0.8 }, 0.8)).toBe(true)
  })
  it('fails when below threshold', () => {
    expect(isCleared({ ...base, successRate: 0.5 }, 0.8)).toBe(false)
  })
  it('fails when not ok', () => {
    expect(isCleared({ ...base, ok: false }, 0.8)).toBe(false)
  })
})
