from engine.runner import run_training

MAZE = ["H...", ".##.", ".##.", "...F"]


def _grid_config(layout, deliver=False, seed=0):
    return {
        "env": {"type": "grid", "layout": layout, "deliver": deliver},
        "alpha": 0.3, "gamma": 0.95, "epsilon": 0.2,
        "episodes": 600, "maxSteps": 40, "seed": seed,
    }


def test_reach_flower_learns():
    src = "def reward(obs):\n    return 1.0 if obs['reached_flower'] else 0.0\n"
    res = run_training(src, _grid_config(MAZE))
    assert res["ok"] is True
    assert res["successRate"] >= 0.8
    assert len(res["history"]) > 0
    assert "values" in res["history"][0] and "policy" in res["history"][0]
    assert len(res["rollout"]) >= 2


def test_zero_reward_does_not_learn():
    src = "def reward(obs):\n    return 0.0\n"
    res = run_training(src, _grid_config(MAZE))
    assert res["ok"] is True
    assert res["successRate"] < 0.5


def test_deliver_requires_return_home():
    src = "def reward(obs):\n    return 1.0 if obs['delivered'] else 0.0\n"
    res = run_training(src, _grid_config(MAZE, deliver=True))
    assert res["ok"] is True
    assert res["successRate"] >= 0.8


def test_web_penalty_enables_avoidance():
    layout = ["H.WF", "....", "....", "...."]
    src = ("def reward(obs):\n"
           "    if obs['hit_web']:\n"
           "        return -1.0\n"
           "    return 1.0 if obs['reached_flower'] else 0.0\n")
    res = run_training(src, _grid_config(layout))
    assert res["ok"] is True
    assert res["successRate"] >= 0.8


def test_missing_reward_returns_error():
    res = run_training("x = 1\n", _grid_config(MAZE))
    assert res["ok"] is False
    assert "reward" in res["error"]
