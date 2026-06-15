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
