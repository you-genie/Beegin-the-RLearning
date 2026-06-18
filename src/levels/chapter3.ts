import type { Level } from '../types'

const MAZE_31 = ['H.....', '.####.', '.#....', '.#.##.', '.....F']
const MAZE_32 = ['H....', '.....', '..#..', '.....', '....F']
const MAZE_33 = ['H......', '.####.#', '.#...#.', '.#.#.#.', '.#.#...', '.#.###.', '.....#F']

const DIST_DOCS = [
  { key: 'obs["reached_flower"]', desc: '방금 꽃에 도착했으면 True' },
  { key: 'obs["dist"]', desc: '지금 칸에서 꽃까지의 거리 (벽 우회 포함, 정수)' },
  { key: 'obs["prev_dist"]', desc: '직전 칸에서 꽃까지의 거리 (정수)' },
  { key: 'obs["done"]', desc: '이번 스텝으로 에피소드가 끝나면 True' },
]

export const chapter3: Level[] = [
  {
    id: '3-1', chapter: 3, sublevel: 1,
    title: '너무 멀어요',
    concept: '희소 보상(sparse reward) 문제 · 보상 셰이핑',
    showDemo:
      '꽃이 너무 멀어요. "도착하면 +1"만으로는 벌이 운 좋게 꽃에 닿는 일이 거의 없어서, ' +
      '같은 보상인데도 이번엔 길을 못 배워요(=희소 보상 문제).\n' +
      '꽃에 가까워질 때마다 살짝 힌트 보상을 줘서 길을 안내해 봅시다.',
    codeTemplate: [
      'def reward(obs):',
      '    # 도착하면 +1 (그런데 너무 멀어서 이것만으론 잘 못 배워요)',
      '    if obs["reached_flower"]:',
      '        return 1.0',
      '    # TODO: 꽃에 "가까워지면" 살짝 보상을 주세요',
      '    #   obs["prev_dist"] = 직전 칸 거리,  obs["dist"] = 지금 칸 거리',
      '    return 0.0',
      '',
    ].join('\n'),
    engineConfig: {
      env: { type: 'grid', layout: MAZE_31, deliver: false },
      alpha: 0.4, gamma: 0.95, epsilon: 0.25,
      episodes: 120, maxSteps: 50, seed: 0,
    },
    successThreshold: 0.8,
    hints: [
      '가까워졌다 = 거리가 줄었다 = (prev_dist - dist) 가 양수예요.',
      'return 0.1 * (obs["prev_dist"] - obs["dist"])   (꽃 보상은 위에 그대로 두세요)',
    ],
    recap:
      '🎉 방금 한 게 "보상 셰이핑(reward shaping)"이에요.\n\n' +
      '목표 보상(+1)이 너무 드물면(sparse), 벌이 우연히 거기 닿기 전까지는 배울 신호가 ' +
      '하나도 없어요. 그래서 "가까워지면 +" 같은 보조 보상을 깔아 매 걸음마다 방향을 ' +
      '알려준 거죠.\n\n' +
      '핵심은 "가까워진 만큼"만 줬다는 거예요. 덕분에 제자리걸음엔 0점이라, 벌은 ' +
      '계속 앞으로 나아가야만 점수를 받아요.',
    docs: DIST_DOCS,
  },
  {
    id: '3-2', chapter: 3, sublevel: 2,
    title: '제자리 농사꾼',
    concept: '보상 셰이핑의 함정 · 보상 해킹(reward hacking)',
    showDemo:
      '누군가 "꽃에 가까이 있을수록 매 칸 보너스"를 줬더니... 벌이 꽃 근처에서 빙빙 돌며 ' +
      '보너스만 챙기고 정작 도착은 안 해요! 보상을 "농사(farming)"짓는 거예요.\n' +
      '아래 보상이 바로 그 함정이에요. 고쳐서 벌이 진짜 도착하게 만들어 보세요.',
    codeTemplate: [
      'def reward(obs):',
      '    if obs["reached_flower"]:',
      '        return 1.0',
      '    # 가까이 "있으면" 매 칸 보너스 — 벌이 도착은 안 하고 이것만 빨아먹어요!',
      '    return 0.5 / (obs["dist"] + 1)  # TODO: 이 함정을 고치세요',
      '',
    ].join('\n'),
    engineConfig: {
      env: { type: 'grid', layout: MAZE_32, deliver: false },
      alpha: 0.4, gamma: 0.95, epsilon: 0.25,
      episodes: 300, maxSteps: 60, seed: 1,
    },
    successThreshold: 0.8,
    hints: [
      '"가까이 있으면"(dist) 주면 제자리에서 농사가 돼요. "가까워질 때만"(prev_dist - dist) 주면 제자리는 0점이라 농사가 안 돼요.',
      'return 0.1 * (obs["prev_dist"] - obs["dist"])',
    ],
    recap:
      '🎉 방금 본 게 셰이핑으로 생긴 "보상 해킹(reward hacking)"이에요.\n\n' +
      '"가까이 있으면 보너스"는 가만히 있어도 계속 받을 수 있어서, 벌이 도착을 ' +
      '미루고 보너스만 무한정 farming 했어요.\n\n' +
      '반면 "가까워진 만큼"(prev_dist - dist)은 멈춰 있으면 0이고, 앞으로 간 만큼만 ' +
      '받아요. 이렇게 차이(변화량)로 주는 셰이핑은 농사지을 수 없어요.',
    docs: DIST_DOCS,
  },
  {
    id: '3-3', chapter: 3, sublevel: 3,
    title: '끝없는 미로',
    concept: 'Potential-based shaping · 챕터 종합',
    showDemo:
      '지금까지 중 가장 큰 미로예요. 희소 보상으론 어림도 없죠.\n' +
      '챕터 3에서 배운 안전한 셰이핑을 직접 적용해서, 벌을 끝까지 안내해 보세요!',
    codeTemplate: [
      'def reward(obs):',
      '    if obs["reached_flower"]:',
      '        return 1.0',
      '    # TODO: 앞에서 배운 "가까워진 만큼" 셰이핑을 적용하세요',
      '    return 0.0',
      '',
    ].join('\n'),
    engineConfig: {
      env: { type: 'grid', layout: MAZE_33, deliver: false },
      alpha: 0.4, gamma: 0.95, epsilon: 0.25,
      episodes: 200, maxSteps: 70, seed: 3,
    },
    successThreshold: 0.8,
    hints: [
      '3-1에서 쓴 바로 그 방법이에요.',
      'return 0.1 * (obs["prev_dist"] - obs["dist"])',
    ],
    recap:
      '🎉 챕터 3 완주! 그리고 방금 쓴 "가까워진 만큼" 셰이핑에는 멋진 이름이 있어요 — ' +
      '"포텐셜 기반 셰이핑(potential-based shaping, Ng 1999)".\n\n' +
      '어떤 값 Φ(여기선 -거리)을 정하고 그 변화량만 보상으로 주는 형태인데, 이렇게 하면 ' +
      '학습은 훨씬 빨라지면서도 "진짜 최적 경로"는 절대 바뀌지 않는다는 게 수학적으로 ' +
      '증명돼 있어요. 그래서 농사(reward hacking)도 안 되고 안전하죠.\n\n' +
      '보상만 잘 깔아주면, 거대한 미로도 벌이 알아서 풀어내요. 🐝',
    docs: DIST_DOCS,
  },
]
