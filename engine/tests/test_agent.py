import random
from engine.agent import EpsilonGreedy


def test_update_tracks_incremental_mean():
    a = EpsilonGreedy(2, 0.0, random.Random(0))
    a.update(0, 1.0)
    a.update(0, 3.0)
    assert abs(a.estimates[0] - 2.0) < 1e-9
    assert a.counts[0] == 2


def test_greedy_picks_highest_estimate():
    a = EpsilonGreedy(3, 0.0, random.Random(0))
    a.estimates = [0.1, 0.9, 0.2]
    assert a.choose_greedy() == 1


def test_epsilon_zero_is_greedy():
    a = EpsilonGreedy(3, 0.0, random.Random(0))
    a.estimates = [0.0, 0.0, 1.0]
    assert all(a.choose() == 2 for _ in range(20))
