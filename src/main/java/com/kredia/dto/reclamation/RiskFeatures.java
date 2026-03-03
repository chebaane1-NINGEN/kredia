package com.kredia.dto.reclamation;

import lombok.Builder;

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
                int creditDaysLate) {
}
