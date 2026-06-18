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

export interface GridEnvConfig {
  type: 'grid'
  /** 각 행 문자열. 'H'집 'F'꽃 '#'벽 'W'거미줄 '.'빈칸. 모든 행 길이 동일. */
  layout: string[]
  /** true면 꽃을 딴 뒤 집으로 돌아와야 성공(배달). */
  deliver: boolean
  /** 플레이어가 작성하는 함수. 'reward'(기본) 또는 'state'(상태 설계). */
  playerFn?: 'reward' | 'state'
  /** >0이면 매 스텝 0..K-1 무작위 'noise' 특징을 obs에 추가 (상태 설계 함정용). */
  noiseStates?: number
}

export type EnvConfig = BanditEnvConfig | GridEnvConfig

export interface EngineConfig {
  env: EnvConfig
  epsilon: number
  seed: number
  // bandit 전용
  trainSteps?: number
  evalSteps?: number
  // grid 전용
  alpha?: number
  gamma?: number
  episodes?: number
  maxSteps?: number
}

/** 밴딧 학습 스냅샷 (꽃밭별 추정/선택수). */
export interface BanditSnapshot {
  step: number
  estimates: number[]
  counts: number[]
}

/** 그리드 학습 스냅샷 (칸별 maxQ와 최적 행동). */
export interface GridSnapshot {
  step: number
  values: number[]
  policy: number[]
}

export type Snapshot = BanditSnapshot | GridSnapshot

export interface EngineResult {
  ok: boolean
  error: string | null
  successRate: number
  history: Snapshot[]
  bestArm?: number // bandit
  rollout?: number[] // grid: 탐욕 경로(셀 인덱스)
}

/** reward(obs) 안에서 쓸 수 있는 값 하나에 대한 설명. */
export interface ObsDoc {
  key: string
  desc: string
}

export interface Level {
  id: string
  chapter: number
  sublevel: number
  title: string
  /** 이 레벨에서 배우는 RL 개념 (짧은 라벨). */
  concept: string
  showDemo: string
  codeTemplate: string
  engineConfig: EngineConfig
  successThreshold: number
  hints: string[]
  recap: string
  /** 이 레벨의 reward(obs)에서 쓸 수 있는 obs 키 참고 목록. */
  docs: ObsDoc[]
}
