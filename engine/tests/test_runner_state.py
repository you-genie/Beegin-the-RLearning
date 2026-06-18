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


MAZE_43 = ["H.....", ".####.", ".#....", ".#.##.", ".....F"]


def cfg43():
    return {
        "env": {"type": "grid", "layout": MAZE_43, "deliver": True, "playerFn": "both"},
        "alpha": 0.4, "gamma": 0.95, "epsilon": 0.2,
        "episodes": 300, "maxSteps": 60, "seed": 0,
    }


GOOD_STATE = "def state(obs):\n    return (obs['row'], obs['col'], obs['carrying'])\n"
BAD_STATE = "def state(obs):\n    return (obs['row'], obs['col'])\n"
SHAPED = ("def reward(obs):\n    if obs['delivered']:\n        return 1.0\n"
          "    return 0.1*(obs['prev_dist_goal']-obs['dist_goal'])\n")
SPARSE = "def reward(obs):\n    if obs['delivered']:\n        return 1.0\n    return 0.0\n"


def test_43_needs_both_state_and_reward():
    assert run_training(GOOD_STATE + SHAPED, cfg43())["successRate"] >= 0.8
    assert run_training(GOOD_STATE + SPARSE, cfg43())["successRate"] < 0.5  # 보상 부실
    assert run_training(BAD_STATE + SHAPED, cfg43())["successRate"] < 0.5   # 상태 부실


def test_43_missing_one_function_errors():
    assert run_training(GOOD_STATE, cfg43())["ok"] is False   # reward 없음
    assert run_training(SHAPED, cfg43())["ok"] is False       # state 없음
