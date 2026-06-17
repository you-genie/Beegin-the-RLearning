import random
from engine.gridworld import GridWorld

LAYOUT = [
    "H...",
    ".##.",
    ".##.",
    "...F",
]


def test_parses_special_cells():
    env = GridWorld(LAYOUT, random.Random(0))
    assert env.home == (0, 0)
    assert env.flower == (3, 3)
    assert (1, 1) in env.walls and (2, 2) in env.walls
    assert env.n_cells == 16
    assert env.n_actions == 4


def test_cell_index():
    env = GridWorld(LAYOUT, random.Random(0))
    assert env.cell_index((0, 0)) == 0
    assert env.cell_index((3, 3)) == 15
    assert env.cell_index((1, 0)) == 4


def test_step_blocked_by_wall_and_boundary():
    env = GridWorld(LAYOUT, random.Random(0))
    # (0,1) 아래는 벽(1,1) → 제자리
    assert env.step_pos((0, 1), 1) == (0, 1)
    # (0,0) 위로는 경계 → 제자리
    assert env.step_pos((0, 0), 0) == (0, 0)
    # (0,0) 오른쪽은 자유 → 이동
    assert env.step_pos((0, 0), 3) == (0, 1)


def test_webs_are_parsed_and_passable():
    env = GridWorld(["H.WF"], random.Random(0))
    assert (0, 2) in env.webs
    # 거미줄 칸으로 이동은 가능(벽이 아님)
    assert env.step_pos((0, 1), 3) == (0, 2)
