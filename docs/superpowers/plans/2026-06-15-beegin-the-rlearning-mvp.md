# Beegin the RLearning — MVP (Walking Skeleton + Chapter 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 플레이어가 브라우저 IDE에 진짜 Python `reward()`를 작성하면 그 코드가 Pyodide에서 실제로 ε-greedy 밴딧 에이전트를 학습시키고, 양봉장 캔버스에 학습 과정이 보이며, 성공률이 임계를 넘으면 클리어되는 — 챕터 1(밴딧, 서브레벨 3개)까지의 플레이 가능한 게임.

**Architecture:** 전부 클라이언트 사이드. 순수 Python RL 엔진(stdlib만, numpy 없음)을 Pyodide에 올려 실행하고, 엔진 로직은 CPython에서 pytest로 그대로 테스트한다. UI는 프레임워크 없는 Vite+TS. Monaco가 IDE, Canvas 2D가 시각화. 레벨은 데이터(`Level[]`)로 정의해 챕터 추가가 데이터 추가로 끝나게 한다.

**Tech Stack:** Vite + TypeScript(vanilla), Pyodide(v0.27.2, CDN), monaco-editor, Canvas 2D, pytest(엔진), vitest(TS 순수 로직).

**참고 설계 문서:** `docs/superpowers/specs/2026-06-15-beegin-the-rlearning-design.md`

---

## File Structure

| 경로 | 책임 |
|---|---|
| `engine/__init__.py` | Python 패키지 마커 (빈 파일) |
| `engine/bandit.py` | 밴딧 환경 (꽃밭들 + 확률적 꿀 + 진짜 최고 꽃밭) |
| `engine/agent.py` | ε-greedy action-value 에이전트 (증분 평균) |
| `engine/runner.py` | `run_training(player_source, config)` — 플레이어 reward 주입 + 학습 루프 + 결과 dict |
| `engine/tests/test_bandit.py` | 밴딧 단위 테스트 |
| `engine/tests/test_agent.py` | 에이전트 단위 테스트 |
| `engine/tests/test_runner.py` | 학습 파이프라인 테스트 |
| `src/types.ts` | 공유 타입 (`Level`, `EngineConfig`, `EngineResult` 등) |
| `src/scoring.ts` | 클리어 판정 순수 함수 |
| `src/scoring.test.ts` | scoring 단위 테스트 (vitest) |
| `src/levels/chapter1.ts` | 챕터 1 서브레벨 3개 데이터 |
| `src/runtime.ts` | Pyodide 로드 + 엔진 주입 + `runTraining()` 래퍼 |
| `src/monaco.ts` | Monaco 에디터 생성 + 워커 설정 |
| `src/renderer.ts` | 밴딧 캔버스 렌더러 (히스토리 애니메이션) |
| `src/main.ts` | 앱 셸: Show→Code→Name it 흐름 + Run + 힌트 + 진행도 |
| `src/style.css` | 레이아웃/테마 |
| `index.html` | 진입점 |

각 파일은 단일 책임을 갖는다. 엔진(Python)과 UI(TS)는 `run_training`의 JSON 결과로만 만난다.

**공유 계약 (모든 태스크가 이 키 이름을 그대로 쓴다):**
- `run_training`은 dict 반환: `{ "ok": bool, "error": str|None, "successRate": float, "bestArm": int, "history": [ {"step": int, "estimates": [float], "counts": [int]} ] }`
- 플레이어 코드는 `reward(obs)`를 정의. `obs` = `{ "nectar": float, "arm": int, "arm_pulls": int, "total_pulls": int }`
- config(JS→Python dict): `{ "env": {"type":"bandit","arms":[{"mean":float,"std":float,"label":str,"emoji":str}]}, "trainSteps": int, "evalSteps": int, "epsilon": float, "seed": int }`

---

## Task 0: 레포 초기화 + Vite 스캐폴드 + 의존성

**Files:**
- Create: `.gitignore`, `package.json`(생성됨), `engine/__init__.py`, `engine/tests/__init__.py`
- Modify: `package.json` (scripts 추가)

- [ ] **Step 1: git 저장소 초기화**

폴더는 아직 git 저장소가 아니다.

