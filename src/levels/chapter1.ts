import type { Level } from '../types'

export const chapter1: Level[] = [
  {
    id: '1-1', chapter: 1, sublevel: 1,
    title: '보상이 뭐예요?',
    showDemo:
      '벌이 꽃밭을 아무렇게나 고르고 있어요. 어디에 꿀이 많은지 전혀 모르네요!\n' +
      '벌에게 "좋은 선택"이 뭔지 알려줄 점수(보상)를 만들어 줍시다.',
    codeTemplate: [
      'def reward(obs):',
      '    # obs["nectar"] : 이번에 모은 꿀의 양',
      '    # 꿀을 많이 주는 꽃을 벌이 좋아하게 만들어 보세요!',
      '    return 0.0  # TODO: 이 줄을 고쳐보세요',
      '',
    ].join('\n'),
    engineConfig: {
      env: {
        type: 'bandit',
        arms: [
          { mean: 0.3, std: 0.15, label: '데이지', emoji: '🌼' },
          { mean: 0.9, std: 0.15, label: '해바라기', emoji: '🌻' },
          { mean: 0.5, std: 0.15, label: '튤립', emoji: '🌷' },
        ],
      },
      trainSteps: 500, evalSteps: 300, epsilon: 0.1, seed: 0,
    },
    successThreshold: 0.8,
    hints: [
      '꿀을 많이 주는 꽃이 좋은 꽃이에요.',
      'obs["nectar"] 를 그대로 돌려주면 어떨까요?  →  return obs["nectar"]',
    ],
    recap:
      '🎉 방금 만든 건 "보상(reward)" 신호예요. 강화학습 에이전트는 보상을 ' +
      '최대화하도록 행동을 바꿔요. 꿀=보상으로 두니 벌이 알아서 좋은 꽃을 골랐죠!',
  },
  {
    id: '1-2', chapter: 1, sublevel: 2,
    title: '새 꽃도 가봐야지',
    showDemo:
      '벌이 처음 마음에 든 꽃만 고집해요. 더 좋은 숨은 꽃이 있는데도 안 가보네요.\n' +
      '안 가본 꽃을 시도하면 약간의 보너스를 주면 어떨까요?',
    codeTemplate: [
      'def reward(obs):',
      '    # obs["nectar"]    : 이번에 모은 꿀',
      '    # obs["arm_pulls"] : 이 꽃을 지금까지 고른 횟수',
      '    base = obs["nectar"]',
      '    # TODO: 적게 가본 꽃에 탐험 보너스를 더해보세요',
      '    bonus = 0.0',
      '    return base + bonus',
      '',
    ].join('\n'),
    engineConfig: {
      env: {
        type: 'bandit',
        arms: [
          { mean: 0.55, std: 0.1, label: '데이지', emoji: '🌼' },
          { mean: 0.6, std: 0.1, label: '튤립', emoji: '🌷' },
          { mean: 0.95, std: 0.1, label: '해바라기', emoji: '🌻' },
        ],
      },
      trainSteps: 600, evalSteps: 300, epsilon: 0.02, seed: 1,
    },
    successThreshold: 0.8,
    hints: [
      '적게 가본 꽃일수록 보너스를 크게 주면 탐험을 더 해요.',
      '예:  bonus = 1.0 / (obs["arm_pulls"] + 1)',
    ],
    recap:
      '🎉 이게 "탐험 vs 활용(exploration/exploitation)"이에요. 당장 좋아 보이는 ' +
      '것만 쓰면(활용) 더 좋은 선택을 놓쳐요. 가끔 새로운 걸 시도(탐험)해야 진짜 최고를 찾죠.',
  },
  {
    id: '1-3', chapter: 1, sublevel: 3,
    title: '나쁜 보상의 함정',
    showDemo:
      '누군가 "꽃을 자주 고를수록 좋은 거야!"라고 벌에게 가르쳤더니...\n' +
      '벌이 꿀은 안 모으고 엉뚱한 꽃에 빠져버렸어요. 보상이 목표랑 안 맞으면 이런 일이 생겨요.',
    codeTemplate: [
      'def reward(obs):',
      '    # 아래는 "잘못된" 보상이에요. 벌이 엉뚱하게 행동해요.',
      '    # 진짜 목표(꿀 많이 모으기)와 맞게 고쳐보세요!',
      '    return obs["arm_pulls"]  # TODO: 이걸 고치세요',
      '',
    ].join('\n'),
    engineConfig: {
      env: {
        type: 'bandit',
        arms: [
          { mean: 0.2, std: 0.15, label: '데이지', emoji: '🌼' },
          { mean: 0.85, std: 0.15, label: '해바라기', emoji: '🌻' },
          { mean: 0.45, std: 0.15, label: '튤립', emoji: '🌷' },
        ],
      },
      trainSteps: 500, evalSteps: 300, epsilon: 0.1, seed: 2,
    },
    successThreshold: 0.8,
    hints: [
      '벌의 진짜 목표는 꿀을 많이 모으는 거예요.',
      '보상을 obs["nectar"] 로 바꿔서 목표와 정렬시키세요.',
    ],
    recap:
      '🎉 방금 본 게 "보상 해킹(reward hacking)" — 잘못된 보상은 엉뚱한 행동을 낳아요. ' +
      '그리고 이 "여러 선택지 중 최고를 찾는 문제"를 RL에서는 멀티암드 밴딧(multi-armed bandit) 🎰 이라고 불러요!',
  },
]
