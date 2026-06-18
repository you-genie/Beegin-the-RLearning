import random

from engine.bandit import Bandit
from engine.agent import EpsilonGreedy
from engine.gridworld import GridWorld
from engine.q_agent import TabularQ


def _make_reward(player_source):
    """플레이어 코드를 실행해 reward 함수를 추출."""
    namespace = {}
    exec(player_source, namespace)
    fn = namespace.get("reward")
    if fn is None:
        raise ValueError("reward(obs) 함수를 정의해주세요.")
    return fn


def run_training(player_source, config):
    """환경 종류에 따라 학습을 실행하고 결과 dict를 반환."""
    env_type = config["env"]["type"]
    if env_type == "bandit":
        return _run_bandit(player_source, config)
    if env_type == "grid":
        return _run_grid(player_source, config)
    return {"ok": False, "error": "알 수 없는 환경: " + str(env_type),
            "successRate": 0.0, "history": []}


# ---------------------------------------------------------------- bandit

def _run_bandit(player_source, config):
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


# ---------------------------------------------------------------- grid

def _state_of(env, pos, carrying):
    """셀 + 꿀 소지 여부를 하나의 상태 인덱스로 인코딩."""
    return env.cell_index(pos) * 2 + (1 if carrying else 0)


def _grid_snapshot(step, env, agent):
    """carrying=0 슬라이스의 칸별 maxQ와 최적 행동을 기록 (시각화용)."""
    values = []
    policy = []
    for cell in range(env.n_cells):
        row = agent.q[cell * 2]
        mx = max(row)
        best = 0
        for a in range(env.n_actions):
            if row[a] > row[best]:
                best = a
        values.append(mx)
        policy.append(best)
    return {"step": step, "values": values, "policy": policy}


def _grid_rollout(env, agent, deliver, max_steps):
    """집에서 출발해 탐욕적으로 움직인 경로(셀 인덱스 목록). 애니메이션용."""
    pos = env.home
    carrying = False
    path = [env.cell_index(pos)]
    for _ in range(max_steps):
        a = agent.greedy(_state_of(env, pos, carrying))
        npos = env.step_pos(pos, a)
        if deliver and npos == env.flower:
            carrying = True
        path.append(env.cell_index(npos))
        done = ((deliver and carrying and npos == env.home)
                or (not deliver and npos == env.flower))
        pos = npos
        if done:
            break
    return path


def _grid_eval(env, agent, deliver, max_steps):
    """모든 자유 칸(꽃/거미줄 제외)에서 탐욕적으로 출발해 목표 도달 비율.
    거미줄을 밟고 지나간 경로는 실패로 친다(2-3에서 회피를 강제)."""
    starts = [p for p in env.free_cells()
              if p != env.flower and p not in env.webs]
    if not starts:
        return 0.0
    hits = 0
    for start in starts:
        pos = start
        carrying = False
        touched_web = pos in env.webs
        reached = False
        for _ in range(max_steps):
            a = agent.greedy(_state_of(env, pos, carrying))
            npos = env.step_pos(pos, a)
            if npos in env.webs:
                touched_web = True
            if deliver and npos == env.flower:
                carrying = True
            done = ((deliver and carrying and npos == env.home)
                    or (not deliver and npos == env.flower))
            pos = npos
            if done:
                reached = True
                break
        if reached and not touched_web:
            hits += 1
    return hits / len(starts)


def _run_grid(player_source, config):
    try:
        reward_fn = _make_reward(player_source)
    except Exception as e:
        return {"ok": False, "error": "코드 오류: " + str(e),
                "successRate": 0.0, "history": [], "rollout": []}

    rng = random.Random(config["seed"])
    env = GridWorld(config["env"]["layout"], rng)
    deliver = bool(config["env"].get("deliver", False))
    dmap = env.distance_map()
    agent = TabularQ(env.n_cells * 2, env.n_actions,
                     config["alpha"], config["gamma"], config["epsilon"], rng)

    episodes = config["episodes"]
    max_steps = config["maxSteps"]
    snapshot_every = max(1, episodes // 40)
    history = []
    start_cells = [p for p in env.free_cells() if p != env.flower]

    try:
        for ep in range(episodes):
            pos = start_cells[rng.randrange(len(start_cells))]  # 탐험적 시작
            carrying = False
            for t in range(max_steps):
                s = _state_of(env, pos, carrying)
                a = agent.choose(s)
                npos = env.step_pos(pos, a)
                reached_flower = (npos == env.flower)
                reached_home = (npos == env.home)
                ncarrying = carrying or (deliver and reached_flower)
                delivered = deliver and reached_home and carrying
                done = delivered if deliver else reached_flower
                obs = {
                    "reached_flower": reached_flower,
                    "reached_home": reached_home,
                    "delivered": delivered,
                    "carrying": carrying,
                    "hit_web": npos in env.webs,
                    "moved": npos != pos,
                    "done": done,
                    "steps": t,
                    "dist": dmap[env.cell_index(npos)],
                    "prev_dist": dmap[env.cell_index(pos)],
                }
                r = float(reward_fn(obs))
                ns = _state_of(env, npos, ncarrying)
                agent.update(s, a, r, ns, done)
                pos = npos
                carrying = ncarrying
                if done:
                    break
            if ep % snapshot_every == 0:
                history.append(_grid_snapshot(ep, env, agent))
    except Exception as e:
        return {"ok": False, "error": "reward() 오류: " + str(e),
                "successRate": 0.0, "history": history, "rollout": []}

    history.append(_grid_snapshot(episodes, env, agent))
    success_rate = _grid_eval(env, agent, deliver, max_steps)
    rollout = _grid_rollout(env, agent, deliver, max_steps)

    return {"ok": True, "error": None, "successRate": success_rate,
            "history": history, "rollout": rollout}
