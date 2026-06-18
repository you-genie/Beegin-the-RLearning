import random

from engine.bandit import Bandit
from engine.agent import EpsilonGreedy
from engine.gridworld import GridWorld


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
#
# Q테이블을 dict로 두어 상태 키를 자유롭게 쓴다. 챕터 1~3은 reward를, 챕터 4는
# state(obs)를 플레이어가 작성한다(reward는 엔진 기본값 사용).

def _run_grid(player_source, config):
    err = {"ok": False, "successRate": 0.0, "history": [], "rollout": []}
    try:
        ns = {}
        exec(player_source, ns)
    except Exception as e:
        return {**err, "error": "코드 오류: " + str(e)}

    reward_fn = ns.get("reward")
    state_fn = ns.get("state")
    player_fn = config["env"].get("playerFn", "reward")
    if player_fn in ("reward", "both") and reward_fn is None:
        return {**err, "error": "reward(obs) 함수를 정의해주세요."}
    if player_fn in ("state", "both") and state_fn is None:
        return {**err, "error": "state(obs) 함수를 정의해주세요."}

    rng = random.Random(config["seed"])
    env = GridWorld(config["env"]["layout"], rng)
    deliver = bool(config["env"].get("deliver", False))
    dmap = env.distance_map()
    dmap_home = env.distance_map_from(env.home)
    n_actions = env.n_actions
    alpha = config["alpha"]
    gamma = config["gamma"]
    epsilon = config["epsilon"]
    episodes = config["episodes"]
    max_steps = config["maxSteps"]
    noise_k = config["env"].get("noiseStates", 0)  # >0이면 무작위 'wind' 특징 추가

    def sample_wind():
        return rng.randrange(noise_k) if noise_k else 0

    Q = {}

    def qmax(s):
        return max((Q.get((s, a), 0.0) for a in range(n_actions)), default=0.0)

    def qbest(s):
        best, bv = 0, Q.get((s, 0), 0.0)
        for a in range(n_actions):
            v = Q.get((s, a), 0.0)
            if v > bv:
                bv, best = v, a
        return best

    def choose(s):
        if rng.random() < epsilon:
            return rng.randrange(n_actions)
        return qbest(s)

    def situation(pos, carrying, steps, wind):
        sit = {"row": pos[0], "col": pos[1],
               "carrying": carrying, "steps": steps}
        if noise_k:
            sit["noise"] = wind  # 매 스텝 무작위로 바뀌는, 길찾기와 무관한 값
        return sit

    def get_state(pos, carrying, steps, wind=0):
        if state_fn is None:
            return env.cell_index(pos) * 2 + (1 if carrying else 0)
        return state_fn(situation(pos, carrying, steps, wind))

    def builtin_reward(obs):
        # 챕터4(상태 설계)용 기본 보상. 보상이 변수가 되지 않도록 충분히 친절하게:
        # 도달 과제는 거리 셰이핑을 깔아 좋은 상태면 쉽게 배우게 한다.
        if obs["done"]:
            return 1.0
        if not deliver:
            return 0.1 * (obs["prev_dist"] - obs["dist"])
        return 0.0

    def get_reward(obs):
        return float(reward_fn(obs)) if reward_fn is not None else builtin_reward(obs)

    def snapshot(step):
        values, policy = [], []
        for cell in range(env.n_cells):
            pos = (cell // env.cols, cell % env.cols)
            s = get_state(pos, False, 0)
            values.append(qmax(s))
            policy.append(qbest(s))
        return {"step": step, "values": values, "policy": policy}

    def rollout():
        pos, carrying = env.home, False
        path = [env.cell_index(pos)]
        for t in range(max_steps):
            a = qbest(get_state(pos, carrying, t, sample_wind()))
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

    def evaluate():
        starts = [p for p in env.free_cells()
                  if p != env.flower and p not in env.webs]
        if not starts:
            return 0.0
        hits = 0
        for start in starts:
            pos, carrying = start, False
            touched_web = pos in env.webs
            reached = False
            for t in range(max_steps):
                a = qbest(get_state(pos, carrying, t, sample_wind()))
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

    snapshot_every = max(1, episodes // 40)
    history = []
    start_cells = [p for p in env.free_cells() if p != env.flower]

    try:
        for ep in range(episodes):
            pos = start_cells[rng.randrange(len(start_cells))]  # 탐험적 시작
            carrying = False
            w = sample_wind()
            for t in range(max_steps):
                s = get_state(pos, carrying, t, w)
                a = choose(s)
                npos = env.step_pos(pos, a)
                reached_flower = (npos == env.flower)
                reached_home = (npos == env.home)
                ncarrying = carrying or (deliver and reached_flower)
                delivered = deliver and reached_home and carrying
                done = delivered if deliver else reached_flower
                # 현재 목표까지의 거리: 배달 중(꿀 보유)이면 집, 아니면 꽃 기준
                prev_goal = dmap_home if carrying else dmap
                new_goal = dmap_home if ncarrying else dmap
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
                    "dist_goal": new_goal[env.cell_index(npos)],
                    "prev_dist_goal": prev_goal[env.cell_index(pos)],
                }
                r = get_reward(obs)
                w2 = sample_wind()
                s2 = get_state(npos, ncarrying, t + 1, w2)
                target = r if done else r + gamma * qmax(s2)
                Q[(s, a)] = Q.get((s, a), 0.0) + alpha * (target - Q.get((s, a), 0.0))
                pos = npos
                carrying = ncarrying
                w = w2
                if done:
                    break
            if ep % snapshot_every == 0:
                history.append(snapshot(ep))
    except Exception as e:
        return {**err, "error": "함수 실행 오류: " + str(e), "history": history}

    history.append(snapshot(episodes))
    return {"ok": True, "error": None, "successRate": evaluate(),
            "history": history, "rollout": rollout()}
