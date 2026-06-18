class GridWorld:
    """간단한 격자 세계.

    레이아웃 문자:
      '.' 빈칸,  '#' 벽,  'H' 집(시작),  'F' 꽃(목표),  'W' 거미줄(위험, 지나갈 수는 있음)
    행동: 0=위, 1=아래, 2=왼쪽, 3=오른쪽. 벽/경계로는 못 가고 제자리.
    """

    def __init__(self, layout, rng):
        self.rng = rng
        self.rows = len(layout)
        self.cols = len(layout[0])
        self.layout = layout
        self.walls = set()
        self.webs = set()
        self.home = None
        self.flower = None
        for r in range(self.rows):
            for c in range(self.cols):
                ch = layout[r][c]
                if ch == '#':
                    self.walls.add((r, c))
                elif ch == 'W':
                    self.webs.add((r, c))
                elif ch == 'H':
                    self.home = (r, c)
                elif ch == 'F':
                    self.flower = (r, c)
        self.n_cells = self.rows * self.cols
        self.n_actions = 4

    def cell_index(self, pos):
        return pos[0] * self.cols + pos[1]

    def free_cells(self):
        return [(r, c)
                for r in range(self.rows)
                for c in range(self.cols)
                if (r, c) not in self.walls]

    def distance_map(self):
        """각 칸에서 꽃까지의 최단거리. 보상 셰이핑용."""
        return self.distance_map_from(self.flower)

    def distance_map_from(self, target):
        """각 칸에서 target까지의 진짜 최단거리(벽 우회 포함)를 BFS로 계산.
        도달 불가/벽 칸은 큰 값."""
        from collections import deque
        inf = self.n_cells + 1
        dist = [inf] * self.n_cells
        if target is None:
            return dist
        start = target
        dist[self.cell_index(start)] = 0
        q = deque([start])
        while q:
            r, c = q.popleft()
            d = dist[self.cell_index((r, c))]
            for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nr, nc = r + dr, c + dc
                if (0 <= nr < self.rows and 0 <= nc < self.cols
                        and (nr, nc) not in self.walls
                        and dist[self.cell_index((nr, nc))] > d + 1):
                    dist[self.cell_index((nr, nc))] = d + 1
                    q.append((nr, nc))
        return dist

    def step_pos(self, pos, action):
        r, c = pos
        if action == 0:
            nr, nc = r - 1, c
        elif action == 1:
            nr, nc = r + 1, c
        elif action == 2:
            nr, nc = r, c - 1
        else:
            nr, nc = r, c + 1
        if (nr < 0 or nr >= self.rows or nc < 0 or nc >= self.cols
                or (nr, nc) in self.walls):
            return pos  # 벽/경계면 제자리
        return (nr, nc)
