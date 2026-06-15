export interface ArmConfig {
  mean: number
  std: number
  label: string
  emoji: string
}

export interface BanditEnvConfig {
  type: 'bandit'
  arms: ArmConfig[]
}

export type EnvConfig = BanditEnvConfig

export interface EngineConfig {
  env: EnvConfig
  trainSteps: number
  evalSteps: number
  epsilon: number
  seed: number
}

export interface Snapshot {
  step: number
  estimates: number[]
  counts: number[]
}

export interface EngineResult {
  ok: boolean
  error: string | null
  successRate: number
  bestArm: number
  history: Snapshot[]
}

export interface Level {
  id: string
  chapter: number
  sublevel: number
  title: string
  showDemo: string
  codeTemplate: string
  engineConfig: EngineConfig
  successThreshold: number
  hints: string[]
  recap: string
}
