import type { Level } from '../types'

export const chapter1: Level[] = [
  {
    id: '1-1', chapter: 1, sublevel: 1,
    title: '보상이 뭐예요?',
    concept: '보상(reward) — 행동을 이끄는 점수',
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
      '🎉 방금 만든 건 "보상(reward)" 신호예요.\n\n' +
      '강화학습 에이전트는 똑똑해서가 아니라, 단지 "받은 보상의 합을 최대로 만들려고" ' +
      '행동을 조금씩 바꿔요. 그래서 무엇을 보상으로 주느냐가 곧 "무엇을 시킬 것이냐"가 돼요.\n\n' +
      '여기선 꿀을 그대로 보상으로 줬더니, 벌이 여러 꽃을 시도해 보고 꿀이 많은 꽃을 ' +
      '점점 더 자주 고르게 됐죠. 우리가 길을 알려준 게 아니라, 보상만 정해줬을 뿐이에요.',
    docs: [
      { key: 'obs["nectar"]', desc: '이번에 모은 꿀의 양 (실수)' },
    ],
  },
  {
    id: '1-2', chapter: 1, sublevel: 2,
    title: '새 꽃도 가봐야지',
    concept: '탐험 vs 활용 (exploration / exploitation)',
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
      '🎉 이게 강화학습의 영원한 딜레마, "탐험 vs 활용"이에요.\n\n' +
      '• 활용(exploitation): 지금까지 제일 좋아 보이는 걸 쓴다\n' +
      '• 탐험(exploration): 잘 모르는 걸 일부러 시도해 본다\n\n' +
      '활용만 하면 처음에 우연히 괜찮았던 꽃에 갇혀, 더 좋은 숨은 꽃을 영영 못 찾아요. ' +
      '안 가본 꽃에 보너스를 줘서 탐험을 살짝 부추겼더니 진짜 최고 꽃을 찾아냈죠. ' +
      '둘 사이의 균형이 핵심이에요.',
    docs: [
      { key: 'obs["nectar"]', desc: '이번에 모은 꿀의 양 (실수)' },
      { key: 'obs["arm_pulls"]', desc: '이 꽃을 지금까지 고른 횟수 (정수)' },
    ],
  },
  {
    id: '1-3', chapter: 1, sublevel: 3,
    title: '나쁜 보상의 함정',
    concept: '보상 정렬 · 보상 해킹 · 멀티암드 밴딧',
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
      '🎉 방금 본 게 그 유명한 "보상 해킹(reward hacking)"이에요.\n\n' +
      '에이전트는 "우리가 의도한 목표"가 아니라 "우리가 적어준 보상"을 최대화해요. ' +
      '둘이 어긋나면(여기선 "자주 고르기"에 보상을 줬더니) 벌은 보상은 잘 챙기면서도 ' +
      '정작 꿀은 안 모으는 엉뚱한 행동을 하죠. 보상을 진짜 목표(꿀)와 정렬시키니 해결됐어요.\n\n' +
      '참고로 챕터 1처럼 "여러 선택지 중 최고를 찾는 문제"를 RL에서는 ' +
      '멀티암드 밴딧(multi-armed bandit) 🎰 이라고 불러요.',
    docs: [
      { key: 'obs["nectar"]', desc: '이번에 모은 꿀의 양 (실수)' },
      { key: 'obs["arm"]', desc: '방금 고른 꽃 번호 (0부터)' },
      { key: 'obs["arm_pulls"]', desc: '이 꽃을 지금까지 고른 횟수 (정수)' },
      { key: 'obs["total_pulls"]', desc: '지금까지 꽃을 고른 총 횟수 (정수)' },
    ],
  },
]
