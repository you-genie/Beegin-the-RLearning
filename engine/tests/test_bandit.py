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
