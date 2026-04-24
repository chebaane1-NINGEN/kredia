package com.kredia.dto.reclamation;

public record RiskFeatures(
        Long userId,

        // complaint-level
        int complaintsLast90d,
        int messageLen,

        // finance
        double walletBalance,
        double walletFrozenBalance,

        // credit
        boolean creditHasActive,
        int creditInstallmentsMissed,
        int creditDaysLate
) {
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long userId;
        private int complaintsLast90d;
        private int messageLen;
        private double walletBalance;
        private double walletFrozenBalance;
        private boolean creditHasActive;
        private int creditInstallmentsMissed;
        private int creditDaysLate;

        public Builder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public Builder complaintsLast90d(int complaintsLast90d) {
            this.complaintsLast90d = complaintsLast90d;
            return this;
        }

        public Builder messageLen(int messageLen) {
            this.messageLen = messageLen;
            return this;
        }

        public Builder walletBalance(double walletBalance) {
            this.walletBalance = walletBalance;
            return this;
        }

        public Builder walletFrozenBalance(double walletFrozenBalance) {
            this.walletFrozenBalance = walletFrozenBalance;
            return this;
        }

        public Builder creditHasActive(boolean creditHasActive) {
            this.creditHasActive = creditHasActive;
            return this;
        }

        public Builder creditInstallmentsMissed(int creditInstallmentsMissed) {
            this.creditInstallmentsMissed = creditInstallmentsMissed;
            return this;
        }

        public Builder creditDaysLate(int creditDaysLate) {
            this.creditDaysLate = creditDaysLate;
            return this;
        }

        public RiskFeatures build() {
            return new RiskFeatures(
                userId,
                complaintsLast90d,
                messageLen,
                walletBalance,
                walletFrozenBalance,
                creditHasActive,
                creditInstallmentsMissed,
                creditDaysLate
            );
        }
    }
}