Run:
```bash
cd /Users/genne/Documents/games/beegin-the-rlearning && git init && git add docs && git commit -m "docs: add design spec and implementation plan"
```
Expected: 첫 커밋 생성 (docs/ 포함).

- [ ] **Step 2: Vite vanilla-ts 스캐폴드를 현재 폴더에 생성**

Run:
```bash
cd /Users/genne/Documents/games/beegin-the-rlearning && npm create vite@latest . -- --template vanilla-ts
```
프롬프트에서 "현재 디렉터리에 생성" 확인. Expected: `index.html`, `src/`, `package.json`, `tsconfig.json` 생성.

- [ ] **Step 3: 의존성 설치**

Run:
```bash
cd /Users/genne/Documents/games/beegin-the-rlearning && npm install && npm install monaco-editor && npm install -D vitest
```
Expected: 설치 성공, `node_modules/` 생성.

- [ ] **Step 4: Python 패키지 마커 파일 생성**

`engine/__init__.py` = 빈 파일.
`engine/tests/__init__.py` = 빈 파일.

```bash
mkdir -p engine/tests && touch engine/__init__.py engine/tests/__init__.py
```

- [ ] **Step 5: pytest 설치 확인**

Run:
```bash
python3 -m pytest --version
```
Expected: 버전 출력. 없으면 `python3 -m pip install pytest` 실행.

- [ ] **Step 6: `package.json` scripts 추가**

`package.json`의 `"scripts"`에 다음을 포함하도록 수정:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 7: `.gitignore` 확인/보강**

`.gitignore`에 다음 줄이 있는지 확인하고 없으면 추가:
```
node_modules
dist
__pycache__
.pytest_cache
.DS_Store
```

- [ ] **Step 8: 커밋**

```bash
git add -A && git commit -m "chore: scaffold vite+ts project and python engine package"
```

---

## Task 1: 밴딧 환경 (Python, TDD)

**Files:**
- Create: `engine/bandit.py`
- Test: `engine/tests/test_bandit.py`

- [ ] **Step 1: 실패하는 테스트 작성**

`engine/tests/test_bandit.py`:
```python
import random
from engine.bandit import Bandit


def test_best_arm_is_highest_mean():
    rng = random.Random(0)
    b = Bandit([{"mean": 0.2, "std": 0.0},
                {"mean": 0.9, "std": 0.0},
                {"mean": 0.5, "std": 0.0}], rng)
    assert b.best_arm() == 1


def test_pull_is_nonnegative():
    rng = random.Random(0)
    b = Bandit([{"mean": 0.0, "std": 5.0}], rng)
    for _ in range(50):
        assert b.pull(0) >= 0.0


def test_pull_is_deterministic_with_seed():
    b1 = Bandit([{"mean": 1.0, "std": 1.0}], random.Random(42))
    b2 = Bandit([{"mean": 1.0, "std": 1.0}], random.Random(42))
    assert b1.pull(0) == b2.pull(0)
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd /Users/genne/Documents/games/beegin-the-rlearning && python3 -m pytest engine/tests/test_bandit.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'engine.bandit'`

- [ ] **Step 3: 최소 구현 작성**

`engine/bandit.py`:
```python
class Bandit:
    """여러 꽃밭(arm). 각 꽃밭은 평균/표준편차를 가진 확률적 꿀 분포."""

    def __init__(self, arms, rng):
        # arms: list of {"mean": float, "std": float}
        self.means = [a["mean"] for a in arms]
        self.stds = [a["std"] for a in arms]
        self.rng = rng
        self.n = len(arms)

    def pull(self, arm):
        """꽃밭을 고르면 확률적으로 꿀을 반환 (음수는 0으로 자른다)."""
        nectar = self.rng.gauss(self.means[arm], self.stds[arm])
        return max(0.0, nectar)

    def best_arm(self):
        """기댓값(평균) 기준 진짜 최고 꽃밭 인덱스."""
        best = 0
        for i in range(self.n):
            if self.means[i] > self.means[best]:
                best = i
        return best
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `python3 -m pytest engine/tests/test_bandit.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: 커밋**

```bash
git add engine/bandit.py engine/tests/test_bandit.py && git commit -m "feat(engine): add bandit environment"
```

---

## Task 2: ε-greedy 에이전트 (Python, TDD)

