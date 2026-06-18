import type { Level } from '../types'

const MAZE_41 = ['H...', '.##.', '.##.', '...F']
const MAZE_42 = ['H....', '.###.', '.....', '.###.', '....F']
const MAZE_43 = ['H.....', '.####.', '.#....', '.#.##.', '.....F']

export const chapter4: Level[] = [
  {
    id: '4-1', chapter: 4, sublevel: 1,
    title: '기억해야 할 것',
    concept: '상태(state) 설계 · 마르코프 — 충분한 관측',
    showDemo:
      '이제 보상이 아니라 "에이전트가 무엇을 볼지(상태)"를 직접 설계해요!\n' +
      '벌은 꿀을 따서 🍯집으로 배달해야 해요. 그런데 위치만 보게 했더니, 같은 칸에서 ' +
      '"꽃 따러 갈 때"와 "집에 갈 때"를 구분 못 해 우왕좌왕해요. 무엇을 더 봐야 할까요?',
    codeTemplate: [
      'def state(obs):',
      '    # obs["row"], obs["col"] : 지금 위치',
      '    # obs["carrying"]        : 꿀을 들고 있는지 (True/False)',
      '    # 에이전트가 무엇을 보고 행동을 정할지 정하세요.',
      '    return (obs["row"], obs["col"])  # TODO: 이걸로 충분할까요?',
      '',
    ].join('\n'),
    engineConfig: {
      env: { type: 'grid', layout: MAZE_41, deliver: true, playerFn: 'state' },
      alpha: 0.4, gamma: 0.95, epsilon: 0.2,
      episodes: 400, maxSteps: 50, seed: 0,
    },
    successThreshold: 0.8,
    hints: [
      '같은 칸이라도 "꿀 들고 있을 때"와 "아닐 때"는 완전히 다른 상황이에요.',
      'return (obs["row"], obs["col"], obs["carrying"])',
    ],
    recap:
      '🎉 방금 한 게 "상태(state) 설계"예요.\n\n' +
      '에이전트는 오직 "상태"만 보고 행동을 정해요. 위치만 줬을 땐, 집 근처에서 ' +
      '"빈손(꽃 가야 함)"인지 "꿀 보유(집 가야 함)"인지 구분이 안 돼서 — 같은 상태에 ' +
      '서로 다른 정답이 필요한 "지각적 혼동(perceptual aliasing)"에 빠졌죠.\n\n' +
      '"carrying"을 상태에 넣어 두 상황을 구분해주니 바로 풀렸어요. 행동을 정하는 데 ' +
      '필요한 정보가 상태에 다 들어 있어야 한다 — 이걸 "마르코프 상태"라고 불러요.',
    docs: [
      { key: 'obs["row"]', desc: '지금 있는 줄(세로 위치)' },
      { key: 'obs["col"]', desc: '지금 있는 칸(가로 위치)' },
      { key: 'obs["carrying"]', desc: '꿀을 들고 있으면 True' },
      { key: 'obs["steps"]', desc: '이번 에피소드에서 움직인 걸음 수' },
    ],
  },
  {
    id: '4-2', chapter: 4, sublevel: 2,
    title: '쓸데없는 것은 빼고',
    concept: '상태 공간 · 일반화 — 군더더기 제거',
    showDemo:
      '이번엔 obs에 매 순간 무작위로 바뀌는 "noise(잡음)" 값이 섞여 있어요.\n' +
      '아래처럼 그걸 상태에 넣었더니, 벌이 똑같은 칸을 "매번 처음 보는 곳"으로 여겨서 ' +
      '아무것도 못 배워요! 길찾기에 진짜 필요한 것만 남겨 봅시다.',
    codeTemplate: [
      'def state(obs):',
      '    # obs["noise"] = 매 순간 무작위로 바뀌는, 길찾기와 무관한 값',
      '    # 무관한 걸 넣으면 같은 칸도 매번 다른 상태가 돼버려요!',
      '    return (obs["row"], obs["col"], obs["noise"])  # TODO: 군더더기를 빼세요',
      '',
    ].join('\n'),
    engineConfig: {
      env: { type: 'grid', layout: MAZE_42, deliver: false, playerFn: 'state', noiseStates: 1000 },
      alpha: 0.4, gamma: 0.95, epsilon: 0.2,
      episodes: 200, maxSteps: 40, seed: 0,
    },
    successThreshold: 0.8,
    hints: [
      '"noise"는 길과 아무 상관 없어요. 그걸 빼면 같은 칸은 늘 같은 상태가 돼요.',
      'return (obs["row"], obs["col"])',
    ],
    recap:
      '🎉 핵심은 "작지만 충분한 상태"예요.\n\n' +
      '상태에 무의미한 값(noise)을 넣으면 상태 종류가 폭발해요. 같은 칸인데 noise가 ' +
      '매번 달라서 "처음 보는 상태"가 되고, 배운 게 쌓이질 않죠(상태 공간 폭발).\n\n' +
      '필요한 것(위치)만 남기면 같은 칸은 늘 같은 상태가 되어, 경험이 모이고 일반화돼요. ' +
      '상태 설계는 "필요한 건 넣고(4-1), 쓸데없는 건 빼는(4-2)" 균형이에요.',
    docs: [
      { key: 'obs["row"]', desc: '지금 있는 줄(세로 위치)' },
      { key: 'obs["col"]', desc: '지금 있는 칸(가로 위치)' },
      { key: 'obs["noise"]', desc: '매 순간 무작위로 바뀌는 값 (길찾기와 무관!)' },
      { key: 'obs["steps"]', desc: '이번 에피소드에서 움직인 걸음 수' },
    ],
  },
  {
    id: '4-3', chapter: 4, sublevel: 3,
    title: '직접 다 설계하기',
    concept: '상태 + 보상 동시 설계 (종합)',
    showDemo:
      '이번엔 상태도, 보상도 둘 다 직접 설계해요! 🍯집에서 멀리 떨어진 🌻꽃까지 가서 ' +
      '꿀을 따고 다시 집으로 배달해야 해요.\n' +
      '• 배달을 구분하려면 state에 무엇이 필요할까요?\n' +
      '• 목표가 멀어서 "도착 보상"만으론 못 배워요 — reward에 길 안내를 깔아주세요.',
    codeTemplate: [
      'def state(obs):',
      '    # 배달하려면 무엇을 봐야 할까요? (4-1을 떠올려요)',
      '    return (obs["row"], obs["col"])  # TODO',
      '',
      '',
      'def reward(obs):',
      '    # 목표가 멀어요. 가까워지면 보상을 주세요 (3장의 셰이핑!)',
      '    #   obs["prev_dist_goal"], obs["dist_goal"] : 현재 목표까지의 거리',
      '    if obs["delivered"]:',
      '        return 1.0',
      '    return 0.0  # TODO',
      '',
    ].join('\n'),
    engineConfig: {
      env: { type: 'grid', layout: MAZE_43, deliver: true, playerFn: 'both' },
      alpha: 0.4, gamma: 0.95, epsilon: 0.2,
      episodes: 300, maxSteps: 60, seed: 0,
    },
    successThreshold: 0.8,
    hints: [
      'state에는 carrying을, reward에는 거리 셰이핑을 — 둘 다 있어야 풀려요.',
      'state: return (obs["row"], obs["col"], obs["carrying"])',
      'reward: 위에 더해서  return 0.1 * (obs["prev_dist_goal"] - obs["dist_goal"])',
    ],
    recap:
      '🎉 상태와 보상을 함께 설계해 배달 임무를 풀었어요!\n\n' +
      '하나라도 빠지면 안 됐죠 — carrying 없는 상태로는 "꽃 갈 때/집 갈 때"를 못 가리고, ' +
      '셰이핑 없는 보상으로는 먼 목표를 못 배워요. 둘이 맞물려야 에이전트가 똑똑해져요.\n\n' +
      'RL 설계는 이렇게 "무엇을 보고(state) · 무엇을 보상할지(reward)"를 함께 맞추는 일이에요. ' +
      '레벨이 오를수록 직접 설계하는 부분이 점점 늘어나요. 🐝',
    docs: [
      { key: 'obs["row"], obs["col"]', desc: '(state) 지금 위치' },
      { key: 'obs["carrying"]', desc: '(state) 꿀 보유 여부' },
      { key: 'obs["delivered"]', desc: '(reward) 배달 성공 시 True' },
      { key: 'obs["dist_goal"]', desc: '(reward) 현재 목표까지 거리 (배달 중이면 집까지)' },
      { key: 'obs["prev_dist_goal"]', desc: '(reward) 직전 칸의 목표까지 거리' },
    ],
  },
]
