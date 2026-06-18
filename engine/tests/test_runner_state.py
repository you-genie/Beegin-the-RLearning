from engine.runner import run_training

MAZE_41 = ["H...", ".##.", ".##.", "...F"]
MAZE_42 = ["H....", ".###.", ".....", ".###.", "....F"]


def cfg41():
    return {
        "env": {"type": "grid", "layout": MAZE_41, "deliver": True, "playerFn": "state"},
        "alpha": 0.4, "gamma": 0.95, "epsilon": 0.2,
        "episodes": 400, "maxSteps": 50, "seed": 0,
    }


def cfg42():
    return {
        "env": {"type": "grid", "layout": MAZE_42, "deliver": False,
                "playerFn": "state", "noiseStates": 1000},
        "alpha": 0.4, "gamma": 0.95, "epsilon": 0.2,
        "episodes": 200, "maxSteps": 40, "seed": 0,
    }


def test_41_position_only_fails_carrying_fixes():
    pos = "def state(obs):\n    return (obs['row'], obs['col'])\n"
    full = "def state(obs):\n    return (obs['row'], obs['col'], obs['carrying'])\n"
    assert run_training(pos, cfg41())["successRate"] < 0.5
    assert run_training(full, cfg41())["successRate"] >= 0.8


def test_42_noise_blows_up_state_compact_fixes():
    noisy = "def state(obs):\n    return (obs['row'], obs['col'], obs['noise'])\n"
    compact = "def state(obs):\n    return (obs['row'], obs['col'])\n"
    assert run_training(noisy, cfg42())["successRate"] < 0.5
    assert run_training(compact, cfg42())["successRate"] >= 0.8


def test_missing_state_returns_error():
    res = run_training("x = 1\n", cfg41())
    assert res["ok"] is False
    assert "state" in res["error"]