**Files:**
- Create: `engine/agent.py`
- Test: `engine/tests/test_agent.py`

- [ ] **Step 1: 실패하는 테스트 작성**

`engine/tests/test_agent.py`:
```python
import random
from engine.agent import EpsilonGreedy


def test_update_tracks_incremental_mean():
    a = EpsilonGreedy(2, 0.0, random.Random(0))
    a.update(0, 1.0)
    a.update(0, 3.0)
    assert abs(a.estimates[0] - 2.0) < 1e-9
    assert a.counts[0] == 2


def test_greedy_picks_highest_estimate():
    a = EpsilonGreedy(3, 0.0, random.Random(0))
    a.estimates = [0.1, 0.9, 0.2]
    assert a.choose_greedy() == 1


def test_epsilon_zero_is_greedy():
    a = EpsilonGreedy(3, 0.0, random.Random(0))
    a.estimates = [0.0, 0.0, 1.0]
    assert all(a.choose() == 2 for _ in range(20))
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `python3 -m pytest engine/tests/test_agent.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'engine.agent'`

- [ ] **Step 3: 최소 구현 작성**

`engine/agent.py`:
```python
class EpsilonGreedy:
    """행동 가치(추정 꿀)를 증분 평균으로 학습하는 ε-greedy 에이전트."""

    def __init__(self, n_arms, epsilon, rng):
        self.n = n_arms
        self.epsilon = epsilon
        self.rng = rng
        self.estimates = [0.0] * n_arms
        self.counts = [0] * n_arms

    def choose(self):
        if self.rng.random() < self.epsilon:
            return self.rng.randrange(self.n)
        return self.choose_greedy()

    def choose_greedy(self):
        best = 0
        for i in range(self.n):
            if self.estimates[i] > self.estimates[best]:
                best = i
        return best

    def update(self, arm, reward):
        self.counts[arm] += 1
        # 증분 평균: Q <- Q + (1/n)(r - Q)
        self.estimates[arm] += (reward - self.estimates[arm]) / self.counts[arm]
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `python3 -m pytest engine/tests/test_agent.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: 커밋**

```bash
git add engine/agent.py engine/tests/test_agent.py && git commit -m "feat(engine): add epsilon-greedy agent"
```

---

## Task 3: 학습 러너 + 플레이어 reward 주입 (Python, TDD)

**Files:**
- Create: `engine/runner.py`
- Test: `engine/tests/test_runner.py`

- [ ] **Step 1: 실패하는 테스트 작성**

`engine/tests/test_runner.py`:
```python
from engine.runner import run_training

CONFIG = {
    "env": {"type": "bandit", "arms": [
        {"mean": 0.2, "std": 0.1, "label": "a", "emoji": "🌼"},
        {"mean": 0.9, "std": 0.1, "label": "b", "emoji": "🌻"},
        {"mean": 0.4, "std": 0.1, "label": "c", "emoji": "🌷"},
    ]},
    "trainSteps": 500, "evalSteps": 300, "epsilon": 0.1, "seed": 0,
}


def test_good_reward_learns_best_arm():
    src = "def reward(obs):\n    return obs['nectar']\n"
    res = run_training(src, CONFIG)
    assert res["ok"] is True
    assert res["bestArm"] == 1
    assert res["successRate"] >= 0.8


def test_constant_reward_fails_to_learn():
    src = "def reward(obs):\n    return 1.0\n"
    res = run_training(src, CONFIG)
    assert res["ok"] is True
    assert res["successRate"] < 0.8


def test_missing_reward_returns_error():
    res = run_training("x = 1\n", CONFIG)
    assert res["ok"] is False
    assert "reward" in res["error"]


def test_reward_runtime_error_is_caught():
    src = "def reward(obs):\n    return obs['does_not_exist']\n"
    res = run_training(src, CONFIG)
    assert res["ok"] is False
    assert res["error"]


def test_history_is_recorded():
    src = "def reward(obs):\n    return obs['nectar']\n"
    res = run_training(src, CONFIG)
    assert len(res["history"]) > 0
    assert "estimates" in res["history"][0]
    assert "counts" in res["history"][0]
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `python3 -m pytest engine/tests/test_runner.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'engine.runner'`

- [ ] **Step 3: 최소 구현 작성**

