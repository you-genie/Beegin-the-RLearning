class Bandit:
    """여러 꽃밭(arm). 각 꽃밭은 평균/표준편차를 가진 확률적 꿀 분포."""

    def __init__(self, arms, rng):
        # arms: list of {"mean": float, "std": float}
        self.means = [a["mean"] for a in arms]
        self.stds = [a["std"] for a in arms]
        self.rng = rng
        self.n = len(arms)

    def pull(self, arm):
        """꽃밭을 고르면 확률적으로 꿀을 반환 (음수는 0으로 자른다)."""
        nectar = self.rng.gauss(self.means[arm], self.stds[arm])
        return max(0.0, nectar)

    def best_arm(self):
        """기댓값(평균) 기준 진짜 최고 꽃밭 인덱스."""
        best = 0
        for i in range(self.n):
            if self.means[i] > self.means[best]:
                best = i
        return best
