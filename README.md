# 🐝 Beegin the RLearning

> 진짜 Python으로 **강화학습(RL)을 직접 설계**하고, 내가 짠 코드가 진짜 꿀벌을 학습시키는 걸 지켜보는 코딩 퍼즐 게임.

*The Farmer Was Replaced* 에서 영감을 받았지만, 자동화 대신 **강화학습**을 다룹니다. 플레이어는 `reward()` 함수를 작성하고, 그 코드가 브라우저 안에서 실제로 에이전트를 학습시키며, 양봉장 월드에서 학습 과정이 눈앞에 펼쳐집니다. 레벨이 오를수록 RL의 발전사를 따라 설계할 것들이 늘어납니다.

## ✨ 특징

- **진짜 코드, 진짜 실행** — Pyodide로 브라우저에서 실제 Python을 돌립니다. DSL 흉내가 아닙니다.
- **학습이 눈에 보임** — 밴딧 가치 막대, Q값 히트맵, 정책 화살표, 벌의 경로 애니메이션.
- **개념 → 코드 → 이름표** — 용어를 먼저 던지지 않고, 상황을 먼저 겪게 한 뒤 클리어하면 RL 용어를 알려줍니다.
- **클리어 = 정량 기준** — "학습된 에이전트의 성공률 ≥ 기준치"면 통과.
- 시뮬레이션 속도 조절, 레벨별 개념/문서, 레벨 자유 이동.

## 🚀 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 표시된 주소(기본 `http://localhost:5173`)를 열면 됩니다. 첫 실행 때 Pyodide(브라우저용 Python)를 CDN에서 받느라 몇 초 걸립니다.

```bash
npm run build     # 프로덕션 빌드
npm test          # TS 단위 테스트 (vitest)
python3 -m pytest engine/tests   # Python 엔진 테스트
```

## 🎮 게임 구조

레벨은 RL의 역사 흐름을 따라갑니다. 챕터당 3개의 서브레벨로 개념을 하나씩 도입합니다.

| 챕터 | 주제 | 서브레벨 |
|------|------|----------|
| **1. 일벌의 선택** | 멀티암드 밴딧 | 보상 설계 · 탐험 vs 활용 · 보상 해킹 |
| **2. 꿀 배달** | Q-learning (그리드) | 길찾기(TD) · 집까지 배달(상태) · 거미줄 피하기(패널티) |
| 3~ (예정) | 보상 셰이핑 → 표현 → 함수근사 → 정책 → 심층 RL → 멀티에이전트 → 환경 설계 | |

## 🛠 기술 스택

| 영역 | 사용 |
|------|------|
| 빌드 | Vite + TypeScript (프레임워크 없음) |
| RL 실행 | Pyodide (브라우저 내 Python) |
| 코드 에디터 | Monaco Editor |
| 시각화 | Canvas 2D + [Twemoji](https://github.com/jdecked/twemoji) 아이콘 |
| 테스트 | pytest (엔진) · vitest (TS) |

**핵심 설계**: RL 엔진은 순수 Python 표준 라이브러리만 사용합니다. 덕분에 Pyodide에 올리는 그 코드를 CPython에서 `pytest`로 그대로 테스트할 수 있습니다. UI와 엔진은 `run_training()`이 돌려주는 JSON 결과로만 연결됩니다.

## 📁 프로젝트 구조

```
engine/                 # 순수 Python RL 엔진 (pytest로 검증)
  bandit.py  agent.py   #   밴딧 환경 + ε-greedy
  gridworld.py q_agent.py #  그리드 환경 + 표 기반 Q-learning
  runner.py             #   run_training(player_source, config) — env 종류로 분기
src/
  types.ts              # 공유 타입 (Level, EngineConfig, EngineResult)
  levels/               # 레벨 = 데이터 (chapter1.ts, chapter2.ts)
  runtime.ts            # Pyodide 로드 + 엔진 주입 + 실행
  monaco.ts             # 코드 에디터
  renderer.ts           # 밴딧 시각화
  grid_renderer.ts      # 그리드 시각화 (히트맵·정책·벌)
  icons.ts              # Twemoji 아이콘 로더
  scoring.ts            # 클리어 판정
  main.ts               # 앱 셸 (Show→Code→Name it + 진행도)
```

## 🧩 챕터 추가하기

1. `engine/`에 새 환경 모듈을 만들고, `runner.py`의 `run_training`에 `env.type` 분기를 추가합니다. (엔진은 순수 stdlib로 유지 → pytest로 검증)
2. 플레이어는 계속 `reward(obs)`를 작성합니다. `obs`에는 환경별로 의미 있는 키를 담습니다.
3. `src/levels/`에 새 챕터 데이터(`Level[]`)를 추가하고 `main.ts`에서 합칩니다.
4. 필요하면 env 종류에 맞는 렌더러를 추가하고 `main.ts`에서 분기합니다.
5. **새 `.py` 파일은 `src/runtime.ts`에도 등록**해야 Pyodide가 import 합니다. (`?raw` import + `pyodide.FS.writeFile`)

## 🙏 크레딧

- 아이콘: [Twemoji](https://github.com/jdecked/twemoji) (CC-BY 4.0)
- 브라우저 Python: [Pyodide](https://pyodide.org)