`engine/runner.py`:
```python
import random

from engine.bandit import Bandit
from engine.agent import EpsilonGreedy


def _make_reward(player_source):
    """플레이어 코드를 실행해 reward 함수를 추출."""
    namespace = {}
    exec(player_source, namespace)
    fn = namespace.get("reward")
    if fn is None:
        raise ValueError("reward(obs) 함수를 정의해주세요.")
    return fn


def run_training(player_source, config):
    """플레이어의 reward로 ε-greedy 밴딧을 학습시키고 결과 dict를 반환."""
    try:
        reward_fn = _make_reward(player_source)
    except Exception as e:
        return {"ok": False, "error": "코드 오류: " + str(e),
                "successRate": 0.0, "bestArm": -1, "history": []}

    rng = random.Random(config["seed"])
    arms = config["env"]["arms"]
    bandit = Bandit(arms, rng)
    agent = EpsilonGreedy(bandit.n, config["epsilon"], rng)

    train_steps = config["trainSteps"]
    eval_steps = config["evalSteps"]
    snapshot_every = max(1, train_steps // 40)
    history = []
    total_pulls = 0

    try:
        for t in range(train_steps):
            arm = agent.choose()
            nectar = bandit.pull(arm)
            total_pulls += 1
            obs = {
                "nectar": nectar,
                "arm": arm,
                "arm_pulls": agent.counts[arm],
                "total_pulls": total_pulls,
            }
            r = float(reward_fn(obs))
            agent.update(arm, r)
            if t % snapshot_every == 0:
                history.append({
                    "step": t,
                    "estimates": list(agent.estimates),
                    "counts": list(agent.counts),
                })
    except Exception as e:
        return {"ok": False, "error": "reward() 오류: " + str(e),
                "successRate": 0.0, "bestArm": bandit.best_arm(), "history": history}

    # 평가: 학습을 멈추고 같은 epsilon으로 행동, 진짜 최고 꽃밭을 얼마나 고르나
    best = bandit.best_arm()
    hits = 0
    for _ in range(eval_steps):
        if agent.choose() == best:
            hits += 1
    success_rate = hits / eval_steps if eval_steps else 0.0

    history.append({"step": train_steps,
                    "estimates": list(agent.estimates),
                    "counts": list(agent.counts)})

    return {"ok": True, "error": None, "successRate": success_rate,
            "bestArm": best, "history": history}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `python3 -m pytest engine/tests/test_runner.py -v`
Expected: PASS (5 passed)

- [ ] **Step 5: 전체 엔진 테스트 확인**

Run: `python3 -m pytest engine/tests -v`
Expected: PASS (11 passed)

- [ ] **Step 6: 커밋**

```bash
git add engine/runner.py engine/tests/test_runner.py && git commit -m "feat(engine): add run_training with player reward injection"
```

---

## Task 4: TS 공유 타입 + 클리어 판정 (TDD scoring)

**Files:**
- Create: `src/types.ts`, `src/scoring.ts`, `src/scoring.test.ts`

- [ ] **Step 1: 타입 정의 작성**

`src/types.ts`:
```typescript
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
```

- [ ] **Step 2: 실패하는 테스트 작성**

`src/scoring.test.ts`:
```typescript
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
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `cd /Users/genne/Documents/games/beegin-the-rlearning && npx vitest run src/scoring.test.ts`
Expected: FAIL — cannot find module './scoring'

- [ ] **Step 4: 최소 구현 작성**

`src/scoring.ts`:
```typescript
import type { EngineResult } from './types'

export function isCleared(result: EngineResult, threshold: number): boolean {
  return result.ok && result.successRate >= threshold
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run src/scoring.test.ts`
Expected: PASS (3 passed)

- [ ] **Step 6: 커밋**

```bash
git add src/types.ts src/scoring.ts src/scoring.test.ts && git commit -m "feat(ui): add shared types and clear-condition scoring"
```

---

## Task 5: 챕터 1 레벨 데이터

**Files:**
- Create: `src/levels/chapter1.ts`

- [ ] **Step 1: 챕터 1 데이터 작성**

`src/levels/chapter1.ts`:
```typescript
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
```

- [ ] **Step 2: 타입 체크 통과 확인**

