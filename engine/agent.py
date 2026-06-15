class EpsilonGreedy:
    """행동 가치(추정 꿀)를 증분 평균으로 학습하는 ε-greedy 에이전트."""

    def __init__(self, n_arms, epsilon, rng):
        self.n = n_arms
        self.epsilon = epsilon
        self.rng = rng
        self.estimates = [0.0] * n_arms
        self.counts = [0] * n_arms

    def choose(self):
        if self.rng.random() < self.epsilon:
            return self.rng.randrange(self.n)
        return self.choose_greedy()

    def choose_greedy(self):
        best = 0
        for i in range(self.n):
            if self.estimates[i] > self.estimates[best]:
                best = i
        return best

    def update(self, arm, reward):
        self.counts[arm] += 1
        # 증분 평균: Q <- Q + (1/n)(r - Q)
        self.estimates[arm] += (reward - self.estimates[arm]) / self.counts[arm]
