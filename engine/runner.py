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