Run: `cd /Users/genne/Documents/games/beegin-the-rlearning && npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

- [ ] **Step 3: 커밋**

```bash
git add src/levels/chapter1.ts && git commit -m "feat(levels): add chapter 1 bandit sublevels"
```

---

## Task 6: Pyodide 런타임 래퍼

**Files:**
- Create: `src/runtime.ts`
- Create (임시): `src/runtime-check.ts`

- [ ] **Step 1: 런타임 래퍼 작성**

`src/runtime.ts`:
```typescript
import type { EngineConfig, EngineResult } from './types'
import banditSrc from '../engine/bandit.py?raw'
import agentSrc from '../engine/agent.py?raw'
import runnerSrc from '../engine/runner.py?raw'

const PYODIDE_VERSION = 'v0.27.2'
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`

let pyodidePromise: Promise<any> | null = null

async function getPyodide(): Promise<any> {
  if (pyodidePromise) return pyodidePromise
  pyodidePromise = (async () => {
    const mod = await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`)
    const pyodide = await mod.loadPyodide({ indexURL: INDEX_URL })
    pyodide.FS.mkdirTree('engine')
    pyodide.FS.writeFile('engine/__init__.py', '')
    pyodide.FS.writeFile('engine/bandit.py', banditSrc)
    pyodide.FS.writeFile('engine/agent.py', agentSrc)
    pyodide.FS.writeFile('engine/runner.py', runnerSrc)
    pyodide.runPython("import sys\nif '' not in sys.path:\n    sys.path.insert(0, '')")
    return pyodide
  })()
  return pyodidePromise
}

/** Pyodide를 미리 로드한다 (로딩 UI용). */
export function preloadRuntime(): Promise<unknown> {
  return getPyodide()
}

/** 플레이어 reward 코드 + 레벨 config로 학습을 실행하고 결과를 반환. */
export async function runTraining(
  playerSource: string,
  config: EngineConfig,
): Promise<EngineResult> {
  const pyodide = await getPyodide()
  const runFn = pyodide.runPython(
    'from engine.runner import run_training\nrun_training',
  )
  const cfg = pyodide.toPy(config)
  try {
    const proxy = runFn(playerSource, cfg)
    const result = proxy.toJs({ dict_converter: Object.fromEntries }) as EngineResult
    proxy.destroy()
    return result
  } finally {
    cfg.destroy()
    runFn.destroy()
  }
}
```

- [ ] **Step 2: 임시 검증 스크립트 작성**

`src/runtime-check.ts`:
```typescript
import { runTraining } from './runtime'
import { chapter1 } from './levels/chapter1'

async function main() {
  const good = 'def reward(obs):\n    return obs["nectar"]\n'
  const res = await runTraining(good, chapter1[0].engineConfig)
  console.log('RUNTIME CHECK:', JSON.stringify(res).slice(0, 200))
  console.log('successRate =', res.successRate, 'bestArm =', res.bestArm)
}
main()
```

- [ ] **Step 3: `index.html`의 스크립트 진입점을 임시로 교체**

`index.html`에서 `<script type="module" src="/src/main.ts"></script>`를 임시로 `<script type="module" src="/src/runtime-check.ts"></script>`로 변경.
(`src/main.ts`는 아직 없을 수 있으므로 이 단계에서 교체.)

- [ ] **Step 4: 개발 서버에서 검증**

Run: `npm run dev` (백그라운드로 실행), 브라우저로 표시된 localhost URL 열기, 개발자 콘솔 확인.
Expected: 콘솔에 `RUNTIME CHECK: ...` 와 `successRate = 0.9x bestArm = 1` (0.8 이상). Pyodide 첫 로드에 수 초 걸릴 수 있음.

- [ ] **Step 5: 임시 검증 파일/변경 되돌리기**

`src/runtime-check.ts` 삭제. `index.html` 진입점을 `/src/main.ts`로 되돌림.
```bash
rm src/runtime-check.ts
```

- [ ] **Step 6: 커밋**

```bash
git add src/runtime.ts index.html && git commit -m "feat(runtime): add pyodide wrapper that runs the python engine"
```

---

## Task 7: Monaco 에디터 설정

**Files:**
- Create: `src/monaco.ts`

- [ ] **Step 1: Monaco 래퍼 작성**

`src/monaco.ts`:
```typescript
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

