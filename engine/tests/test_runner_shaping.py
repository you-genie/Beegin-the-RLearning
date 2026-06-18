from engine.runner import run_training

MAZE_31 = ["H.....", ".####.", ".#....", ".#.##.", ".....F"]
MAZE_32 = ["H....", ".....", "..#..", ".....", "....F"]
MAZE_33 = ["H......", ".####.#", ".#...#.", ".#.#.#.", ".#.#...", ".#.###.", ".....#F"]


def cfg(layout, episodes, max_steps, seed):
    return {
        "env": {"type": "grid", "layout": layout, "deliver": False},
        "alpha": 0.4, "gamma": 0.95, "epsilon": 0.25,
        "episodes": episodes, "maxSteps": max_steps, "seed": seed,
    }


SPARSE = "def reward(obs):\n    return 1.0 if obs['reached_flower'] else 0.0\n"
SHAPED = ("def reward(obs):\n"
          "    if obs['reached_flower']:\n        return 1.0\n"
          "    return 0.1 * (obs['prev_dist'] - obs['dist'])\n")
FARM = ("def reward(obs):\n"
        "    if obs['reached_flower']:\n        return 1.0\n"
        "    return 0.5 / (obs['dist'] + 1)\n")


def test_obs_exposes_distance():
    seen = {}
    src = ("def reward(obs):\n"
           "    seen['has'] = ('dist' in obs and 'prev_dist' in obs)\n"
           "    return 0.0\n")
    ns = {"seen": seen}
    exec(src, ns)
    # smoke: run a tiny grid and ensure no crash with dist usage
    res = run_training(SHAPED, cfg(MAZE_31, 20, 30, 0))
    assert res["ok"] is True


def test_31_sparse_fails_shaping_succeeds():
    sparse = run_training(SPARSE, cfg(MAZE_31, 120, 50, 0))
    shaped = run_training(SHAPED, cfg(MAZE_31, 120, 50, 0))
    assert sparse["successRate"] < 0.7
    assert shaped["successRate"] >= 0.8


def test_32_proximity_farm_is_hacked_difference_fixes():
    farm = run_training(FARM, cfg(MAZE_32, 300, 60, 1))
    diff = run_training(SHAPED, cfg(MAZE_32, 300, 60, 1))
    assert farm["successRate"] < 0.7
    assert diff["successRate"] >= 0.8


def test_33_big_maze_needs_shaping():
    sparse = run_training(SPARSE, cfg(MAZE_33, 200, 70, 3))
    shaped = run_training(SHAPED, cfg(MAZE_33, 200, 70, 3))
    assert sparse["successRate"] < 0.7
    assert shaped["successRate"] >= 0.8
