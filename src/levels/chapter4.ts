import type { Level } from '../types'

const MAZE_41 = ['H...', '.##.', '.##.', '...F']
const MAZE_42 = ['H....', '.###.', '.....', '.###.', '....F']

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
]