// Vite 환경에서 Monaco 워커 등록
;(self as any).MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
}

export function createEditor(
  container: HTMLElement,
  value: string,
): monaco.editor.IStandaloneCodeEditor {
  return monaco.editor.create(container, {
    value,
    language: 'python',
    theme: 'vs-dark',
    fontSize: 14,
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    tabSize: 4,
  })
}
```

- [ ] **Step 2: 타입 체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음. (Monaco의 `?worker` import는 `vite-env.d.ts`의 `/// <reference types="vite/client" />` 로 해결됨 — vanilla-ts 템플릿에 기본 포함. 없으면 `src/vite-env.d.ts`에 해당 줄 추가.)

- [ ] **Step 3: 커밋**

```bash
git add src/monaco.ts && git commit -m "feat(ui): add monaco editor wrapper"
```

---

## Task 8: 밴딧 캔버스 렌더러

**Files:**
- Create: `src/renderer.ts`

- [ ] **Step 1: 렌더러 작성**

`src/renderer.ts`:
```typescript
import type { Level, EngineResult, Snapshot } from './types'

/**
 * 밴딧 결과를 캔버스에 애니메이션으로 그린다.
 * 꽃밭별 추정 가치 막대 + 선택 횟수. 최고 꽃밭은 노랗게 강조.
 * 이전 애니메이션을 멈출 수 있게 cancel 함수를 반환.
 */
export function renderBandit(
  canvas: HTMLCanvasElement,
  level: Level,
  result: EngineResult,
): () => void {
  const ctx = canvas.getContext('2d')!
  const arms = level.engineConfig.env.arms
  const frames = result.history
  let i = 0
  let timer = 0

  function drawFrame(snap: Snapshot) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const n = arms.length
    const pad = 40
    const slot = (canvas.width - pad * 2) / n
    const maxEst = Math.max(0.1, ...snap.estimates)
    const baseY = canvas.height - 70
    const maxH = canvas.height - 150

    for (let a = 0; a < n; a++) {
      const x = pad + a * slot
      const h = (snap.estimates[a] / maxEst) * maxH
      const isBest = a === result.bestArm
      ctx.fillStyle = isBest ? '#ffcf33' : '#7ec8e3'
      ctx.fillRect(x + 12, baseY - h, slot - 24, h)

      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.font = '30px sans-serif'
      ctx.fillText(arms[a].emoji, x + slot / 2, baseY + 34)
      ctx.font = '13px sans-serif'
      ctx.fillText(arms[a].label, x + slot / 2, baseY + 54)
      ctx.fillText(`추정 ${snap.estimates[a].toFixed(2)}`, x + slot / 2, baseY - h - 18)
      ctx.fillText(`선택 ${snap.counts[a]}회`, x + slot / 2, baseY - h - 4)
    }

    ctx.fillStyle = '#bbbbbb'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`step ${snap.step}`, 12, 20)
  }

  function step() {
    if (i >= frames.length) return
    drawFrame(frames[i])
    i++
    if (i < frames.length) {
      timer = window.setTimeout(step, 50)
    }
  }
  step()

  return () => window.clearTimeout(timer)
}
```

- [ ] **Step 2: 타입 체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/renderer.ts && git commit -m "feat(ui): add bandit canvas renderer"
```

---

## Task 9: 앱 셸 (Show→Code→Name it + Run + 힌트 + 진행도) & 통합 검증

**Files:**
- Create: `src/main.ts`, `src/style.css`
- Modify: `index.html`

- [ ] **Step 1: `index.html` 본문 작성**

`index.html`의 `<body>`를 다음으로 교체 (head의 title은 "Beegin the RLearning"로):
```html
  <body>
    <div id="app">
      <header id="topbar">
        <span id="game-title">🐝 Beegin the RLearning</span>
        <span id="level-title"></span>
      </header>
      <section id="show-panel"></section>
      <main id="workspace">
        <div id="editor-pane"></div>
        <div id="viz-pane">
          <canvas id="canvas" width="520" height="380"></canvas>
          <div id="status"></div>
          <div id="controls">
            <button id="run-btn">▶ 학습 실행</button>
            <button id="hint-btn">💡 힌트</button>
            <button id="next-btn" disabled>다음 레벨 →</button>
          </div>
          <div id="hint-box"></div>
          <div id="recap-box"></div>
        </div>
      </main>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
