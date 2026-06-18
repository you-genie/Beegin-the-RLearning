import type { Level } from '../types'

const MAZE = ['H...', '.##.', '.##.', '...F']

export const chapter2: Level[] = [
  {
    id: '2-1', chapter: 2, sublevel: 1,
    title: '꽃까지 가는 길',
    concept: 'Q-learning · 가치가 목표에서 번지는 TD 학습',
    showDemo:
      '이제 벌이 격자 미로를 돌아다녀요. 🏠집에서 출발해 🌸꽃까지 가야 해요.\n' +
      '아직은 아무 방향이나 무작위로 헤매고 있네요. 목표에 도착하면 보상을 줘서 길을 배우게 합시다!',
    codeTemplate: [
      'def reward(obs):',
      '    # obs["reached_flower"] : 방금 꽃에 도착했으면 True',
      '    # 꽃에 도착하면 +1 을 주도록 만들어 보세요!',
      '    return 0.0  # TODO: 이 줄을 고쳐보세요',
      '',
    ].join('\n'),
    engineConfig: {
      env: { type: 'grid', layout: MAZE, deliver: false },
      alpha: 0.3, gamma: 0.95, epsilon: 0.2,
      episodes: 600, maxSteps: 40, seed: 0,
    },
    successThreshold: 0.8,
    hints: [
      '목표(꽃)에 도착한 순간에만 보상을 주면 돼요.',
      'return 1.0 if obs["reached_flower"] else 0.0',
    ],
    recap:
      '🎉 칸 색이 꽃에서부터 점점 번지는 게 보였죠? 그 밝기가 바로 "Q값"이에요.\n\n' +
      'Q값은 "이 칸에서 출발하면 앞으로 보상을 얼마나 받을 수 있나"의 점수예요. ' +
      '꽃 바로 옆 칸은 곧 보상을 받으니 높고, 멀수록 낮아요. 학습은 이걸 ' +
      '한 칸씩 이웃에게 전파해요(시간차 학습, TD): "내 옆 칸이 좋으면 나도 좀 좋다."\n\n' +
      '각 칸에서 Q값이 가장 높은 이웃으로 향한 화살표 = 정책(policy), 즉 길이에요. ' +
      '우리는 꽃에 +1만 줬을 뿐, 경로는 에이전트가 스스로 그렸어요.',
    docs: [
      { key: 'obs["reached_flower"]', desc: '방금 꽃에 도착했으면 True' },
      { key: 'obs["moved"]', desc: '이번에 실제로 움직였으면 True (벽에 막히면 False)' },
      { key: 'obs["steps"]', desc: '이번 에피소드에서 움직인 걸음 수' },
      { key: 'obs["done"]', desc: '이번 스텝으로 에피소드가 끝나면 True' },
    ],
  },
  {
    id: '2-2', chapter: 2, sublevel: 2,
    title: '집까지 배달',
    concept: '순차적 의사결정 · 다단계 목표 · 상태(state)',
    showDemo:
      '벌이 꽃은 잘 찾는데, 꿀만 따고 끝내버려요. 진짜 임무는 꿀을 들고 🏠집으로 돌아오는 거예요!\n' +
      '꽃을 따면 obs["carrying"]가 True가 되고, 들고 집에 오면 obs["delivered"]가 True가 돼요.',
    codeTemplate: [
      'def reward(obs):',
      '    # obs["delivered"] : 꿀을 들고 집(H)에 돌아오면 True',
      '    # 배달에 성공하면 보상을 주세요!',
      '    return 0.0  # TODO: 이 줄을 고쳐보세요',
      '',
    ].join('\n'),
    engineConfig: {
      env: { type: 'grid', layout: MAZE, deliver: true },
      alpha: 0.3, gamma: 0.95, epsilon: 0.2,
      episodes: 900, maxSteps: 50, seed: 1,
    },
    successThreshold: 0.8,
    hints: [
      '배달 성공(obs["delivered"])에만 보상을 주면 돼요.',
      'return 1.0 if obs["delivered"] else 0.0',
    ],
    recap:
      '🎉 "꽃 따기 → 집에 오기" 두 단계짜리 임무를, 배달 성공 때 주는 보상 하나만으로 풀었어요.\n\n' +
      '핵심은 "상태(state)"예요. 같은 칸이라도 "빈손일 때"와 "꿀을 들었을 때"는 다른 상황이라, ' +
      '에이전트는 이 둘을 다른 상태로 구분해서 각각 다른 행동(꽃으로 가기 / 집으로 가기)을 ' +
      '배워요. 무엇을 상태에 담느냐가 풀 수 있는 문제를 결정해요.\n\n' +
      '이렇게 여러 단계를 거쳐 보상에 도달하는 문제를 "순차적 의사결정"이라고 해요.',
    docs: [
      { key: 'obs["delivered"]', desc: '꿀을 들고 집에 돌아오면 True (배달 성공)' },
      { key: 'obs["carrying"]', desc: '지금 꿀을 들고 있으면 True' },
      { key: 'obs["reached_flower"]', desc: '방금 꽃에 도착했으면 True' },
      { key: 'obs["reached_home"]', desc: '방금 집에 도착했으면 True' },
      { key: 'obs["done"]', desc: '이번 스텝으로 에피소드가 끝나면 True' },
    ],
  },
  {
    id: '2-3', chapter: 2, sublevel: 3,
    title: '거미줄 피하기',
    concept: '음의 보상(패널티) · 위험 회피',
    showDemo:
      '🌸꽃으로 가는 지름길에 🕸️거미줄이 있어요. 벌은 지름길로 직진하느라 거미줄을 밟아버려요!\n' +
      '거미줄을 밟으면 벌점을 줘서, 좀 돌아가더라도 안전한 길을 배우게 만들어 봅시다.',
    codeTemplate: [
      'def reward(obs):',
      '    # 꽃에 도착하면 +1 을 줍니다.',
      '    if obs["reached_flower"]:',
      '        return 1.0',
      '    # TODO: 거미줄(obs["hit_web"])을 밟으면 벌점(-)을 줘서 피하게 만드세요',
      '    return 0.0',
      '',
    ].join('\n'),
    engineConfig: {
      env: { type: 'grid', layout: ['H.WF', '....', '....', '....'], deliver: false },
      alpha: 0.3, gamma: 0.95, epsilon: 0.2,
      episodes: 600, maxSteps: 40, seed: 2,
    },
    successThreshold: 0.8,
    hints: [
      '거미줄을 밟은 순간(obs["hit_web"]) 음수 보상을 돌려주세요.',
      'if obs["hit_web"]: return -1.0  (꽃 보상 위에 추가)',
    ],
    recap:
      '🎉 음의 보상(벌점)으로 "하지 말 것"을 가르쳤어요.\n\n' +
      '보상은 방향이 있는 신호예요. +는 그 행동을 끌어당기고, -는 밀어내요. ' +
      '꽃의 +1만 있을 땐 지름길(거미줄 통과)이 빨라서 그쪽 Q값이 높았는데, ' +
      '거미줄에 -1을 더하니 그 칸들의 Q값이 깎여서 살짝 돌아가는 안전한 길이 ' +
      '더 높은 가치를 갖게 됐죠.\n\n' +
      '+로 목표를 정하고 -로 위험을 피하게 하는 것 — 이게 보상으로 행동을 빚는 기본기예요.',
    docs: [
      { key: 'obs["reached_flower"]', desc: '방금 꽃에 도착했으면 True' },
      { key: 'obs["hit_web"]', desc: '방금 거미줄 칸을 밟았으면 True' },
      { key: 'obs["moved"]', desc: '이번에 실제로 움직였으면 True' },
      { key: 'obs["done"]', desc: '이번 스텝으로 에피소드가 끝나면 True' },
    ],
  },
]
