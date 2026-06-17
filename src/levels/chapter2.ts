import type { Level } from '../types'

const MAZE = ['H...', '.##.', '.##.', '...F']

export const chapter2: Level[] = [
  {
    id: '2-1', chapter: 2, sublevel: 1,
    title: '꽃까지 가는 길',
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
      '🎉 칸 색이 꽃에서부터 점점 번지는 거 보이죠? 이게 "Q값"이에요. 목표의 보상이 ' +
      '한 칸씩 거꾸로 퍼지면서(TD 학습) 화살표(정책)가 길을 가리키게 돼요.',
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
      '🎉 "꽃 따기 → 집에 오기" 두 단계를 한 번에 배웠어요. 마지막 보상 하나만으로도 ' +
      '에이전트가 긴 순서(sequence)를 거꾸로 풀어내는 게 강화학습의 힘이에요.',
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
      '🎉 음의 보상(벌점)으로 "하지 말 것"을 가르쳤어요. 보상은 +로 끌어당기고 ' +
      '-로 밀어내요. 방금 한 게 바로 "Q-learning"으로 안전한 경로를 배운 거예요!',
    docs: [
      { key: 'obs["reached_flower"]', desc: '방금 꽃에 도착했으면 True' },
      { key: 'obs["hit_web"]', desc: '방금 거미줄 칸을 밟았으면 True' },
      { key: 'obs["moved"]', desc: '이번에 실제로 움직였으면 True' },
      { key: 'obs["done"]', desc: '이번 스텝으로 에피소드가 끝나면 True' },
    ],
  },
]