```

- [ ] **Step 2: 스타일 작성**

`src/style.css`:
```css
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; background: #1e1f29; color: #eee; }
#topbar { display: flex; gap: 16px; align-items: baseline; padding: 12px 20px; background: #15161e; border-bottom: 1px solid #333; }
#game-title { font-size: 20px; font-weight: 700; color: #ffcf33; }
#level-title { font-size: 15px; color: #9fd8ee; }
#show-panel { padding: 14px 20px; background: #23252f; white-space: pre-line; line-height: 1.5; border-bottom: 1px solid #333; }
#workspace { display: flex; gap: 16px; padding: 16px 20px; align-items: flex-start; }
#editor-pane { flex: 1; height: 420px; border: 1px solid #333; }
#viz-pane { width: 540px; }
#canvas { background: #11121a; border: 1px solid #333; border-radius: 8px; }
#status { margin: 10px 0; min-height: 22px; font-size: 15px; }
#status.pass { color: #5fdc8a; font-weight: 700; }
#status.fail { color: #ff8c66; }
#controls { display: flex; gap: 8px; }
button { background: #3a3d4d; color: #eee; border: 1px solid #555; border-radius: 6px; padding: 8px 14px; font-size: 14px; cursor: pointer; }
button:hover:not(:disabled) { background: #4a4e62; }
button:disabled { opacity: 0.4; cursor: not-allowed; }
#run-btn { background: #2e7d4f; border-color: #3fae6e; }
#hint-box { margin-top: 12px; color: #ffe08a; white-space: pre-line; }
#recap-box { margin-top: 12px; padding: 12px; background: #2a3325; border-radius: 8px; line-height: 1.5; display: none; }
#recap-box.show { display: block; }
```

- [ ] **Step 3: 앱 셸 작성**

`src/main.ts`:
```typescript
import './style.css'
import { chapter1 } from './levels/chapter1'
import { createEditor } from './monaco'
import { runTraining, preloadRuntime } from './runtime'
import { renderBandit } from './renderer'
import { isCleared } from './scoring'
import type { Level } from './types'

const levels: Level[] = chapter1
let current = 0
let hintIndex = 0
let cancelRender: (() => void) | null = null

const $ = (id: string) => document.getElementById(id)!
const editorPane = $('editor-pane')
const canvas = $('canvas') as HTMLCanvasElement
const status = $('status')
const hintBox = $('hint-box')
const recapBox = $('recap-box')
const runBtn = $('run-btn') as HTMLButtonElement
const hintBtn = $('hint-btn') as HTMLButtonElement
const nextBtn = $('next-btn') as HTMLButtonElement

const editor = createEditor(editorPane, levels[0].codeTemplate)

function loadLevel(index: number) {
  const lv = levels[index]
  hintIndex = 0
  cancelRender?.()
  $('level-title').textContent = `Lv ${lv.id} — ${lv.title}`
  $('show-panel').textContent = lv.showDemo
  editor.setValue(lv.codeTemplate)
  status.textContent = ''
  status.className = ''
  hintBox.textContent = ''
  recapBox.className = ''
  recapBox.textContent = ''
  nextBtn.disabled = true
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

async function onRun() {
  const lv = levels[current]
  runBtn.disabled = true
  status.className = ''
  status.textContent = '⏳ 학습 중... (첫 실행은 Python 로딩에 몇 초 걸려요)'
  try {
    const result = await runTraining(editor.getValue(), lv.engineConfig)
    if (!result.ok) {
      status.className = 'fail'
      status.textContent = '⚠️ ' + result.error
      return
    }
    cancelRender?.()
    cancelRender = renderBandit(canvas, lv, result)
    const pct = Math.round(result.successRate * 100)
    if (isCleared(result, lv.successThreshold)) {
      status.className = 'pass'
      status.textContent = `✅ 클리어! 최고 꽃밭 선택률 ${pct}% (기준 ${Math.round(
        lv.successThreshold * 100,
      )}%)`
      recapBox.textContent = lv.recap
      recapBox.className = 'show'
      nextBtn.disabled = current >= levels.length - 1
    } else {
      status.className = 'fail'
      status.textContent = `❌ 아직이에요. 선택률 ${pct}% (기준 ${Math.round(
        lv.successThreshold * 100,
      )}%) — 보상을 다시 손봐요.`
    }
  } finally {
    runBtn.disabled = false
  }
}

function onHint() {
  const lv = levels[current]
  if (hintIndex < lv.hints.length) {
    hintBox.textContent += (hintBox.textContent ? '\n' : '') + '💡 ' + lv.hints[hintIndex]
    hintIndex++
  }
  if (hintIndex >= lv.hints.length) hintBtn.disabled = true
}

function onNext() {
  if (current < levels.length - 1) {
    current++
    hintBtn.disabled = false
    loadLevel(current)
  }
}

runBtn.addEventListener('click', onRun)
hintBtn.addEventListener('click', onHint)
nextBtn.addEventListener('click', onNext)

loadLevel(0)
preloadRuntime() // 백그라운드로 Pyodide 미리 로드
```

- [ ] **Step 4: 타입 체크 + 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 통합 수동 검증 — 챕터 1 플레이스루**

Run: `npm run dev`, 브라우저로 열기.

검증 항목:
1. **Lv 1-1**: 상황 패널·에디터·캔버스 표시. "학습 실행" 클릭 → (첫 로드 대기 후) 막대 애니메이션. 템플릿(`return 0.0`)이면 **실패** 메시지. 코드를 `return obs["nectar"]`로 고치고 실행 → **클리어**, 해바라기(🌻)가 노란 막대로 가장 높고, 리캡 박스 표시, "다음 레벨" 활성화.
2. **힌트 버튼**: 누를 때마다 힌트가 한 줄씩 추가, 다 쓰면 비활성화.
3. **다음 레벨** → Lv 1-2 로드 (상황/템플릿 교체). `bonus = 1.0 / (obs["arm_pulls"] + 1)` 넣고 실행 → 클리어.
4. **Lv 1-3**: 템플릿(`return obs["arm_pulls"]`)으로 실행 → 실패. `return obs["nectar"]`로 고치면 클리어 + 밴딧 리캡.
5. **에러 처리**: 일부러 `def reward(obs): return obs["nope"]` → 빨간 에러 메시지, 앱 안 죽음.

모든 항목 통과해야 함.

- [ ] **Step 6: 커밋**

```bash
git add src/main.ts src/style.css index.html && git commit -m "feat(ui): wire up app shell with show-code-nameit loop and progression"
```

---

## Self-Review 결과

**Spec coverage (설계 문서 대비):**
- §4 핵심 루프 (코드→실행→시각화→채점) → Task 6·9 ✅
- §5 스택 (Vite+TS+Pyodide+Monaco+Canvas) → Task 0·6·7·8 ✅
- §6 모듈 분리 (engine/levels/runtime/render/ui) → Task 1~9 파일 구조 그대로 ✅
- §7 교육 레이어 (Show→Code→Name it) → Task 5 데이터 + Task 9 셸 ✅
- §8 챕터1 서브레벨 3개 → Task 5 ✅
- §9 레벨 데이터 형태 → `Level` 타입 (Task 4) ✅
- **범위 밖(이 계획에 의도적으로 미포함):** 챕터 2~3(그리드/Q러닝/셰이핑), 그리드 렌더러, 정책 화살표·Q 히트맵. → 후속 계획 `2026-..-beegin-chapter2-3.md`로 분리. 밴딧 렌더러는 막대 그래프로 충분.

**Placeholder scan:** 모든 코드 스텝에 실제 코드 포함. "TODO"는 *플레이어용 템플릿 안의 의도적 빈칸*뿐(게임 콘텐츠), 계획 자체의 미완성 아님. ✅

**Type consistency:** `EngineResult`/`Snapshot`/`Level`/`EngineConfig` 키가 Python `run_training` 반환 키(`ok/error/successRate/bestArm/history`, `step/estimates/counts`)와 일치. `renderBandit`·`runTraining`·`isCleared` 시그니처 교차 확인 완료. config 키(`trainSteps/evalSteps/epsilon/seed/env.arms[mean,std,label,emoji]`)가 Python 읽기와 일치. ✅
