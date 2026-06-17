class TabularQ:
    """표 기반 Q-learning 에이전트.
    Q(s,a) <- Q(s,a) + alpha * (r + gamma * max_a' Q(s',a') - Q(s,a))
    """

    def __init__(self, n_states, n_actions, alpha, gamma, epsilon, rng):
        self.q = [[0.0] * n_actions for _ in range(n_states)]
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.rng = rng
        self.n_actions = n_actions

    def choose(self, s):
        if self.rng.random() < self.epsilon:
            return self.rng.randrange(self.n_actions)
        return self.greedy(s)

    def greedy(self, s):
        row = self.q[s]
        best = 0
        for a in range(self.n_actions):
            if row[a] > row[best]:
                best = a
        return best

    def update(self, s, a, r, ns, done):
        target = r if done else r + self.gamma * max(self.q[ns])
        self.q[s][a] += self.alpha * (target - self.q[s][a])
